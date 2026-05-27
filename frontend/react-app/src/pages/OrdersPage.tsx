import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// --- TYPOVÉ DEFINICE ---
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

// Typy pro rozúčtování položek
interface SelectionItem {
    orderitem_id: number;
    menuitem_id: number;
    maxQuantity: number;
    payQuantity: number;
    price: number;
}

interface PaymentGatewayState {
    isOpen: boolean;
    orderId: number | null;
    amount: number;
    method: 'hotovost' | 'karta' | null;
    status: 'vyber_polozek' | 'vyber_metody' | 'zpracovani_karty' | 'kalkulacka_hotovosti' | 'uspech' | 'chyba';
    errorMessage?: string;
    cashReceived: string;
    selection: SelectionItem[];
}

const OrdersPage: React.FC = () => {
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [tables, setTables] = useState<TableUnit[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [userShifts, setUserShifts] = useState<UserShift[]>([]);

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [creatingOrderForTable, setCreatingOrderForTable] = useState<number | null>(null);
    const [selectedWaiterId, setSelectedWaiterId] = useState<number | "">("");

    // Stav platební brány
    const [paymentState, setPaymentState] = useState<PaymentGatewayState>({
        isOpen: false,
        orderId: null,
        amount: 0,
        method: null,
        status: 'vyber_polozek',
        cashReceived: '',
        selection: []
    });

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

    const getLocalDataStrings = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
    };

    const getWaitersOnShift = () => {
        const { date: todayStr, time: timeStr } = getLocalDataStrings();

        const activeShiftIds = shifts
            .filter(s => {
                if (!s.date || !s.start_time || !s.end_time) return false;
                const sDate = s.date.slice(0, 10);
                const sStart = s.start_time.slice(0, 5);
                const sEnd = s.end_time.slice(0, 5);
                return sDate === todayStr && sStart <= timeStr && sEnd >= timeStr;
            }).map(s => s.shift_id);

        const activeUserIdsOnShift = userShifts
            .filter(us => activeShiftIds.includes(us.shift_id))
            .map(us => us.user_id);

        const waiters = users.filter(u => {
            if (!u.role) return false;
            const role = String(u.role).toLowerCase();
            return role === 'cisnik' || role === 'číšník' || role.includes('cisnik');
        });

        const activeWaiterIds = activeUserIdsOnShift.filter(userId => waiters.some(w => w.user_id === userId));

        waiters.sort((a, b) => {
            const aOnShift = activeWaiterIds.includes(a.user_id) ? 1 : 0;
            const bOnShift = activeWaiterIds.includes(b.user_id) ? 1 : 0;
            return bOnShift - aOnShift; 
        });

        return { allWaiters: waiters, activeWaiterIds };
    };

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
            await fetchData();
            setActiveOrder(res.data);
        } catch (err) {
            console.error("Chyba při vytváření objednávky:", err);
            setError('Nepodařilo se založit novou objednávku.');
        }
    };

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
            await fetchData();
        } catch (err) {
            console.error("Chyba při přidávání jídla:", err);
            setError('Nepodařilo se přidat položku na účet.');
        }
    };

    const handleRemoveItem = async (orderitemId: number) => {
        try {
            await axios.delete(`/api/v1/order-items/${orderitemId}`, { headers });
            await fetchData();
        } catch (err) {
            console.error("Chyba při mazání položky:", err);
            setError('Nepodařilo se odstranit položku z objednávky.');
        }
    };

    // --- FÁZE 1: ZAHÁJENÍ PLATBY A ROZÚČTOVÁNÍ ---
    const startPaymentProcess = (orderId: number, currentOrderItems: OrderItem[]) => {
        if (currentOrderItems.length === 0) {
            alert("Účet je prázdný, nelze platit.");
            return;
        }

        // Předvyplníme výběr všemi položkami (Zaplatit vše)
        const initialSelection = currentOrderItems.map(item => ({
            orderitem_id: item.orderitem_id,
            menuitem_id: item.menuitem_id,
            maxQuantity: item.quantity,
            payQuantity: item.quantity,
            price: Number(item.price)
        }));

        setPaymentState({
            isOpen: true,
            orderId,
            amount: 0, // Vypočítá se v UI z výběru
            method: null,
            status: 'vyber_polozek',
            cashReceived: '',
            selection: initialSelection
        });
    };

    const updateSelection = (orderitem_id: number, delta: number) => {
        setPaymentState(prev => {
            const newSelection = prev.selection.map(item => {
                if (item.orderitem_id === orderitem_id) {
                    const newQty = Math.max(0, Math.min(item.maxQuantity, item.payQuantity + delta));
                    return { ...item, payQuantity: newQty };
                }
                return item;
            });
            return { ...prev, selection: newSelection };
        });
    };

    // --- FÁZE 2: VLASTNÍ PROVEDENÍ PLATBY (Ať už celé, nebo částečné) ---
    const simulatePaymentResult = async (isSuccess: boolean, errorMessage: string = "Platba zamítnuta bankou (Nedostatečný zůstatek)") => {
        if (!isSuccess) {
            setPaymentState(prev => ({ ...prev, status: 'chyba', errorMessage }));
            return;
        }

        setPaymentState(prev => ({ ...prev, status: 'zpracovani_karty' })); 

        try {
            if (!activeOrder) throw new Error("Aktivní objednávka nebyla nalezena.");

            const isPartialPayment = paymentState.selection.some(item => item.payQuantity < item.maxQuantity);
            let targetOrderId = activeOrder.order_id;

            if (isPartialPayment) {
                // 1. Založíme novou objednávku pro odcházející zákazníky
                const newOrderRes = await axios.post('/api/v1/orders', {
                    table_unit_id: activeOrder.table_unit_id,
                    user_id: activeOrder.user_id,
                    status: 'zaplaceno',
                    price: paymentState.amount
                }, { headers });
                targetOrderId = newOrderRes.data.order_id;

                // 2. Přesuneme zaplacené položky
                for (const paidItem of paymentState.selection.filter(i => i.payQuantity > 0)) {
                    await axios.post('/api/v1/order-items', {
                        order_id: targetOrderId,
                        menuitem_id: paidItem.menuitem_id,
                        quantity: paidItem.payQuantity,
                        price: paidItem.price,
                        note: ""
                    }, { headers });

                    await axios.delete(`/api/v1/order-items/${paidItem.orderitem_id}`, { headers });
                    
                    const remainingQty = paidItem.maxQuantity - paidItem.payQuantity;
                    if (remainingQty > 0) {
                        await axios.post('/api/v1/order-items', {
                            order_id: activeOrder.order_id,
                            menuitem_id: paidItem.menuitem_id,
                            quantity: remainingQty,
                            price: paidItem.price,
                            note: ""
                        }, { headers });
                    }
                }
            } else {
                // --- TADY BYLA CHYBA, NYNÍ OPRAVENO ---
                // Zaplatili úplně vše - uzavřeme stávající stůl a přibalíme povinná ID
                await axios.put(`/api/v1/orders/${targetOrderId}`, {
                    table_unit_id: activeOrder.table_unit_id,
                    user_id: activeOrder.user_id,
                    status: 'zaplaceno',
                    price: paymentState.amount
                }, { headers });
            }

            // 3. Pokus o zápis do tabulky plateb
            try {
                await axios.post('/api/v1/payments', {
                    order_id: targetOrderId,
                    amount: paymentState.amount,
                    type: paymentState.method,    // Změněno z payment_method na type
                    status: 'zaplaceno'           // Přidáno chybějící pole status
                }, { headers });
            } catch (_paymentErr: unknown) { // Změněno na _paymentErr
                if (axios.isAxiosError(_paymentErr)) {
                    console.warn("⚠️ Varování: Platba schválena, ale zápis do /payments selhal.", _paymentErr.response?.data || _paymentErr.message);
                } else {
                    console.warn("⚠️ Varování: Neznámá chyba při ukládání do tabulky plateb.", _paymentErr);
                }
            }

            // Zobrazení úspěchu a vyčištění
            setPaymentState(prev => ({ ...prev, status: 'uspech' }));
            setTimeout(() => {
                setPaymentState(prev => ({ ...prev, isOpen: false }));
                if (!isPartialPayment) {
                    setActiveOrder(null); 
                }
                fetchData();
            }, 2000);

        } catch (err: unknown) {
            console.error("DEBUG - Plná chyba:", err); 
            
            let backendMsg = "Neznámá chyba serveru";
            if (axios.isAxiosError(err)) {
                backendMsg = err.response?.data?.message || 
                             err.response?.data?.error || 
                             (err.response?.data ? JSON.stringify(err.response.data) : "") || 
                             err.message;
            } else if (err instanceof Error) {
                backendMsg = err.message;
            }
            
            setPaymentState(prev => ({ ...prev, status: 'chyba', errorMessage: `Backend hlásí: ${backendMsg}` }));
        }
    };

    if (loading) return <p className="text-gray-400 text-center p-6">Načítám pokladní systém...</p>;

    const { allWaiters, activeWaiterIds } = getWaitersOnShift();

    // --- RENDER 1: DETAIL OTEVŘENÉHO ÚČTU ---
    if (activeOrder) {
        const currentOrder = activeOrder;
        const currentOrderItems = orderItems.filter(item => item.order_id === currentOrder.order_id);
        const totalAmount = currentOrderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const waiterName = users.find(u => u.user_id === currentOrder.user_id)?.name || `Číšník #${currentOrder.user_id}`;

        return (
            <div className="max-w-6xl mx-auto p-4 relative">
                
                {/* --- MOCK PLATEBNÍ BRÁNA (MODÁL) --- */}
                {paymentState.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center backdrop-blur-sm">
                        <div className="bg-gray-800 border border-gray-600 w-[550px] rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                            {paymentState.status !== 'uspech' && (
                                <button 
                                    onClick={() => setPaymentState(prev => ({ ...prev, isOpen: false }))}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
                                >✕</button>
                            )}
                            
                            <h2 className="text-2xl font-bold text-white mb-2 border-b border-gray-700 pb-2">
                                Pokladna - Platba
                            </h2>

                            {/* --- Fáze 0: Rozúčtování (Výběr položek) --- */}
                            {paymentState.status === 'vyber_polozek' && (
                                <div className="space-y-4 mt-4">
                                    <p className="text-gray-300 mb-2 font-medium">Co si přejete zaplatit?</p>
                                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 border border-gray-700 rounded-lg p-2 bg-gray-900/50">
                                        {paymentState.selection.map(item => {
                                            const details = menuItems.find(m => m.menuitem_id === item.menuitem_id);
                                            const isSelected = item.payQuantity > 0;
                                            return (
                                                <div key={item.orderitem_id} className={`flex justify-between items-center p-3 rounded transition-colors ${isSelected ? 'bg-gray-700 border border-blue-500/50' : 'bg-gray-800 border border-gray-700 opacity-60'}`}>
                                                    <div className="text-white">
                                                        {details?.name || `Položka #${item.menuitem_id}`} <br/>
                                                        <span className="text-xs text-gray-400">{item.price} Kč / ks</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => updateSelection(item.orderitem_id, -1)}
                                                            className="bg-red-900/50 hover:bg-red-800 text-red-300 w-8 h-8 rounded-full font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
                                                            disabled={item.payQuantity === 0}
                                                        >−</button>
                                                        <span className="text-white font-bold w-4 text-center text-lg">{item.payQuantity}</span>
                                                        <button
                                                            onClick={() => updateSelection(item.orderitem_id, 1)}
                                                            className="bg-green-900/50 hover:bg-green-800 text-green-300 w-8 h-8 rounded-full font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
                                                            disabled={item.payQuantity === item.maxQuantity}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                                        <div className="text-xl font-bold text-yellow-400">
                                            K úhradě: {paymentState.selection.reduce((sum, i) => sum + (i.payQuantity * i.price), 0)} Kč
                                        </div>
                                        <button
                                            onClick={() => {
                                                const finalAmount = paymentState.selection.reduce((sum, i) => sum + (i.payQuantity * i.price), 0);
                                                if(finalAmount === 0) { alert("Není vybráno nic k platbě."); return; }
                                                setPaymentState(prev => ({ ...prev, amount: finalAmount, status: 'vyber_metody' }));
                                            }}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-500 shadow-lg"
                                        >
                                            Přejít k platbě →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* --- Fáze 1: Výběr platební metody --- */}
                            {paymentState.status === 'vyber_metody' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xl font-mono text-yellow-400 font-bold mb-6 mt-4 bg-gray-900 p-4 rounded text-center">
                                        <span>Aktuální platba:</span>
                                        <span>{paymentState.amount} Kč</span>
                                    </div>
                                    <p className="text-gray-300 mb-2">Vyberte způsob platby:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setPaymentState(prev => ({ ...prev, method: 'karta', status: 'zpracovani_karty' }))}
                                            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-6 rounded-lg flex flex-col items-center gap-2 transition-transform active:scale-95 shadow-lg"
                                        >
                                            <span className="text-3xl">💳</span>
                                            Platební karta
                                        </button>
                                        <button 
                                            onClick={() => setPaymentState(prev => ({ ...prev, method: 'hotovost', status: 'kalkulacka_hotovosti' }))}
                                            className="bg-green-700 hover:bg-green-600 text-white font-bold py-6 rounded-lg flex flex-col items-center gap-2 transition-transform active:scale-95 shadow-lg"
                                        >
                                            <span className="text-3xl">💵</span>
                                            Hotovost
                                        </button>
                                    </div>
                                    <button onClick={() => setPaymentState(prev => ({ ...prev, status: 'vyber_polozek' }))} className="text-gray-400 hover:text-white text-sm mt-4 inline-block">
                                        ← Zpět na úpravu rozúčtování
                                    </button>
                                </div>
                            )}

                            {/* --- Fáze 2A: Karta --- */}
                            {paymentState.status === 'zpracovani_karty' && (
                                <div className="text-center space-y-6 mt-6">
                                    <div className="animate-pulse flex flex-col items-center">
                                        <div className="text-6xl mb-4">💳</div>
                                        <p className="text-blue-300 text-lg">Čekám na přiložení karty k terminálu...</p>
                                        <p className="font-bold text-2xl text-yellow-400 mt-2">{paymentState.amount} Kč</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded border border-gray-700 mt-6">
                                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Demo ovládání platební brány</p>
                                        <div className="flex gap-3 justify-center">
                                            <button 
                                                onClick={() => simulatePaymentResult(true)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold shadow"
                                            >
                                                [Simulovat: Zaplaceno]
                                            </button>
                                            <button 
                                                onClick={() => simulatePaymentResult(false, "Karta expirovala nebo byla zablokována.")}
                                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold shadow"
                                            >
                                                [Simulovat: Zamítnuto]
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => setPaymentState(prev => ({ ...prev, status: 'vyber_metody' }))} className="text-gray-400 hover:text-white underline text-sm mt-4">
                                        Zrušit platbu kartou
                                    </button>
                                </div>
                            )}

                            {/* --- Fáze 2B: Hotovost --- */}
                            {paymentState.status === 'kalkulacka_hotovosti' && (
                                <div className="space-y-4 mt-4">
                                    <div className="bg-gray-900 p-4 rounded text-center mb-4">
                                        <p className="text-gray-400">Útrata k úhradě:</p>
                                        <p className="text-3xl font-bold text-yellow-400">{paymentState.amount} Kč</p>
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">Přijatá hotovost od zákazníka (Kč):</label>
                                        <input 
                                            type="number" 
                                            value={paymentState.cashReceived}
                                            onChange={e => setPaymentState(prev => ({ ...prev, cashReceived: e.target.value }))}
                                            className="w-full bg-gray-900 border border-gray-600 text-white text-2xl p-3 rounded focus:outline-none focus:border-green-500 text-center font-mono"
                                            placeholder="Např. 500"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    {Number(paymentState.cashReceived) >= paymentState.amount && (
                                        <div className="bg-green-900/30 border border-green-800 p-4 rounded text-center">
                                            <p className="text-gray-400">Vrátit zákazníkovi zpět:</p>
                                            <p className="text-3xl font-bold text-green-400 mt-1">
                                                {Number(paymentState.cashReceived) - paymentState.amount} Kč
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-between mt-6">
                                        <button onClick={() => setPaymentState(prev => ({ ...prev, status: 'vyber_metody' }))} className="bg-gray-600 text-white px-4 py-2 rounded">
                                            Zpět
                                        </button>
                                        <button 
                                            onClick={() => simulatePaymentResult(true)}
                                            disabled={Number(paymentState.cashReceived) < paymentState.amount}
                                            className={`px-6 py-2 rounded font-bold ${Number(paymentState.cashReceived) >= paymentState.amount ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            Dokončit platbu
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* --- Fáze 3: Úspěch --- */}
                            {paymentState.status === 'uspech' && (
                                <div className="text-center py-8">
                                    <div className="text-7xl mb-4 text-green-500">✅</div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Platba úspěšná!</h3>
                                    <p className="text-gray-400">Položky byly zaplaceny a odečteny z účtu.</p>
                                </div>
                            )}

                            {/* --- Fáze 3: Chyba --- */}
                            {paymentState.status === 'chyba' && (
                                <div className="text-center py-6">
                                    <div className="text-6xl mb-4 text-red-500">❌</div>
                                    <h3 className="text-xl font-bold text-red-400 mb-2">Platba neprošla</h3>
                                    <p className="text-white bg-red-900 border border-red-700 p-3 rounded mb-6">
                                        {paymentState.errorMessage}
                                    </p>
                                    <button 
                                        onClick={() => setPaymentState(prev => ({ ...prev, status: 'vyber_metody' }))}
                                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500"
                                    >
                                        Zkusit znovu jinou metodu
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                )}
                {/* --- KONEC MODÁLU PLATEBNÍ BRÁNY --- */}

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
                        onClick={() => startPaymentProcess(currentOrder.order_id, currentOrderItems)}
                        className={`px-5 py-2 rounded font-bold transition-colors ${totalAmount > 0 ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                    >
                        Zaplatit / Rozúčtovat ({totalAmount} Kč)
                    </button>
                </div>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEVÝ PANEL */}
                    <div className="lg:col-span-5 bg-gray-800 p-4 rounded shadow-md flex flex-col justify-between min-h-[450px]">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Aktuální účet</h3>
                            {currentOrderItems.length === 0 ? (
                                <p className="text-gray-400 italic">Na tomto účtu zatím nejsou žádné položky.</p>
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
                                                    >✕</button>
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

                    {/* PRAVÝ PANEL */}
                    <div className="lg:col-span-7 bg-gray-800 p-4 rounded shadow-md">
                        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Nabídka menu</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
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

    // --- RENDER 2: HLAVNÍ PŘEHLED VŠECH STOLŮ ---
    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Pokladna — Přehled stolů</h1>
            {error && <p className="text-red-400 mb-4">{error}</p>}

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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.map(table => {
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
                                        className="w-full bg-red-700 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        Otevřít účet / Markovat
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCreatingOrderForTable(table.table_unit_id);
                                            if (activeWaiterIds.length > 0) setSelectedWaiterId(activeWaiterIds[0]);
                                        }}
                                        className="w-full bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-green-600 transition-colors shadow-sm"
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