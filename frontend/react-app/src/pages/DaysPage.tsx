import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Report {
    report_id: number;
    content: string;
    date: string;
}

interface Shift {
    shift_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
}

const DaysPage: React.FC = () => {
    // Inicializace na dnešní datum ve formátu YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    
    const [reports, setReports] = useState<Report[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Stavy pro správu textového reportu/poznámky k danému dni
    const [reportForm, setReportForm] = useState({ content: '' });
    const [isEditingReport, setIsEditingReport] = useState(false);

    const { token } = useAuth();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportsRes, shiftsRes] = await Promise.all([
                axios.get('/api/v1/reports', { 
                    headers: { Authorization: `Bearer ${token}` } 
                }),
                axios.get('/api/v1/shifts', { 
                    headers: { Authorization: `Bearer ${token}` } 
                })
            ]);
            setReports(reportsRes.data);
            setShifts(shiftsRes.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst data z databáze.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

// Nová pomocná funkce, která bezpečně převede cokoliv na YYYY-MM-DD v lokálním čase
    const safeFormatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.substring(0, 10); // Pokud selže převod, vrátí ořez
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filtrování dat pro aktuálně zvolený den s novou funkcí
    const currentDayShifts = shifts.filter(s => safeFormatDate(s.date) === selectedDate);
    const currentDayReport = reports.find(r => safeFormatDate(r.date) === selectedDate);

    // Odeslání nového nebo upraveného reportu
    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentDayReport) {
                // Aktualizace stávajícího
                await axios.put(`/api/v1/reports/${currentDayReport.report_id}`, { 
                    content: reportForm.content, 
                    date: selectedDate 
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else {
                // Vytvoření nového pro toto datum
                await axios.post('/api/v1/reports', { 
                    content: reportForm.content, 
                    date: selectedDate 
                }, { headers: { Authorization: `Bearer ${token}` }} );
            }
            setIsEditingReport(false);
            // Znovu načteme reporty z backendu
            const response = await axios.get('/api/v1/reports', { headers: { Authorization: `Bearer ${token}` }});
            setReports(response.data);
        } catch {
            setError('Nepodařilo se uložit report pro vybraný den.');
        }
    };

    const handleReportDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tento report?')) return;
        try {
            await axios.delete(`/api/v1/reports/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            const response = await axios.get('/api/v1/reports', { headers: { Authorization: `Bearer ${token}` }});
            setReports(response.data);
            setReportForm({ content: '' });
        } catch {
            setError('Nepodařilo se smazat report.');
        }
    };

    // Spuštění editoru s předvyplněným textem
    const startEditReport = () => {
        setReportForm({ content: currentDayReport ? currentDayReport.content : '' });
        setIsEditingReport(true);
    };

    // Analýza textu reportu (sčítání tržeb a objednávek ze směn obsažených v textu)
    const parseDaySummary = (content: string) => {
        let totalRevenue = 0;
        let totalOrders = 0;

        const revenueRegex = /Celková celková tržba:\s*([\d.]+)\s*Kč/g;
        let revMatch;
        while ((revMatch = revenueRegex.exec(content)) !== null) {
            totalRevenue += parseFloat(revMatch[1]);
        }

        const ordersRegex = /Celkový počet objednávek v tomto čase:\s*(\d+)/g;
        let ordMatch;
        while ((ordMatch = ordersRegex.exec(content)) !== null) {
            totalOrders += parseInt(ordMatch[1], 10);
        }

        return { totalRevenue, totalOrders };
    };

    const { totalRevenue, totalOrders } = currentDayReport 
        ? parseDaySummary(currentDayReport.content) 
        : { totalRevenue: 0, totalOrders: 0 };

    if (loading) return <p className="text-gray-400 text-center py-10 font-medium">Načítám provozní data...</p>;

    // Pomocná proměnná pro zjištění, zda den vůbec měl nějakou aktivitu
    const hasActivity = currentDayShifts.length > 0 || !!currentDayReport;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Výběrová lišta data */}
            <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dny a reporty</h1>
                    <p className="text-gray-400 text-xs mt-0.5">Zvolte libovolný den v roce pro zobrazení výsledků</p>
                </div>
                <div className="w-full sm:w-auto">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setIsEditingReport(false);
                        }}
                        className="w-full sm:w-64 bg-gray-700 border border-gray-600 text-white font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                </div>
            </div>

            {error && <p className="text-red-400 mb-4 bg-red-900/20 border border-red-800 p-3 rounded-lg text-sm">{error}</p>}

            {/* Blok, pokud v tento den nic nebylo */}
            {!hasActivity ? (
                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-10 text-center shadow-sm">
                    <div className="text-4xl mb-3">📭</div>
                    <h3 className="text-lg font-medium text-gray-300">Žádná směna ani aktivita v tento den</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mt-1">
                        Pro datum <span className="text-gray-400 font-semibold">{new Date(selectedDate).toLocaleDateString('cs-CZ')}</span> nebyly naplánovány ani dokončeny žádné směny a neexistuje žádný zapsaný report.
                    </p>
                    <button
                        onClick={startEditReport}
                        className="mt-4 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs px-3 py-2 rounded-lg transition-colors"
                    >
                        + Zapsat ruční poznámku/report k tomuto dni
                    </button>
                </div>
            ) : (
                /* Pokud v tento den byla aktivita */
                <div className="space-y-6">
                    
                    {/* 1. SEKCE: SMĚNY TOHOTO DNE */}
                    <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700/70">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>⏱️</span> Provozní směny ({currentDayShifts.length})
                        </h2>
                        {currentDayShifts.length === 0 ? (
                            <p className="text-xs text-gray-500 italic bg-gray-900/40 p-3 rounded-lg border border-gray-800">
                                V tento den v rozpisu směn nebyla evidována žádná směna.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentDayShifts.map(s => (
                                    <div key={s.shift_id} className="bg-gray-900/60 border border-gray-700/60 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <span className="text-white text-sm font-medium">Směna #{s.shift_id}</span>
                                            <div className="text-gray-400 text-xs mt-0.5">
                                                Čas: <span className="text-gray-200 font-mono">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                            s.status === 'dokoncena' ? 'bg-blue-950 text-blue-400 border border-blue-900/50' : 
                                            s.status === 'probihajici' ? 'bg-amber-950 text-amber-400 border border-amber-900/50' : 
                                            'bg-gray-800 text-gray-400'
                                        } border`}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. SEKCE: TEXTOVÝ VÝPIS REPORTŮ */}
                    <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700/70">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span>📄</span> Uzávěrky a detailní zprávy
                            </h2>
                            {!currentDayReport && !isEditingReport && (
                                <button
                                    onClick={startEditReport}
                                    className="bg-green-800 text-green-200 px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
                                >
                                    + Přidat textový report
                                </button>
                            )}
                        </div>

                        {currentDayReport && !isEditingReport && (
                            <div className="bg-gray-950/70 border border-gray-800 p-4 rounded-lg">
                                <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                    {currentDayReport.content}
                                </pre>
                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-900">
                                    <button
                                        onClick={startEditReport}
                                        className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-700 border border-gray-700 transition-colors"
                                    >
                                        Upravit text
                                    </button>
                                    <button
                                        onClick={() => handleReportDelete(currentDayReport.report_id)}
                                        className="text-xs bg-red-950/40 text-red-400 px-3 py-1.5 rounded hover:bg-red-900/40 border border-red-900/30 transition-colors"
                                    >
                                        Smazat report
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Editor reportu */}
                        {isEditingReport && (
                            <form onSubmit={handleReportSubmit} className="space-y-3 bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                                <textarea
                                    value={reportForm.content}
                                    onChange={e => setReportForm({ content: e.target.value })}
                                    rows={6}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-200 font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Vepište detaily o provozu..."
                                    required
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 transition-colors">
                                        {currentDayReport ? 'Uložit úpravy' : 'Zapsat nový report'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditingReport(false)} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-xs hover:bg-gray-600 transition-colors">
                                        Zrušit
                                    </button>
                                </div>
                            </form>
                        )}

                        {!currentDayReport && !isEditingReport && (
                            <p className="text-xs text-gray-500 italic bg-gray-900/40 p-3 rounded-lg border border-gray-800">
                                Z tohoto dne dosud nevznikl žádný systémový report uzávěrky.
                            </p>
                        )}
                    </div>

                    {/* 3. SEKCE: SUMARIZACE VŠECH SMĚN NA KONCI */}
                    {currentDayReport && (
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800/50 p-5 rounded-xl border border-blue-900/20 shadow-md">
                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span>📊</span> Celková finanční sumarizace dne
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/80">
                                    <div className="text-xs text-gray-400">Celková denní tržba (z reportovaných směn)</div>
                                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                                        {totalRevenue.toLocaleString()} Kč
                                    </div>
                                </div>
                                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/80">
                                    <div className="text-xs text-gray-400">Celkem vyřízených objednávek</div>
                                    <div className="text-2xl font-bold text-white mt-1">
                                        {totalOrders} ks
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default DaysPage;