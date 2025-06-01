import { Link, useNavigate } from 'react-router-dom';
import zdj from '../../assets/ars.jpg';
import { sessionManager } from '../../scripts/session_manager';

function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionManager.clearSession();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-ars-whitegrey"> {/* Used Tailwind color */}
            <nav className="bg-ars-lightblue shadow-md"> {/* Used Tailwind color */}
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img
                                src={zdj}
                                alt="Logo"
                                className="h-8 w-auto mr-4"
                            />
                        </div>

                        <div className="flex items-center space-x-4 md:space-x-8"> {/* Added responsive spacing */}
                            <Link
                                to="/a" // Consider more descriptive paths
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
                {(() => {
                    const accessLevel = sessionManager.getAccessLevel();
                    const userData = sessionManager.getUserEmail();

                    switch (accessLevel) {
                        case 1:
                            return <h1 className="text-2xl font-bold text-center text-ars-deepblue">Witaj, Administratorze {userData?.email}!</h1>;
                        case 2:
                            return <h1 className="text-2xl font-bold text-center text-ars-deepblue">Witaj, Kierowniku {userData?.email}!</h1>;
                        case 3:
                            return <h1 className="text-2xl font-bold text-center text-ars-deepblue">Witaj, Techniku {userData?.email}!</h1>;
                        case 4:
                            return <h1 className="text-2xl font-bold text-center text-ars-deepblue">Witaj, Gościu {userData?.email}!</h1>;
                        default:
                            return <h1 className="text-2xl font-bold text-center text-ars-deepblue">Witaj!</h1>;
                    }
                })()}
                {/* You can display user info or role here by getting it from cookies if needed */}
            </div>
        </div>
    );
}

export default Home;