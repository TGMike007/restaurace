import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface TableUnit {
    table_unit_id: number;
    seats: number;
}

const TablesPage: React.FC = () => {
    const [tables, setTables] = useState<TableUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editTable, setEditTable] = useState<TableUnit | null>(null);
    const [form, setForm] = useState({ seats: '2' });

    const { token, role } = useAuth();
    const canEdit = role === 'vedouci' || role === 'admin';

    const fetchTables = async () => {
        // Pokud ještě nemáme token, počkáme s načítáním
        if (!token) return;
        
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/tables', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sortedTables = response.data.sort((a: TableUnit, b: TableUnit) => 
            a.table_unit_id - b.table_unit_id
            );
            setTables(sortedTables);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst stoly.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTables(); }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // OPRAVA: Převod hodnoty z formuláře na skutečné číslo (Integer),
            // aby data prošla backendovou validací Marshmallow schématu.
            const payload = {
                seats: parseInt(form.seats, 10)
            };

            if (editTable) {
                await axios.put(`/api/v1/tables/${editTable.table_unit_id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/v1/tables', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowForm(false);
            setEditTable(null);
            setForm({ seats: '2' });
            fetchTables();
        } catch {
            setError('Nepodařilo se uložit stůl.');
        }
    };

    const handleEdit = (table: TableUnit) => {
        setEditTable(table);
        setForm({ seats: String(table.seats) });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tento stůl?')) return;
        try {
            await axios.delete(`/api/v1/tables/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTables();
        } catch {
            setError('Nepodařilo se smazat stůl.');
        }
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám stoly...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Stoly</h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowForm(true); setEditTable(null); setForm({ seats: '2' }); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        + Přidat stůl
                    </button>
                )}
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editTable ? 'Upravit stůl' : 'Nový stůl'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Počet míst</label>
                            <input
                                type="number"
                                min="1"
                                value={form.seats}
                                onChange={e => setForm({ seats: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editTable ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditTable(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tables.length === 0 ? (
                <p className="text-gray-400">Žádné stoly.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {tables.map(table => (
                        <div key={table.table_unit_id} className="bg-gray-800 p-4 rounded shadow text-center">
                            <div className="text-white font-semibold text-lg mb-1">Stůl #{table.table_unit_id}</div>
                            <div className="text-gray-400 text-sm mb-3">{table.seats} míst</div>
                            {canEdit && (
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => handleEdit(table)}
                                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                    >
                                        Upravit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(table.table_unit_id)}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Smazat
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TablesPage;