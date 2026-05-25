import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Reservation {
    reservation_id: number;
    date: string;
    start_time: string;
    end_time: string;
    person_count: number;
    customer_id: number;
    table_unit_id: number;
}

interface Customer {
    customer_id: number;
    name: string;
    contact: string;
}

interface TableUnit {
    table_unit_id: number;
    seats: number;
}

const ReservationsPage: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [tables, setTables] = useState<TableUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editReservation, setEditReservation] = useState<Reservation | null>(null);
    const [form, setForm] = useState({
        date: '',
        start_time: '',
        end_time: '',
        person_count: '1',
        customer_id: '',
        table_unit_id: '',
    });

    const { token, role } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/reservations', { headers });
            setReservations(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst rezervace.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
        axios.get('/api/v1/tables', { headers }).then(r => setTables(r.data)).catch(() => {});
        axios.get('/api/v1/customers', { headers }).then(r => setCustomers(r.data)).catch(() => {});
    }, []);

    // Bezpečné dynamické filtrování stolů s normalizací formátů
    const getAvailableTables = () => {
        return tables.filter(table => {
            // 1. KONTROLA KAPACITY
            const requiredSeats = parseInt(form.person_count, 10) || 1;
            if (table.seats < requiredSeats) return false;

            // 2. KONTROLA ČASOVÉHO PŘEKRYVU
            if (form.date && form.start_time && form.end_time) {
                // Normalizace formulářových hodnot (oříznutí na přesný počet znaků)
                const formDate = form.date.slice(0, 10);      // "YYYY-MM-DD"
                const formStart = form.start_time.slice(0, 5);  // "HH:MM"
                const formEnd = form.end_time.slice(0, 5);      // "HH:MM"

                const isOccupied = reservations.some(res => {
                    // Ignorujeme vlastní rezervaci při úpravách
                    if (editReservation && res.reservation_id === editReservation.reservation_id) {
                        return false;
                    }

                    // Jistota číselného porovnání ID stolů
                    if (Number(res.table_unit_id) !== Number(table.table_unit_id)) return false;

                    // Defenzivní normalizace dat z backendu (ošetření sekund a ISO formátů)
                    const resDate = res.date ? res.date.slice(0, 10) : '';
                    const resStart = res.start_time ? res.start_time.slice(0, 5) : '';
                    const resEnd = res.end_time ? res.end_time.slice(0, 5) : '';

                    // Pokud se neshoduje den, stůl je v tento den volný
                    if (resDate !== formDate) return false;

                    // Matematická logika překryvu: (Začátek_Nové < Konec_Staré) A (Začátek_Staré < Konec_Nové)
                    return formStart < resEnd && resStart < formEnd;
                });

                if (isOccupied) return false;
            }

            return true;
        });
    };

    const availableTables = getAvailableTables();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pojistka pro případ, že by se odeslal nevalidní stůl
        const isTableValid = availableTables.some(t => String(t.table_unit_id) === form.table_unit_id);
        if (!isTableValid) {
            setError('Vybraný stůl neodpovídá kapacitě nebo je v tomto čase již obsazený.');
            return;
        }

        try {
            const data = {
                date: form.date,
                start_time: form.start_time,
                end_time: form.end_time,
                person_count: Number(form.person_count),
                customer_id: Number(form.customer_id),
                table_unit_id: Number(form.table_unit_id),
            };
            if (editReservation) {
                await axios.put(`/api/v1/reservations/${editReservation.reservation_id}`, data, { headers });
            } else {
                await axios.post('/api/v1/reservations', data, { headers });
            }
            setShowForm(false);
            setEditReservation(null);
            setForm({ date: '', start_time: '', end_time: '', person_count: '1', customer_id: '', table_unit_id: '' });
            fetchReservations();
        } catch {
            setError('Nepodařilo se uložit rezervaci.');
        }
    };

    const handleEdit = (r: Reservation) => {
        setEditReservation(r);
        setForm({
            date: r.date.slice(0, 10),
            start_time: r.start_time.slice(0, 5),
            end_time: r.end_time.slice(0, 5),
            person_count: String(r.person_count),
            customer_id: String(r.customer_id),
            table_unit_id: String(r.table_unit_id),
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tuto rezervaci?')) return;
        try {
            await axios.delete(`/api/v1/reservations/${id}`, { headers });
            fetchReservations();
        } catch {
            setError('Nepodařilo se smazat rezervaci.');
        }
    };

    const getCustomerName = (id: number) => {
        const c = customers.find(c => c.customer_id === id);
        return c ? c.name : `Zákazník #${id}`;
    };

    const getTableLabel = (id: number) => {
        const t = tables.find(t => t.table_unit_id === id);
        return t ? `Stůl #${t.table_unit_id} (${t.seats} míst)` : `Stůl #${id}`;
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám rezervace...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Rezervace</h1>
                {role && (
                    <button
                        onClick={() => { setShowForm(true); setEditReservation(null); setForm({ date: '', start_time: '', end_time: '', person_count: '1', customer_id: '', table_unit_id: '' }); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        + Nová rezervace
                    </button>
                )}
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editReservation ? 'Upravit rezervaci' : 'Nová rezervace'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Datum</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value, table_unit_id: '' })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Počet osob</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.person_count}
                                    onChange={e => setForm({ ...form, person_count: e.target.value, table_unit_id: '' })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Začátek</label>
                                <input
                                    type="time"
                                    value={form.start_time}
                                    onChange={e => setForm({ ...form, start_time: e.target.value, table_unit_id: '' })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Konec</label>
                                <input
                                    type="time"
                                    value={form.end_time}
                                    onChange={e => setForm({ ...form, end_time: e.target.value, table_unit_id: '' })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Zákazník</label>
                                <select
                                    value={form.customer_id}
                                    onChange={e => setForm({ ...form, customer_id: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="">Vyberte zákazníka</option>
                                    {customers.map(c => (
                                        <option key={c.customer_id} value={c.customer_id}>
                                            {c.name} {c.contact && `(${c.contact})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stůl</label>
                                <select
                                    value={form.table_unit_id}
                                    onChange={e => setForm({ ...form, table_unit_id: e.target.value })}
                                    className={`w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none border ${availableTables.length === 0 ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'}`}
                                    required
                                    disabled={availableTables.length === 0}
                                >
                                    <option value="">Vyberte stůl</option>
                                    {availableTables.map(t => (
                                        <option key={t.table_unit_id} value={t.table_unit_id}>
                                            Stůl #{t.table_unit_id} ({t.seats} míst)
                                        </option>
                                    ))}
                                </select>
                                {availableTables.length === 0 && (
                                    <p className="text-red-400 text-xs mt-1">
                                        Kapacita volných stolů pro zadaný čas/počet osob je vyčerpaná.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="submit" 
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                disabled={availableTables.length === 0}
                            >
                                {editReservation ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditReservation(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam rezervací */}
            {reservations.length === 0 ? (
                <p className="text-gray-400">Žádné rezervace.</p>
            ) : (
                <div className="space-y-3">
                    {reservations.map(r => (
                        <div key={r.reservation_id} className="bg-gray-800 p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <div className="text-white font-semibold">{r.date.slice(0,10)} — {r.start_time.slice(0,5)} až {r.end_time.slice(0,5)}</div>
                                <div className="text-gray-400 text-sm">{getCustomerName(r.customer_id)} · {getTableLabel(r.table_unit_id)} · {r.person_count} osob</div>
                            </div>
                            {role && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(r)}
                                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                    >
                                        Upravit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(r.reservation_id)}
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

export default ReservationsPage;