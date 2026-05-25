import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
    menuitem_id: number;
    name: string;
    price: number;
    available: boolean;
}

const MenuPage: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [form, setForm] = useState({
        name: '',
        price: '',
        available: true,
    });

    // Správné načtení tokenu a role z tvého AuthContextu
    const { token, role } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    // Právo na úpravy má pouze vedoucí a admin
    const canEdit = role === 'vedouci' || role === 'admin';

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

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                name: form.name,
                price: Number(form.price), // Převod textu z formuláře na číslo pro backend
                available: form.available,
            };

            if (editItem) {
                await axios.put(`/api/v1/menu-items/${editItem.menuitem_id}`, data, { headers });
            } else {
                await axios.post('/api/v1/menu-items', data, { headers });
            }

            setShowForm(false);
            setEditItem(null);
            setForm({ name: '', price: '', available: true });
            fetchItems();
        } catch {
            setError('Nepodařilo se uložit položku do menu.');
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditItem(item);
        setForm({
            name: item.name,
            price: String(item.price),
            available: item.available,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tuto položku z menu?')) return;
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
                {/* Tlačítko vidí jen admin a vedoucí */}
                {canEdit && (
                    <button
                        onClick={() => { 
                            setShowForm(true); 
                            setEditItem(null); 
                            setForm({ name: '', price: '', available: true }); 
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        + Nová položka
                    </button>
                )}
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář pro přidání/úpravu - přístupný pouze pro canEdit */}
            {showForm && canEdit && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editItem ? 'Upravit položku' : 'Nová položka do menu'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Název jídla / nápoje</label>
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
                                    min="0"
                                    value={form.price}
                                    onChange={e => setForm({ ...form, price: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center mt-2 md:col-span-2">
                                <input
                                    type="checkbox"
                                    id="available"
                                    checked={form.available}
                                    onChange={e => setForm({ ...form, available: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="available" className="ml-2 text-sm font-medium text-gray-300 select-none cursor-pointer">
                                    Dostupné / Skladem
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editItem ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Výpis položek menu */}
            {items.length === 0 ? (
                <p className="text-gray-400">Žádné položky v menu.</p>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.menuitem_id} className="bg-gray-800 p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <div className="text-white font-semibold">{item.name}</div>
                                <div className="text-gray-400 text-sm">
                                    {item.price} Kč · {item.available ? <span className="text-green-400">Skladem</span> : <span className="text-red-400">Nedostupné</span>}
                                </div>
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default MenuPage;