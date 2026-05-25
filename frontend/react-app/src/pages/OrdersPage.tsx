import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// --- TYPOVÉ DEFINICE PRO ZAJIŠTĚNÍ BEZCHYBNÉHO COMPILU ---
interface TableUnit {
    table_unit_id: number;
    seats: number;
}

interface MenuItem {
    menuitem_id: number;
    name: string;
    price: string | number;
    available: boolean;
}

interface OrderItem {
    orderitem_id: number;
    quantity: number;
    price: string | number;
    note: string | null;
    order_id: number;
    menuitem_id: number;
}

interface Order {
    order_id: number;
    price: string | number | null;
    status: string;
    table_unit_id: number;
    user_id: number;
}

interface User {
    user_id: number;
    name: string;
    role: string;
}

interface Shift {
    shift_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
}

interface UserShift {
    user_id: number;
    shift_id: number;
}

const OrdersPage: React.FC = () => {
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    // Stavy pro data z API
    const [tables, setTables] = useState<TableUnit[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [userShifts, setUserShifts] = useState<UserShift[]>([]);

    // Stavy aplikace
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Stav pro formulář založení nové objednávky
    const [creatingOrderForTable, setCreatingOrderForTable] = useState<number | null>(null);
    const [selectedWaiterId, setSelectedWaiterId] = useState<number | "">("");

    // Hromadné načtení všech potřebných dat
    const fetchData = async () => {
        try {
            setLoading(true);
            const [tRes, oRes, mRes, oiRes, uRes, sRes, usRes] = await Promise.all([
                axios.get('/api/v1/tables', { headers }),
                axios.get('/api/v1/orders', { headers }),
                axios.get('/api/v1/menu-items', { headers }),
                axios.get('/api/v1/order-items', { headers }),
                axios.get('/api/v1/users', { headers }),
                axios.get('/api/v1/shifts', { headers }),
                axios.get('/api/v1/user-shifts', { headers })
            ]);

            setTables(tRes.data);
            setOrders(oRes.data);
            setMenuItems(mRes.data);
            setOrderItems(oiRes.data);
            setUsers(uRes.data);
            setShifts(sRes.data);
            setUserShifts(usRes.data);
            setError(null);
        } catch (err) {
            console.error("Chyba při načítání dat:", err);
            setError('Nepodařilo se načíst data z pokladního systému.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Pomocná funkce pro získání lokálního data a času ve formátu pro porovnání směny
    const getLocalDataStrings = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return {
            date: `${year}-${month}-${day}`, // Oříznuto přesně na YYYY-MM-DD
            time: `${hours}:${minutes}`      // Oříznuto přesně na HH:MM
        };
    };

    // Zjištění, kteří číšníci mají právě teď aktivní směnu
    const getWaitersOnShift = () => {
        const { date: todayStr, time: timeStr } = getLocalDataStrings();

        // 1. Najít směny pro dnešní den, které pokrývají aktuální čas
        const activeShiftIds = shifts
            .filter(s => {
                if (!s.date || !s.start_time || !s.end_time) return false;
                const sDate = s.date.slice(0, 10);
                const sStart = s.start_time.slice(0, 5);
                const sEnd = s.end_time.slice(0, 5);
                return sDate === todayStr && sStart <= timeStr && sEnd >= timeStr;
            })
            .map(s => s.shift_id);

        // 2. Najít ID uživatelů na těchto směnách
        const activeUserIdsOnShift = userShifts
            .filter(us => activeShiftIds.includes(us.shift_id))
            .map(us => us.user_id);

        // 3. STRIKTNÍ FILTR s ošetřením (získáme všechny číšníky z databáze)
        const waiters = users.filter(u => {
            if (!u.role) return false;
            const role = String(u.role).toLowerCase();
            // Pokrývá "cisnik", "číšník" nebo např. Enum formát "UserRole.cisnik"
            return role === 'cisnik' || role === 'číšník' || role.includes('cisnik');
        });

        // 4. Pole ID pouze těch číšníků, kteří jsou na směně
        const activeWaiterIds = activeUserIdsOnShift.filter(userId => 
            waiters.some(w => w.user_id === userId)
        );

        // 5. SEŘAZENÍ: Číšníci na směně se přesunou na začátek seznamu
        waiters.sort((a, b) => {
            const aOnShift = activeWaiterIds.includes(a.user_id) ? 1 : 0;
            const bOnShift = activeWaiterIds.includes(b.user_id) ? 1 : 0;
            return bOnShift - aOnShift; 
        });

        return {
            allWaiters: waiters,
            activeWaiterIds
        };
    };
    // Založení nové objednávky (přiřazení stolu a číšníka)
    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (creatingOrderForTable === null || selectedWaiterId === "") return;

        try {
            const res = await axios.post('/api/v1/orders', {
                table_unit_id: creatingOrderForTable,
                user_id: Number(selectedWaiterId),
                status: 'active',
                price: 0
            }, { headers });

            setCreatingOrderForTable(null);
            setSelectedWaiterId("");
            
            // Znovu načteme data a nově vytvořenou objednávku nastavíme jako aktivní k markování
            await fetchData();
            setActiveOrder(res.data);
        } catch (err) {
            console.error("Chyba při vytváření objednávky:", err);
            setError('Nepodařilo se založit novou objednávku.');
        }
    };

    // Přidání jídla do otevřené objednávky (postupné markování)
    const handleAddItemToOrder = async (menuItem: MenuItem) => {
        if (!activeOrder) return;

        try {
            await axios.post('/api/v1/order-items', {
                order_id: activeOrder.order_id,
                menuitem_id: menuItem.menuitem_id,
                quantity: 1,
                price: Number(menuItem.price),
                note: ""
            }, { headers });

            // Okamžitá aktualizace dat, aby se jídlo objevilo na účtu
            await fetchData();
        } catch (err) {
            console.error("Chyba při přidávání jídla:", err);
            setError('Nepodařilo se přidat položku na účet.');
        }
    };

    // Smazání položky z objednávky (storno při překliku)
    const handleRemoveItem = async (orderitemId: number) => {
        try {
            await axios.delete(`/api/v1/order-items/${orderitemId}`, { headers });
            await fetchData();
        } catch (err) {
            console.error("Chyba při mazání položky:", err);
            setError('Nepodařilo se odstranit položku z objednávky.');
        }
    };

    // Uzavření objednávky (zaplacení celého stolu)
    const handleCloseOrder = async (orderId: number) => {
        if (!window.confirm('Opravdu si přejete uzavřít a zaplatit celý účet stolu?')) return;
        try {
            // Změníme status na zaplaceno, čímž se stůl uvolní
            await axios.put(`/api/v1/orders/${orderId}`, {
                status: 'zaplaceno'
            }, { headers });

            setActiveOrder(null);
            await fetchData();
        } catch (err) {
            console.error("Chyba při uzavírání objednávky:", err);
            setError('Nepodařilo se uzavřít objednávku.');
        }
    };

    if (loading) return <p className="text-gray-400 text-center p-6">Načítám pokladní systém...</p>;

    const { allWaiters, activeWaiterIds } = getWaitersOnShift();

    // --- STRUKTURA 1: DETAIL OTEVŘENÉHO ÚČTU (MARKOVÁNÍ JÍDEL) ---
    if (activeOrder) {
        const currentOrder = activeOrder;
        // Vyfiltrujeme položky patřící pouze do této objednávky
        const currentOrderItems = orderItems.filter(item => item.order_id === currentOrder.order_id);
        const totalAmount = currentOrderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const waiterName = users.find(u => u.user_id === currentOrder.user_id)?.name || `Číšník #${currentOrder.user_id}`;

        return (
            <div className="max-w-6xl mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <button 
                            onClick={() => setActiveOrder(null)} 
                            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors mr-4"
                        >
                            ← Zpět na přehled stolů
                        </button>
                        <span className="text-2xl font-bold text-white">Stůl #{currentOrder.table_unit_id}</span>
                        <span className="text-gray-400 ml-4">| Obsluhuje: {waiterName}</span>
                    </div>
                    <button 
                        onClick={() => handleCloseOrder(currentOrder.order_id)}
                        className="bg-green-600 text-white px-5 py-2 rounded font-bold hover:bg-green-700 transition-colors"
                    >
                        Zaplatit a uzavřít účet ({totalAmount} Kč)
                    </button>
                </div>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEVÝ PANEL: Aktuální stav účtu zákazníka */}
                    <div className="lg:col-span-5 bg-gray-800 p-4 rounded shadow-md flex flex-col justify-between min-h-[450px]">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Aktuální účet</h3>
                            {currentOrderItems.length === 0 ? (
                                <p className="text-gray-400 italic">Na tomto účtu zatím nejsou žádné položky. Vyberte jídlo vpravo.</p>
                            ) : (
                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                    {currentOrderItems.map(item => {
                                        const details = menuItems.find(m => m.menuitem_id === item.menuitem_id);
                                        return (
                                            <div key={item.orderitem_id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                                <div className="text-white">
                                                    <span className="font-bold mr-2">{item.quantity}x</span>
                                                    {details ? details.name : `Položka #${item.menuitem_id}`}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-300 font-semibold">{Number(item.price) * item.quantity} Kč</span>
                                                    <button 
                                                        onClick={() => handleRemoveItem(item.orderitem_id)}
                                                        className="text-red-400 hover:text-red-600 font-bold px-1"
                                                        title="Stornovat položku"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between items-center text-xl font-bold text-white">
                            <span>Celkem k úhradě:</span>
                            <span className="text-yellow-400">{totalAmount} Kč</span>
                        </div>
                    </div>

                    {/* PRAVÝ PANEL: Rychlá dotyková klávesnice menu */}
                    <div className="lg:col-span-7 bg-gray-800 p-4 rounded shadow-md">
                        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Nabídka menu</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {menuItems.filter(m => m.available).map(item => (
                                <button
                                    key={item.menuitem_id}
                                    onClick={() => handleAddItemToOrder(item)}
                                    className="bg-blue-900 border border-blue-700 text-white p-4 rounded text-center hover:bg-blue-800 active:scale-95 transition-all flex flex-col justify-between items-center min-h-[90px]"
                                >
                                    <span className="font-medium text-sm text-center">{item.name}</span>
                                    <span className="font-bold text-yellow-300 mt-2">{item.price} Kč</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- STRUKTURA 2: HLAVNÍ PŘEHLED VŠECH STOLŮ ---
    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Pokladna — Přehled stolů</h1>
            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* FORMULÁŘ: Otevření nového stolu (Zobrazen, pokud klikneme na volný stůl) */}
            {creatingOrderForTable !== null && (
                <div className="bg-gray-800 p-6 rounded shadow-md mb-6 border border-blue-500 max-w-md">
                    <h3 className="text-xl font-semibold text-white mb-3">Otevřít stůl #{creatingOrderForTable}</h3>
                    <form onSubmit={handleCreateOrder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Přiřadit číšníka:</label>
                            <select
                                value={selectedWaiterId}
                                onChange={e => setSelectedWaiterId(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                                required
                            >
                                <option value="">-- Vyberte obsluhu --</option>
                                {allWaiters.map(waiter => {
                                    const onShift = activeWaiterIds.includes(waiter.user_id);
                                    return (
                                        <option key={waiter.user_id} value={waiter.user_id}>
                                            {waiter.name} {onShift ? ' [Na směně]' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">* Prioritně volte číšníky, kteří mají aktivní naplánovanou směnu.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                Otevřít účet stolu
                            </button>
                            <button type="button" onClick={() => { setCreatingOrderForTable(null); setSelectedWaiterId(""); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MŘÍŽKA STOLŮ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.map(table => {
                    // Hledáme aktivní objednávku pro tento konkrétní stůl
                    const activeOrderForTable = orders.find(o => o.table_unit_id === table.table_unit_id && o.status === 'active');
                    
                    return (
                        <div 
                            key={table.table_unit_id} 
                            className={`p-5 rounded-lg shadow border flex flex-col justify-between min-h-[140px] transition-all ${
                                activeOrderForTable 
                                    ? 'bg-red-950 border-red-700 text-red-100' 
                                    : 'bg-green-950 border-green-700 text-green-100'
                            }`}
                        >
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold">Stůl {table.table_unit_id}</span>
                                    <span className="text-xs bg-black bg-opacity-40 px-2 py-0.5 rounded-full text-gray-300">
                                        {table.seats} míst
                                    </span>
                                </div>
                                <p className="text-sm mt-1 opacity-80">
                                    {activeOrderForTable ? '⚠️ Obsazen' : '✅ Volný stůl'}
                                </p>
                            </div>

                            <div className="mt-4">
                                {activeOrderForTable ? (
                                    <button
                                        onClick={() => setActiveOrder(activeOrderForTable)}
                                        className="w-full bg-red-700 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-red-600 transition-colors"
                                    >
                                        Otevřít účet / Markovat
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCreatingOrderForTable(table.table_unit_id);
                                            // Pokud existuje alespoň jeden číšník na směně, předvybereme ho
                                            if (activeWaiterIds.length > 0) setSelectedWaiterId(activeWaiterIds[0]);
                                        }}
                                        className="w-full bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-green-600 transition-colors"
                                    >
                                        Založit objednávku
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrdersPage;