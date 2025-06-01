import { useEffect } from 'react';
import { sessionManager } from '../scripts/session_manager';

export const useSessionRestore = () => {
    useEffect(() => {
        const restoreSession = () => {
            // Automatycznie odśwież sesję - sprawdzi localStorage i cookies
            sessionManager.refreshSession();

            // Sprawdź czy sesja nie wygasła
            if (sessionManager.isSessionExpired()) {
                sessionManager.clearSession();
            }
        };

        restoreSession();
    }, []);
};