import { Link, useNavigate } from 'react-router-dom';
import zdj from '../assets/ars.jpg';
import { removeSecureCookie } from '../utils/Cookies';

function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        removeSecureCookie('isAuthenticated');
        removeSecureCookie('access_level');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-ars-whitegrey">
            <nav className="bg-ars-lightblue shadow-md">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img
                                src={zdj}
                                alt="Logo"
                                className="h-8 w-auto mr-4"
                            />
                        </div>

                        <div className="flex items-center space-x-4 md:space-x-8">
                            <Link
                                to="/a"
                                className="text-white hover:text-ars-whitegrey px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                Woda
                            </Link>
                            <Link
                                to="/b"
                                className="text-white hover:text-ars-whitegrey px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                Prąd
                            </Link>
                            <Link
                                to="/c"
                                className="text-white hover:text-ars-whitegrey px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                Gaz
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-white hover:text-ars-whitegrey px-3 py-2 text-sm font-medium transition duration-200 border border-white rounded-md"
                            >
                                Wyloguj
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="p-4">
                <p className="text-ars-darkgrey">Home Page Content</p>
            </div>
        </div>
    );
}

export default Home;