import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUserRole } from '../utils/auth';
import { useAuth } from '../context/AuthContext';


interface MenuItem {
    menuitem_id: number;
    name: string;
    price: string;
    available: boolean;
}

const MenuPage: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [form, setForm] = useState({ name: '', price: '', available: true });

    const role = getUserRole();
    const canEdit = role === 'vedouci' || role === 'admin';
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/menu-items', { headers });
            setItems(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst menu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editItem) {
                await axios.put(`/api/v1/menu-items/${editItem.menuitem_id}`, form, { headers });
            } else {
                await axios.post('/api/v1/menu-items', form, { headers });
            }
            setShowForm(false);
            setEditItem(null);
            setForm({ name: '', price: '', available: true });
            fetchItems();
        } catch {
            setError('Nepodařilo se uložit položku.');
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditItem(item);
        setForm({ name: item.name, price: item.price, available: item.available });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tuto položku?')) return;
        try {
            await axios.delete(`/api/v1/menu-items/${id}`, { headers });
            fetchItems();
        } catch {
            setError('Nepodařilo se smazat položku.');
        }
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám menu...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Menu</h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '', price: '', available: true }); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        + Přidat položku
                    </button>
                )}
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editItem ? 'Upravit položku' : 'Nová položka'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Název</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Cena (Kč)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="available"
                                checked={form.available}
                                onChange={e => setForm({ ...form, available: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label htmlFor="available" className="text-gray-300 text-sm">Dostupné</label>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                {editItem ? 'Uložit změny' : 'Přidat'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditItem(null); }}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
                            >
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam položek */}
            {items.length === 0 ? (
                <p className="text-gray-400">Žádné položky v menu.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => (
                        <div key={item.menuitem_id} className="bg-gray-800 p-4 rounded shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{item.name}</h3>
                                    <p className="text-blue-400 font-medium">{item.price} Kč</p>
                                    <span className={`text-sm ${item.available ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.available ? 'Dostupné' : 'Nedostupné'}
                                    </span>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                        >
                                            Upravit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.menuitem_id)}
                                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                        >
                                            Smazat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MenuPage;