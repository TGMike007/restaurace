import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Day {
    date: string;
    status: string;
    user_id: number;
}

interface Report {
    report_id: number;
    content: string;
    date: string;
}

interface User {
    user_id: number;
    name: string;
}

const STATUS_OPTIONS = ['otevreny', 'zavreny'];

const DaysPage: React.FC = () => {
    const [days, setDays] = useState<Day[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDayForm, setShowDayForm] = useState(false);
    const [editDay, setEditDay] = useState<Day | null>(null);
    const [dayForm, setDayForm] = useState({ date: '', status: 'otevreny', user_id: '' });
    const [reportForm, setReportForm] = useState({ content: '', date: '' });
    const [editReport, setEditReport] = useState<Report | null>(null);
    const [showReportForm, setShowReportForm] = useState<string | null>(null);

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchDays = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/days', { headers });
            setDays(response.data);
            setError(null);
        } catch {
            setError('Nepodařilo se načíst dny.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const response = await axios.get('/api/v1/reports', { headers });
            setReports(response.data);
        } catch {
            setError('Nepodařilo se načíst reporty.');
        }
    };

    useEffect(() => {
        fetchDays();
        fetchReports();
        axios.get('/api/v1/users', { headers }).then(r => setUsers(r.data)).catch(() => {});
    }, []);

    const handleDaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { date: dayForm.date, status: dayForm.status, user_id: Number(dayForm.user_id) };
            if (editDay) {
                await axios.put(`/api/v1/days/${editDay.date}`, data, { headers });
            } else {
                await axios.post('/api/v1/days', data, { headers });
            }
            setShowDayForm(false);
            setEditDay(null);
            setDayForm({ date: '', status: 'otevreny', user_id: '' });
            fetchDays();
        } catch {
            setError('Nepodařilo se uložit den.');
        }
    };

    const handleDayEdit = (day: Day) => {
        setEditDay(day);
        setDayForm({ date: day.date, status: day.status, user_id: String(day.user_id) });
        setShowDayForm(true);
    };

    const handleDayDelete = async (date: string) => {
        if (!confirm('Opravdu smazat tento den?')) return;
        try {
            await axios.delete(`/api/v1/days/${date}`, { headers });
            fetchDays();
        } catch {
            setError('Nepodařilo se smazat den.');
        }
    };

    const handleReportSubmit = async (e: React.FormEvent, date: string) => {
        e.preventDefault();
        try {
            if (editReport) {
                await axios.put(`/api/v1/reports/${editReport.report_id}`, { content: reportForm.content, date }, { headers });
            } else {
                await axios.post('/api/v1/reports', { content: reportForm.content, date }, { headers });
            }
            setShowReportForm(null);
            setEditReport(null);
            setReportForm({ content: '', date: '' });
            fetchReports();
        } catch {
            setError('Nepodařilo se uložit report.');
        }
    };

    const handleReportDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tento report?')) return;
        try {
            await axios.delete(`/api/v1/reports/${id}`, { headers });
            fetchReports();
        } catch {
            setError('Nepodařilo se smazat report.');
        }
    };

    const getReportForDay = (date: string) => reports.find(r => r.date === date);

    const getUserName = (userId: number) => {
        const u = users.find(u => u.user_id === userId);
        return u ? u.name : `Uživatel #${userId}`;
    };

    if (loading) return <p className="text-gray-400 text-center">Načítám dny...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Dny a reporty</h1>
                <button
                    onClick={() => { setShowDayForm(true); setEditDay(null); setDayForm({ date: '', status: 'otevreny', user_id: '' }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Nový den
                </button>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/* Formulář dne */}
            {showDayForm && (
                <div className="bg-gray-800 p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editDay ? 'Upravit den' : 'Nový den'}
                    </h2>
                    <form onSubmit={handleDaySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Datum</label>
                                <input
                                    type="date"
                                    value={dayForm.date}
                                    onChange={e => setDayForm({ ...dayForm, date: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                    disabled={!!editDay}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stav</label>
                                <select
                                    value={dayForm.status}
                                    onChange={e => setDayForm({ ...dayForm, status: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Zodpovědný uživatel</label>
                                <select
                                    value={dayForm.user_id}
                                    onChange={e => setDayForm({ ...dayForm, user_id: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Vyberte uživatele</option>
                                    {users.map(u => (
                                        <option key={u.user_id} value={u.user_id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                {editDay ? 'Uložit změny' : 'Vytvořit'}
                            </button>
                            <button type="button" onClick={() => { setShowDayForm(false); setEditDay(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors">
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Seznam dní */}
            {days.length === 0 ? (
                <p className="text-gray-400">Žádné dny.</p>
            ) : (
                <div className="space-y-4">
                    {days.map(day => {
                        const report = getReportForDay(day.date);
                        return (
                            <div key={day.date} className="bg-gray-800 rounded shadow">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors rounded"
                                    onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                                >
                                    <div>
                                        <span className="text-white font-semibold">{day.date}</span>
                                        <span className="text-gray-400 ml-3 text-sm">{getUserName(day.user_id)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm px-2 py-1 rounded ${day.status === 'otevreny' ? 'bg-green-800 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                            {day.status}
                                        </span>
                                        {report && <span className="text-xs text-blue-400">📄 Report</span>}
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDayEdit(day); }}
                                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                                        >
                                            Upravit
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDayDelete(day.date); }}
                                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                        >
                                            Smazat
                                        </button>
                                        <span className="text-gray-400">{expandedDay === day.date ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Report pro den */}
                                {expandedDay === day.date && (
                                    <div className="border-t border-gray-700 p-4">
                                        <h3 className="text-white font-medium mb-3">Report</h3>
                                        {report ? (
                                            <div>
                                                <p className="text-gray-300 mb-3 whitespace-pre-wrap">{report.content}</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setEditReport(report); setReportForm({ content: report.content, date: day.date }); setShowReportForm(day.date); }}
                                                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                                                    >
                                                        Upravit report
                                                    </button>
                                                    <button
                                                        onClick={() => handleReportDelete(report.report_id)}
                                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                    >
                                                        Smazat report
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditReport(null); setReportForm({ content: '', date: day.date }); setShowReportForm(day.date); }}
                                                className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                            >
                                                + Přidat report
                                            </button>
                                        )}

                                        {showReportForm === day.date && (
                                            <form onSubmit={e => handleReportSubmit(e, day.date)} className="mt-4 space-y-3">
                                                <textarea
                                                    value={reportForm.content}
                                                    onChange={e => setReportForm({ ...reportForm, content: e.target.value })}
                                                    rows={4}
                                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                                    placeholder="Obsah reportu..."
                                                    required
                                                />
                                                <div className="flex gap-2">
                                                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                                        {editReport ? 'Uložit' : 'Přidat'}
                                                    </button>
                                                    <button type="button" onClick={() => { setShowReportForm(null); setEditReport(null); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">
                                                        Zrušit
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DaysPage;