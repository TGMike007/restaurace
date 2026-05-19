import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
    customer_id: number;
    name: string;
    contact: string;
}

const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [form, setForm] = useState({ name: '', contact: '' });

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/customers', { headers });
            setCustomers(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst zákazníky.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editCustomer) {
                await axios.put(`/api/v1/customers/${editCustomer.customer_id}`, form, { headers });
            } else {
                await axios.post('/api/v1/customers', form, { headers });
            }
            setShowForm(false);
            setEditCustomer(null);
            setForm({ name: '', contact: '' });
            fetchCustomers();
        } catch {
            setError('Nepodařilo se uložit zákazníka.');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditCustomer(customer);
        setForm({ name: customer.name, contact: customer.contact || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tohoto zákazníka?')) return;
        try {
            await axios.delete(`/api/v1/customers/${id}`, { headers });
            fetchCustomers();
        } catch {
            setError('Nepodařilo se smazat zákazníka.');
        }
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám zákazníky...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Zákazníci</h1>
                <button
                    onClick={() => { setShowForm(true); setEditCustomer(null); setForm({ name: '', contact: '' }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Nový zákazník
                </button>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editCustomer ? 'Upravit zákazníka' : 'Nový zákazník'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium text-gray-300 mb-1">Kontakt</label>
                                <input
                                    type="text"
                                    value={form.contact}
                                    onChange={e => setForm({ ...form, contact: e.target.value })}
                                    placeholder="Email nebo telefon"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editCustomer ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditCustomer(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam zákazníků */}
            {customers.length === 0 ? (
                <p className="text-gray-400">Žádní zákazníci.</p>
            ) : (
                <div className="space-y-3">
                    {customers.map(customer => (
                        <div key={customer.customer_id} className="bg-gray-800 p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <span className="text-white font-semibold">{customer.name}</span>
                                {customer.contact && (
                                    <span className="text-gray-400 ml-3 text-sm">{customer.contact}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(customer)}
                                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                >
                                    Upravit
                                </button>
                                <button
                                    onClick={() => handleDelete(customer.customer_id)}
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

export default CustomersPage;