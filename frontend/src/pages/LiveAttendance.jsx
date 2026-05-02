import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
    Video, VideoOff, Play, Square, Users, CheckCircle,
    Loader2, BookOpen, AlertCircle, RefreshCw, Wifi, WifiOff, Camera,
    Monitor, CloudOff, CloudUpload
} from 'lucide-react';
import { toast } from 'react-toastify';
import { subjectService, attendanceService, faceService } from '../services/apiService';
import cameraService from '../services/camera.service';
import axiosAuth from '../services/apiService';
import offlineService from '../services/offline.service';
import useNetworkStatus from '../hooks/useNetworkStatus';

// ─── Badge de asistencia reciente ─────────────────────────────────
const AttendancePill = ({ name, confidence, time }) => (
    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">{name}</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{time} · {Math.round(confidence * 100)}% confianza</p>
        </div>
        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
    </div>
);

const StreamStatus = ({ connected, source }) => (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
        connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
    }`}>
        {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {connected ? `En vivo (${source === 'local' ? 'Local' : 'Servidor'})` : 'Desconectado'}
    </div>
);

// ─── Página principal ──────────────────────────────────────────────
const LiveAttendance = () => {
    const [subjects, setSubjects]           = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isRunning, setIsRunning]         = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [recentAttendances, setRecentAttendances] = useState([]);
    const [totalSession, setTotalSession]   = useState(0);
    const [encodingsCount, setEncodingsCount] = useState(0);
    const [processing, setProcessing]       = useState(false);
    const [lastResult, setLastResult]       = useState(null);
    const [cameraReady, setCameraReady]     = useState(false);
    const [cameraSource, setCameraSource]   = useState('local');
    const [pendingOffline, setPendingOffline] = useState(0); // registros en IndexedDB
    const [syncing, setSyncing]             = useState(false);

    const { isOnline } = useNetworkStatus();

    const webcamRef  = useRef(null);
    const intervalRef = useRef(null);
    const pollRef    = useRef(null);

    // ── Actualizar contador de registros offline pendientes ───────
    const refreshPendingCount = useCallback(async () => {
        const count = await offlineService.getPendingCount();
        setPendingOffline(count);
    }, []);

    // ── Auto-sincronizar cuando vuelve la conexión ────────────────
    useEffect(() => {
        if (!isOnline) return;
        offlineService.getPendingCount().then((count) => {
            if (count === 0) return;
            setSyncing(true);
            offlineService.syncWithBackend()
                .then(({ synced, failed }) => {
                    if (synced > 0) toast.success(`✅ ${synced} asistencia(s) offline sincronizadas`);
                    if (failed > 0)  toast.warn(`⚠️ ${failed} registro(s) no pudieron sincronizarse`);
                    refreshPendingCount();
                })
                .finally(() => setSyncing(false));
        });
    }, [isOnline, refreshPendingCount]);

    // ── Cargar contador offline al montar ─────────────────────────
    useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

    // ── Cargar materias y estado de encodings ─────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [subjectsRes, faceStatusRes] = await Promise.all([
                    subjectService.list({ is_active: true }),
                    faceService.getStatus(),
                ]);
                setSubjects(subjectsRes.subjects);
                setEncodingsCount(faceStatusRes.encodings_in_db);
                
                // Si ya hay una sesión corriendo en el servidor, sincronizar estado
                if (faceStatusRes.camera_running) {
                    setIsRunning(true);
                    setCameraSource('server');
                    // Intentar recuperar la materia activa si es posible
                    const sessionStatus = await faceService.getSessionStatus();
                    if (sessionStatus.subject_id) {
                        const sub = subjectsRes.subjects.find(s => s.id === sessionStatus.subject_id);
                        if (sub) setSelectedSubject(sub);
                        startPolling(sessionStatus.subject_id);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error('Error al conectar con el servidor');
            } finally {
                setLoadingSubjects(false);
            }
        };
        init();
        return () => { stopCapture(); stopPolling(); };
    }, []);

    // ── Polling de asistencias recientes cada 5s ─────────────────
    const startPolling = useCallback((subjectId) => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const res = await attendanceService.list({ subject_id: subjectId, date: today, limit: 20 });
                setRecentAttendances(res.attendances);
                setTotalSession(res.total);
            } catch { /* silencioso */ }
        }, 5000);
    }, []);

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    // ── Captura y envía frame al backend cada 2s (Solo modo local) ─
    const captureAndRecognize = useCallback(async () => {
        if (cameraSource !== 'local' || !webcamRef.current || processing) return;
        
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setProcessing(true);
        try {
            const blob = await cameraService.dataURLtoBlob(imageSrc);
            const data = await cameraService.recognizeFrame(blob, selectedSubject?.id);
            
            if (data.recognized && data.name) {
                setLastResult({ name: data.name, confidence: data.confidence });
                if (selectedSubject) {
                    const today = new Date().toISOString().split('T')[0];
                    const att = await attendanceService.list({ subject_id: selectedSubject.id, date: today, limit: 20 });
                    setRecentAttendances(att.attendances);
                    setTotalSession(att.total);
                }
            } else {
                setLastResult(null);
            }
        } catch (err) {
            // Si el error es de red → encolar en IndexedDB para sincronizar después
            const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';
            if (isNetworkError && selectedSubject && lastResult) {
                await offlineService.queueAttendance({
                    student_id:       lastResult.student_id || null,
                    student_name:     lastResult.name,
                    subject_id:       selectedSubject.id,
                    laboratory_id:    selectedSubject.laboratory_id,
                    confidence_score: lastResult.confidence,
                });
                refreshPendingCount();
                toast.warn('📵 Sin conexión — asistencia guardada localmente', { toastId: 'offline-warn', autoClose: 2000 });
            } else {
                console.error('Frame processing error:', err);
            }
        } finally {
            setProcessing(false);
        }
    }, [processing, selectedSubject, cameraSource, lastResult, refreshPendingCount]);

    const startCapture = useCallback(() => {
        if (cameraSource === 'local') {
            intervalRef.current = setInterval(captureAndRecognize, 2000);
        }
    }, [captureAndRecognize, cameraSource]);

    const stopCapture = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    // ── Iniciar sesión ────────────────────────────────────────────
    const handleStart = async () => {
        if (!selectedSubject) { toast.warn('Selecciona una materia primero'); return; }
        if (encodingsCount === 0) { toast.error('No hay encodings faciales registrados.'); return; }
        
        try {
            if (cameraSource === 'server') {
                // Iniciar sesión en el servidor (abre cámara física del server)
                await faceService.startSession(selectedSubject.id);
            }
            
            setIsRunning(true);
            toast.success(`Sesión iniciada para: ${selectedSubject.name}`);
            
            if (cameraSource === 'local') {
                startCapture();
            }
            startPolling(selectedSubject.id);
            
            // Carga asistencias iniciales
            const today = new Date().toISOString().split('T')[0];
            const res = await attendanceService.list({ subject_id: selectedSubject.id, date: today, limit: 20 });
            setRecentAttendances(res.attendances);
            setTotalSession(res.total);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'No se pudo iniciar la sesión');
        }
    };

    // ── Detener sesión ────────────────────────────────────────────
    const handleStop = async () => {
        try {
            if (cameraSource === 'server') {
                await faceService.stopSession();
            }
            stopCapture();
            stopPolling();
            setIsRunning(false);
            setLastResult(null);
            toast.info('Sesión detenida.');
        } catch (err) {
            toast.error('Error al detener la sesión');
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Banner de estado offline ── */}
            {!isOnline && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                    <CloudOff className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Modo Offline</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            Sin conexión al servidor. Los reconocimientos se guardan localmente y se sincronizarán automáticamente al reconectar.
                        </p>
                    </div>
                    {pendingOffline > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                            {pendingOffline} pendiente{pendingOffline !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {/* ── Banner de sincronización en progreso ── */}
            {isOnline && syncing && (
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-3">
                    <CloudUpload className="h-5 w-5 text-indigo-500 animate-pulse flex-shrink-0" />
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        Sincronizando {pendingOffline} registro{pendingOffline !== 1 ? 's' : ''} offline...
                    </p>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400 ml-auto" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/30">
                            <Video className="h-5 w-5 text-white" />
                        </div>
                        Asistencia en Vivo
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Reconocimiento facial en tiempo real {cameraSource === 'local' ? 'usando tu cámara' : 'usando la cámara del servidor'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <StreamStatus connected={isRunning && (cameraSource === 'server' || cameraReady)} source={cameraSource} />
                    {pendingOffline > 0 && isOnline && !syncing && (
                        <button
                            onClick={() => {
                                setSyncing(true);
                                offlineService.syncWithBackend()
                                    .then(({ synced, failed }) => {
                                        if (synced > 0) toast.success(`✅ ${synced} asistencia(s) sincronizadas`);
                                        if (failed > 0) toast.warn(`⚠️ ${failed} no sincronizados`);
                                        refreshPendingCount();
                                    })
                                    .finally(() => setSyncing(false));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <CloudUpload className="h-3.5 w-3.5" />
                            Sync ({pendingOffline})
                        </button>
                    )}
                </div>
            </div>

            {/* Selector de Fuente */}
            {!isRunning && (
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setCameraSource('local')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            cameraSource === 'local' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Camera className="h-4 w-4" /> Cámara Local (Webcam)
                    </button>
                    <button 
                        onClick={() => setCameraSource('server')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            cameraSource === 'server' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Monitor className="h-4 w-4" /> Cámara del Servidor
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda: controles */}
                <div className="space-y-4">
                    {/* Selector de materia */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500" /> Materia de la Sesión
                        </h3>
                        {loadingSubjects ? (
                            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
                        ) : subjects.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No hay materias activas</p>
                        ) : (
                            <div className="space-y-2">
                                {subjects.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => !isRunning && setSelectedSubject(s)}
                                        disabled={isRunning}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                                            selectedSubject?.id === s.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{s.code}</span>
                                        <p>{s.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="space-y-3">
                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                disabled={!selectedSubject || encodingsCount === 0}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all"
                            >
                                <Play className="h-5 w-5" /> Iniciar Reconocimiento
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
                            >
                                <Square className="h-5 w-5" /> Detener Sesión
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    {isRunning && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-500" /> Estadísticas
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalSession}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Asistencias hoy</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{encodingsCount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Estudiantes</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1">
                                {cameraSource === 'local' ? (
                                    <>
                                        {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        {processing ? 'Procesando frame...' : 'Analizando cada 2s'}
                                    </>
                                ) : (
                                    <>
                                        <Wifi className="h-3 w-3 animate-pulse text-emerald-500" />
                                        Stream activo desde el servidor
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Último reconocimiento (Solo modo local) */}
                    {lastResult && cameraSource === 'local' && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide">Último reconocido</p>
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">{lastResult.name}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{Math.round(lastResult.confidence * 100)}% confianza</p>
                        </div>
                    )}
                </div>

                {/* Columna derecha: cámara + asistencias */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Visor de cámara */}
                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative">
                        {isRunning ? (
                            cameraSource === 'local' ? (
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={cameraService.getVideoConstraints()}
                                    className="w-full h-full object-cover"
                                    onUserMedia={() => setCameraReady(true)}
                                    onUserMediaError={() => {
                                        toast.error('No se pudo acceder a la cámara local.');
                                        handleStop();
                                    }}
                                />
                            ) : (
                                <img 
                                    src={faceService.getLiveFrameUrl()} 
                                    alt="Live Stream"
                                    className="w-full h-full object-cover"
                                    onError={() => {
                                        toast.error('Error al conectar con el stream del servidor');
                                        handleStop();
                                    }}
                                />
                            )
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 border-2 border-gray-700">
                                    <VideoOff className="h-10 w-10 text-gray-500" />
                                </div>
                                <p className="text-gray-400 font-medium">Cámara inactiva</p>
                                <p className="text-gray-600 text-sm mt-1">
                                    {selectedSubject ? 'Presiona "Iniciar Reconocimiento"' : 'Selecciona una materia para comenzar'}
                                </p>
                            </div>
                        )}

                        {/* Indicador LIVE */}
                        {isRunning && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <span className="text-white text-xs font-semibold uppercase">{cameraSource} EN VIVO</span>
                            </div>
                        )}

                        {/* Info materia */}
                        {isRunning && selectedSubject && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center justify-between">
                                <div>
                                    <p className="text-white text-sm font-semibold">{selectedSubject.name}</p>
                                    <p className="text-gray-400 text-xs">{selectedSubject.code} · {selectedSubject.schedule}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                                    <CheckCircle className="h-3.5 w-3.5" /> {totalSession} registros
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Asistencias recientes */}
                    {isRunning && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Registros de Hoy
                                </h3>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" /> Auto-actualiza cada 5s
                                </span>
                            </div>
                            {recentAttendances.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    Esperando reconocimientos... Posiciónate frente a la cámara.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {recentAttendances.map(a => (
                                        <AttendancePill
                                            key={a.id}
                                            name={a.student_name || '—'}
                                            confidence={a.confidence_score}
                                            time={new Date(a.check_in_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveAttendance;

