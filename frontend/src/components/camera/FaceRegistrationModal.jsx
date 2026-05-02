import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { X, Camera, RefreshCw, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import faceService from '../../services/faceService';

const FaceRegistrationModal = ({ isOpen, onClose, student }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Reiniciar estado cuando se abre/cierra
    React.useEffect(() => {
        if (isOpen) {
            setImgSrc(null);
            setSuccess(false);
        }
    }, [isOpen]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    // Helper to convert base64 to Blob
    const dataURLtoBlob = (dataurl) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleUpload = async () => {
        if (!imgSrc || !student) return;
        
        setLoading(true);
        try {
            const blob = dataURLtoBlob(imgSrc);
            await faceService.uploadFace(student.id, blob);
            
            setSuccess(true);
            toast.success('Rostro registrado exitosamente');
            
            // Cerrar automáticamente después de 1.5s
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Error al guardar el rostro';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Registro Facial
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Tomando foto para: <span className="font-bold">{student.first_name} {student.last_name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Asegúrate de tener buena iluminación y mirar directamente a la cámara.</p>
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                            <h4 className="text-lg font-bold text-green-700 dark:text-green-400">¡Rostro guardado!</h4>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-1">Sincronizado con la base de datos.</p>
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                            {!imgSrc ? (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "user" }}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img src={imgSrc} alt="Captura" className="w-full h-full object-cover" />
                            )}
                        </div>
                    )}

                    {/* Controles */}
                    {!success && (
                        <div className="mt-6 flex justify-center gap-4">
                            {!imgSrc ? (
                                <button
                                    onClick={capture}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    <Camera className="h-5 w-5" />
                                    Tomar Foto
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={retake}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Reintentar
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                        Guardar Rostro
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceRegistrationModal;
