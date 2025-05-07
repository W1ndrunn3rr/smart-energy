import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFunc from '../scripts/auth';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

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

        if (await AuthFunc(formData)) {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/Home');
        } else {
            setError('Nieprawidłowy login lub hasło');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#e3e3e3]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-[#003264]">Logowanie</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-[#444444] mb-2">
                            Email
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[#c4c4c4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0057AD]"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-[#444444] mb-2">
                            Hasło
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[#c4c4c4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0057AD]"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#0057AD] hover:bg-[#003264] text-white py-2 px-4 rounded-md transition duration-200"
                    >
                        Zaloguj się
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;