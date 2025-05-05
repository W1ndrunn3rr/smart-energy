import { useState } from 'react';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Dane logowania:', formData);
        // Tutaj można dodać logikę logowania
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#e3e3e3]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-[#003264]">Logowanie</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-[#444444] mb-2">
                            Email
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
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