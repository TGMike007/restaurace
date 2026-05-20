import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = (location.state as { from?: string })?.from;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(name, password);
            // Přesměruj na původní stránku pokud má uživatel přístup, jinak na dashboard
            if (from && from !== '/login') {
                navigate(from, { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch {
            setError('Nesprávné jméno nebo heslo.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-gray-800 p-8 rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-white">Přihlášení</h1>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Jméno</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Heslo</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    Přihlásit se
                </button>
            </form>
        </div>
    );
};

export default LoginPage;