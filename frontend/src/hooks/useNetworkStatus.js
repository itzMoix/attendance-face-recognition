/**
 * useNetworkStatus.js
 * Hook para detectar el estado de la conexión en tiempo real.
 * Retorna { isOnline, wasOffline } y dispara eventos al cambiar.
 */
import { useState, useEffect, useRef } from 'react';

const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    // wasOffline = true si en algún momento de la sesión se perdió la conexión
    const wasOfflineRef = useRef(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            wasOfflineRef.current = true;
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, wasOffline: wasOfflineRef.current };
};

export default useNetworkStatus;
