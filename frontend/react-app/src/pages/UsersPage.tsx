import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


interface User {
    user_id: number;
    name: string;
    role: string;
}

const ROLE_OPTIONS = ['cisnik', 'vedouci', 'admin'];

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', password: '', role: 'cisnik' });

    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/users', { headers });
            setUsers(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst uživatele.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editUser) {
                await axios.put(`/api/v1/users/${editUser.user_id}`, form, { headers });
            } else {
                await axios.post('/api/v1/register', form, { headers });
            }
            setShowForm(false);
            setEditUser(null);
            setForm({ name: '', password: '', role: 'cisnik' });
            fetchUsers();
        } catch {
            setError('Nepodařilo se uložit uživatele.');
        }
    };

    const handleEdit = (user: User) => {
        setEditUser(user);
        setForm({ name: user.name, password: '', role: user.role });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tohoto uživatele?')) return;
        try {
            await axios.delete(`/api/v1/users/${id}`, { headers });
            fetchUsers();
        } catch {
            setError('Nepodařilo se smazat uživatele.');
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === 'admin') return 'bg-red-800 text-red-300';
        if (role === 'vedouci') return 'bg-yellow-800 text-yellow-300';
        return 'bg-blue-800 text-blue-300';
    };


    if (loading) return <p className="text-gray-400 text-center">Načítám uživatele...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Uživatelé</h1>
                <button
                    onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: '', password: '', role: 'cisnik' }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Nový uživatel
                </button>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editUser ? 'Upravit uživatele' : 'Nový uživatel'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Jméno</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Heslo {editUser && <span className="text-gray-500">(ponechte prázdné pro beze změny)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required={!editUser}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editUser ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam uživatelů */}
            {users.length === 0 ? (
                <p className="text-gray-400">Žádní uživatelé.</p>
            ) : (
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.user_id} className="bg-gray-800 p-4 rounded shadow flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-white font-semibold">{user.name}</span>
                                <span className={`text-xs px-2 py-1 rounded ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                >
                                    Upravit
                                </button>
                                <button
                                    onClick={() => handleDelete(user.user_id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                    Smazat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersPage;