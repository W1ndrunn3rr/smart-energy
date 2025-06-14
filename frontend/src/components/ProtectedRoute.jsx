import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../scripts/session_manager';

/**
 * @function ProtectedRoute
 * @param {object} props
 * @param {React.ReactNode} props.children - Komponenty potomne do wyświetlenia jeśli autoryzacja się powiedzie.
 * @param {number|null} [props.requiredAccessLevel=null] - Minimalny poziom dostępu wymagany do wejścia na trasę.
 * @returns {JSX.Element} Komponent chroniący trasę na podstawie sesji i poziomu dostępu.
 */
const ProtectedRoute = ({ children, requiredAccessLevel = null }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            // Odśwież sesję z localStorage/cookies
            sessionManager.refreshSession();

            // Sprawdź czy sesja wygasła
            if (sessionManager.isSessionExpired()) {
                sessionManager.clearSession();
                navigate('/');
                return;
            }

            // Jeśli nie ma sesji, przekieruj na login
            if (!sessionManager.isAuthenticated()) {
                navigate('/');
                return;
            }

            // Sprawdź poziom dostępu
            if (requiredAccessLevel !== null && !sessionManager.hasMinimumAccessLevel(requiredAccessLevel)) {
                navigate('/unauthorized');
                return;
            }

            // Odśwież timestamp sesji dla aktywności użytkownika
            sessionManager.updateSessionTimestamp();
            setIsLoading(false);
        };

        checkAuth();
    }, [navigate, requiredAccessLevel]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">
            <div className="text-lg">Ładowanie...</div>
        </div>;
    }

    return children;
};

export default ProtectedRoute;