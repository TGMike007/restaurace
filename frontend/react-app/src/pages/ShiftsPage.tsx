import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


interface Shift {
    shift_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
}

interface User {
    user_id: number;
    name: string;
    role: string;
}

interface UserShift {
    user_id: number;
    shift_id: number;
}

const STATUS_OPTIONS = ['planovana', 'probihajici', 'dokoncena', 'zrusena'];

const ShiftsPage: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [userShifts, setUserShifts] = useState<UserShift[]>([]);
    const [expandedShift, setExpandedShift] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editShift, setEditShift] = useState<Shift | null>(null);
    const [form, setForm] = useState({ date: '', start_time: '', end_time: '', status: 'planovana' });
    const [assignUserId, setAssignUserId] = useState('');

    const { token, role } = useAuth();
    const canEdit = role === 'vedouci' || role === 'admin';
    const headers = { Authorization: `Bearer ${token}` };

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/shifts', { headers });
            setShifts(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst směny.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserShifts = async () => {
        try {
            const response = await axios.get('/api/v1/user-shifts', { headers });
            setUserShifts(response.data);
        } catch {
            setError('Nepodařilo se načíst přiřazení směn.');
                }
    };

    useEffect(() => {
        fetchShifts();
        fetchUserShifts();
        if (canEdit) {
            axios.get('/api/v1/users', { headers }).then(r => setUsers(r.data)).catch(() => {});
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editShift) {
                await axios.put(`/api/v1/shifts/${editShift.shift_id}`, form, { headers });
            } else {
                await axios.post('/api/v1/shifts', form, { headers });
            }
            setShowForm(false);
            setEditShift(null);
            setForm({ date: '', start_time: '', end_time: '', status: 'planovana' });
            fetchShifts();
        } catch {
            setError('Nepodařilo se uložit směnu.');
        }
    };

    const handleEdit = (shift: Shift) => {
        setEditShift(shift);
        setForm({
            date: shift.date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            status: shift.status,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tuto směnu?')) return;
        try {
            await axios.delete(`/api/v1/shifts/${id}`, { headers });
            fetchShifts();
        } catch {
            setError('Nepodařilo se smazat směnu.');
        }
    };

    const handleAssignUser = async (shiftId: number) => {
        if (!assignUserId) return;
        try {
            await axios.post('/api/v1/user-shifts', {
                user_id: Number(assignUserId),
                shift_id: shiftId,
            }, { headers });
            setAssignUserId('');
            fetchUserShifts();
        } catch {
            setError('Nepodařilo se přiřadit uživatele.');
        }
    };

    const handleUnassignUser = async (userId: number, shiftId: number) => {
        try {
            await axios.delete(`/api/v1/user-shifts/${userId}/${shiftId}`, { headers });
            fetchUserShifts();
        } catch {
            setError('Nepodařilo se odebrat uživatele ze směny.');
        }
    };

    const getShiftUsers = (shiftId: number) => {
        const userIds = userShifts.filter(us => us.shift_id === shiftId).map(us => us.user_id);
        return users.filter(u => userIds.includes(u.user_id));
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám směny...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Směny</h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowForm(true); setEditShift(null); setForm({ date: '', start_time: '', end_time: '', status: 'planovana' }); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        + Nová směna
                    </button>
                )}
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editShift ? 'Upravit směnu' : 'Nová směna'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Datum</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stav</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Začátek</label>
                                <input
                                    type="time"
                                    value={form.start_time}
                                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Konec</label>
                                <input
                                    type="time"
                                    value={form.end_time}
                                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editShift ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditShift(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam směn */}
            {shifts.length === 0 ? (
                <p className="text-gray-400">Žádné směny.</p>
            ) : (
                <div className="space-y-4">
                    {shifts.map(shift => (
                        <div key={shift.shift_id} className="bg-gray-800 rounded shadow">
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors rounded"
                                onClick={() => setExpandedShift(expandedShift === shift.shift_id ? null : shift.shift_id)}
                            >
                                <div>
                                    <span className="text-white font-semibold">{shift.date}</span>
                                    <span className="text-gray-400 ml-3">{shift.start_time} — {shift.end_time}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{shift.status}</span>
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleEdit(shift); }}
                                                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                            >
                                                Upravit
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDelete(shift.shift_id); }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                            >
                                                Smazat
                                            </button>
                                        </>
                                    )}
                                    <span className="text-gray-400">{expandedShift === shift.shift_id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Přiřazení uživatelů */}
                            {expandedShift === shift.shift_id && (
                                <div className="border-t border-gray-700 p-4">
                                    <h3 className="text-white font-medium mb-3">Přiřazení zaměstnanci</h3>
                                    {getShiftUsers(shift.shift_id).length === 0 ? (
                                        <p className="text-gray-400 text-sm mb-3">Nikdo přiřazen.</p>
                                    ) : (
                                        <ul className="space-y-2 mb-3">
                                            {getShiftUsers(shift.shift_id).map(u => (
                                                <li key={u.user_id} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-300">{u.name} <span className="text-gray-500">({u.role})</span></span>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleUnassignUser(u.user_id, shift.shift_id)}
                                                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700"
                                                        >
                                                            Odebrat
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <select
                                                value={assignUserId}
                                                onChange={e => setAssignUserId(e.target.value)}
                                                className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1 text-sm flex-grow"
                                            >
                                                <option value="">Vyberte zaměstnance</option>
                                                {users.map(u => (
                                                    <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleAssignUser(shift.shift_id)}
                                                className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                            >
                                                Přiřadit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShiftsPage;