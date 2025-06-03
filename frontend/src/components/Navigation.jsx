import { Link, useNavigate } from 'react-router-dom';
import { sessionManager } from '../scripts/session_manager';
import zdj from '../assets/ars.jpg';

const Navigation = () => {
    const navigate = useNavigate();
    const accessLevel = sessionManager.getAccessLevel();
    const userEmail = sessionManager.getUserEmail(); // Assuming getUserEmail() returns the email string

    const handleLogout = () => {
        sessionManager.clearSession();
        navigate('/');
    };

    let navLinks = [];

    if (accessLevel === 1) { // Admin users
        navLinks = [
            { path: '/admin/home', label: 'Strona główna' }, // Link to the main admin dashboard
            { path: '/admin/accounts', label: 'Konta' },
            { path: '/admin/objects', label: 'Obiekty' },
            { path: '/admin/meters', label: 'Liczniki' },
            { path: '/admin/reports', label: 'Raporty' },
        ];
    } else if (accessLevel === 2) {// Other authenticated users
        navLinks = [
            { path: '/manager/home', label: 'Strona główna' },
            { path: '/manager/meters', label: 'Liczniki' },
            { path: '/manager/reports', label: 'Raporty' },
        ];
    } else if (accessLevel === 3) { // Technicians
        navLinks = [
            { path: '/technician/home', label: 'Strona główna' },
            { path: '/technician/addmetter', label: 'Dodaj Licznik' },
        ];
    } else if (accessLevel === 4) {
        navLinks = [
            { path: '/user/home', label: 'Strona główna' },
            { path: '/user/metters', label: 'Podgląd liczników' },
        ];
    }



    return (
        <nav className="bg-ars-deepblue text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <img src={zdj} alt="Logo" className="h-8 w-auto" />
                    {navLinks.map(item => (
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
                    {userEmail && (
                        <span className="text-sm">
                            Witaj, <span className="font-medium">{userEmail}</span>
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