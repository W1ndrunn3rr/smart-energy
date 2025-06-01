import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthFunc from '../../scripts/auth';
import { sessionManager } from '../../scripts/session_manager';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await AuthFunc(formData);
            if (result && result.success) {
                // Ustaw sesję w session managerze (automatycznie ustawi też cookie)
                sessionManager.setSession({
                    access_level: result.access_level,
                    email: result.email,
                    // dodaj inne dane użytkownika jeśli potrzebne
                });

                navigate('/Home');
            } else {
                setError(result?.message || 'Nieprawidłowy login lub hasło');
            }
        } catch (err) {
            console.error('Login page error:', err);
            setError(err.message || 'Wystąpił błąd podczas logowania.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-ars-whitegrey"> {/* Used Tailwind color */}
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-ars-deepblue">Logowanie</h2> {/* Used Tailwind color */}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-ars-darkgrey mb-2"> {/* Used Tailwind color */}
                            Email
                        </label>
                        <input
                            type="email" // Changed type to email for better validation
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-ars-lightlightgrey rounded-md focus:outline-none focus:ring-2 focus:ring-ars-lightblue" // Used Tailwind colors
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-ars-darkgrey mb-2"> {/* Used Tailwind color */}
                            Hasło
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-ars-lightlightgrey rounded-md focus:outline-none focus:ring-2 focus:ring-ars-lightblue" // Used Tailwind colors
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-ars-lightblue hover:bg-ars-deepblue text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-50" // Used Tailwind colors
                    >
                        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;