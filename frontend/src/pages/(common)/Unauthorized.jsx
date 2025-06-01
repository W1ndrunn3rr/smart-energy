import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../scripts/session_manager';

const Unauthorized = () => {
    const navigate = useNavigate();
    const currentLevel = sessionManager.getAccessLevel();

    return (
        <div className="flex justify-center items-center min-h-screen bg-ars-whitegrey">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Brak uprawnień</h2>
                <p className="text-gray-600 mb-4">
                    Nie masz uprawnień do wyświetlenia tej strony.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Twój poziom dostępu: {currentLevel}
                </p>
                <button
                    onClick={() => navigate('/Home')}
                    className="bg-ars-lightblue hover:bg-ars-deepblue text-white py-2 px-4 rounded-md"
                >
                    Powrót do strony głównej
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;