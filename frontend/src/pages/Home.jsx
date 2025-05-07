import { Link, useNavigate } from 'react-router-dom';
import zdj from '../assets/ars.jpg';

function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#e3e3e3]">
            <nav className="bg-[#0057AD] shadow-md">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img
                                src={zdj}
                                alt="Logo"
                                className="h-8 w-auto mr-4"
                            />
                        </div>

                        <div className="flex items-center space-x-8">
                            <Link
                                to="/a"
                                className="text-white hover:text-[#e3e3e3] px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                A
                            </Link>
                            <Link
                                to="/b"
                                className="text-white hover:text-[#e3e3e3] px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                B
                            </Link>
                            <Link
                                to="/c"
                                className="text-white hover:text-[#e3e3e3] px-3 py-2 text-sm font-medium transition duration-200"
                            >
                                C
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-white hover:text-[#e3e3e3] px-3 py-2 text-sm font-medium transition duration-200 border border-white rounded-md"
                            >
                                Wyloguj
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="p-4">
                <p>Home</p>
            </div>
        </div>
    );
}

export default Home;