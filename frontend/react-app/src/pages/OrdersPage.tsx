import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


interface Order {
    order_id: number;
    price: string;
    status: string;
    table_unit_id: number;
    user_id: number;
}

interface OrderItem {
    orderitem_id: number;
    quantity: number;
    price: string;
    note: string;
    order_id: number;
    menuitem_id: number;
}

interface MenuItem {
    menuitem_id: number;
    name: string;
    price: string;
    available: boolean;
}

interface TableUnit {
    table_unit_id: number;
    seats: number;
}

const STATUS_OPTIONS = ['otevrena', 'uzavrena', 'zrusena'];

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<TableUnit[]>([]);
    const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({});
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ table_unit_id: '', user_id: '', status: 'otevrena', price: '0' });
    const [itemForm, setItemForm] = useState({ menuitem_id: '', quantity: '1', note: '' });
    const [addingItemToOrder, setAddingItemToOrder] = useState<number | null>(null);

    const { token, role } = useAuth(); // ← správně
    const headers = { Authorization: `Bearer ${token}` };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/orders', { headers });
            setOrders(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst objednávky.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderItems = async (orderId: number) => {
        try {
            const response = await axios.get('/api/v1/order-items', { headers });
            const filtered = response.data.filter((i: OrderItem) => i.order_id === orderId);
            setOrderItems(prev => ({ ...prev, [orderId]: filtered }));
        } catch {
            setError('Nepodařilo se načíst položky objednávky.');
        }
    };

    useEffect(() => {
        fetchOrders();
        axios.get('/api/v1/menu-items', { headers }).then(r => setMenuItems(r.data)).catch(() => {});
        axios.get('/api/v1/tables').then(r => setTables(r.data)).catch(() => {});
    }, []);

    const handleExpand = (orderId: number) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
            fetchOrderItems(orderId);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/orders', {
                table_unit_id: Number(form.table_unit_id),
                user_id: Number(form.user_id),
                status: form.status,
                price: form.price,
            }, { headers });
            setShowForm(false);
            setForm({ table_unit_id: '', user_id: '', status: 'otevrena', price: '0' });
            fetchOrders();
        } catch {
            setError('Nepodařilo se vytvořit objednávku.');
        }
    };

    const handleAddItem = async (e: React.FormEvent, orderId: number) => {
        e.preventDefault();
        const menuItem = menuItems.find(m => m.menuitem_id === Number(itemForm.menuitem_id));
        if (!menuItem) return;
        try {
            await axios.post('/api/v1/order-items', {
                order_id: orderId,
                menuitem_id: Number(itemForm.menuitem_id),
                quantity: Number(itemForm.quantity),
                price: menuItem.price,
                note: itemForm.note,
            }, { headers });
            setItemForm({ menuitem_id: '', quantity: '1', note: '' });
            setAddingItemToOrder(null);
            fetchOrderItems(orderId);
        } catch {
            setError('Nepodařilo se přidat položku.');
        }
    };

    const handleDeleteItem = async (itemId: number, orderId: number) => {
        if (!confirm('Smazat tuto položku?')) return;
        try {
            await axios.delete(`/api/v1/order-items/${itemId}`, { headers });
            fetchOrderItems(orderId);
        } catch {
            setError('Nepodařilo se smazat položku.');
        }
    };

    const handleDeleteOrder = async (orderId: number) => {
        if (!confirm('Opravdu smazat tuto objednávku?')) return;
        try {
            await axios.delete(`/api/v1/orders/${orderId}`, { headers });
            fetchOrders();
        } catch {
            setError('Nepodařilo se smazat objednávku.');
        }
    };

    const handleStatusChange = async (order: Order, newStatus: string) => {
        try {
            await axios.put(`/api/v1/orders/${order.order_id}`, {
                ...order,
                status: newStatus,
            }, { headers });
            fetchOrders();
        } catch {
            setError('Nepodařilo se změnit stav objednávky.');
        }
    };

    const getTableLabel = (id: number) => {
        const table = tables.find(t => t.table_unit_id === id);
        return table ? `Stůl #${table.table_unit_id} (${table.seats} míst)` : `Stůl #${id}`;
    };

    const getMenuItemName = (id: number) => {
        const item = menuItems.find(m => m.menuitem_id === id);
        return item ? item.name : `Položka #${id}`;
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám objednávky...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Objednávky</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Nová objednávka
                </button>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář nové objednávky */}
            {showForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Nová objednávka</h2>
                    <form onSubmit={handleCreateOrder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Stůl</label>
                            <select
                                value={form.table_unit_id}
                                onChange={e => setForm({ ...form, table_unit_id: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                required
                            >
                                <option value="">Vyberte stůl</option>
                                {tables.map(t => (
                                    <option key={t.table_unit_id} value={t.table_unit_id}>
                                        Stůl #{t.table_unit_id} ({t.seats} míst)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">ID číšníka</label>
                            <input
                                type="number"
                                value={form.user_id}
                                onChange={e => setForm({ ...form, user_id: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                Vytvořit
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam objednávek */}
            {orders.length === 0 ? (
                <p className="text-gray-400">Žádné objednávky.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.order_id} className="bg-gray-800 rounded shadow">
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors rounded"
                                onClick={() => handleExpand(order.order_id)}
                            >
                                <div>
                                    <span className="text-white font-semibold">Objednávka #{order.order_id}</span>
                                    <span className="text-gray-400 ml-3">{getTableLabel(order.table_unit_id)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={order.status}
                                        onChange={e => { e.stopPropagation(); handleStatusChange(order, e.target.value); }}
                                        onClick={e => e.stopPropagation()}
                                        className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <span className="text-blue-400 font-medium">{order.price} Kč</span>
                                    {(role === 'vedouci' || role === 'admin') && (
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteOrder(order.order_id); }}
                                            className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                        >
                                            Smazat
                                        </button>
                                    )}
                                    <span className="text-gray-400">{expandedOrder === order.order_id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Položky objednávky */}
                            {expandedOrder === order.order_id && (
                                <div className="border-t border-gray-700 p-4">
                                    <h3 className="text-white font-medium mb-3">Položky</h3>
                                    {(orderItems[order.order_id] || []).length === 0 ? (
                                        <p className="text-gray-400 text-sm mb-3">Žádné položky.</p>
                                    ) : (
                                        <ul className="space-y-2 mb-3">
                                            {(orderItems[order.order_id] || []).map(item => (
                                                <li key={item.orderitem_id} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-300">
                                                        {getMenuItemName(item.menuitem_id)} × {item.quantity}
                                                        {item.note && <span className="text-gray-500 ml-2">({item.note})</span>}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-blue-400">{item.price} Kč</span>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.orderitem_id, order.order_id)}
                                                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700"
                                                        >
                                                            Smazat
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Přidat položku */}
                                    {addingItemToOrder === order.order_id ? (
                                        <form onSubmit={e => handleAddItem(e, order.order_id)} className="space-y-3 mt-3">
                                            <div>
                                                <label className="block text-sm text-gray-300 mb-1">Položka menu</label>
                                                <select
                                                    value={itemForm.menuitem_id}
                                                    onChange={e => setItemForm({ ...itemForm, menuitem_id: e.target.value })}
                                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                                    required
                                                >
                                                    <option value="">Vyberte položku</option>
                                                    {menuItems.filter(m => m.available).map(m => (
                                                        <option key={m.menuitem_id} value={m.menuitem_id}>
                                                            {m.name} — {m.price} Kč
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-300 mb-1">Počet</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={itemForm.quantity}
                                                    onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-300 mb-1">Poznámka</label>
                                                <input
                                                    type="text"
                                                    value={itemForm.note}
                                                    onChange={e => setItemForm({ ...itemForm, note: e.target.value })}
                                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                                    Přidat
                                                </button>
                                                <button type="button" onClick={() => setAddingItemToOrder(null)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">
                                                    Zrušit
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setAddingItemToOrder(order.order_id)}
                                            className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                        >
                                            + Přidat položku
                                        </button>
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

export default OrdersPage;