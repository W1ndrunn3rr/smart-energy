import { Link, useNavigate } from 'react-router-dom';
import { sessionManager } from '../scripts/session_manager';

const Navigation = () => {
    const navigate = useNavigate();
    const accessLevel = sessionManager.getAccessLevel();
    const userData = sessionManager.getUserEmail();

    const handleLogout = () => {
        sessionManager.clearSession();
        navigate('/');
    };

    const navigationItems = [
        { path: '/Home', label: 'Strona główna', minLevel: 4 },
        { path: '/admin', label: 'Panel Admin', minLevel: 1 },
        { path: '/manager', label: 'Panel Manager', minLevel: 2 },
        { path: '/employee', label: 'Panel Pracownik', minLevel: 3 },
        { path: '/guest', label: 'Panel Gość', minLevel: 4 },
    ];

    const visibleItems = navigationItems.filter(item =>
        sessionManager.hasMinimumAccessLevel(item.minLevel)
    );

    return (
        <nav className="bg-ars-deepblue text-white p-4">
            <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                    {visibleItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="hover:bg-ars-lightblue px-3 py-2 rounded transition-colors duration-200 text-sm font-medium"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center space-x-4">
                    {userData?.email && (
                        <span className="text-sm">
                            Witaj, <span className="font-medium">{userData.email}</span>
                            <span className="text-xs ml-2 px-2 py-1 bg-ars-lightblue rounded">
                                Poziom: {accessLevel}
                            </span>
                        </span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors duration-200 text-sm font-medium"
                    >
                        Wyloguj
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;