import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


interface TableUnit {
    table_unit_id: number;
    seats: number;
}

interface Reservation {
    reservation_id: number;
    date: string;
    start_time: string;
    end_time: string;
    person_count: number;
    table_unit_id: number;
}

const DAYS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const MONTHS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

const HomePage: React.FC = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [tables, setTables] = useState<TableUnit[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const navigate = useNavigate();

    const { token } = useAuth();

    useEffect(() => {
    axios.get('/api/v1/tables').then(r => setTables(r.data)).catch(() => {});
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get('/api/v1/reservations', { headers }).then(r => setReservations(r.data)).catch(() => {});
    }, [token]);

    // Dny v měsíci
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    const formatDate = (day: number) => {
        const m = String(currentMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${currentYear}-${m}-${d}`;
    };

    const getReservationsForDate = (date: string) =>
        reservations.filter(r => r.date === date);

    const getReservedTableIds = (date: string) =>
        new Set(getReservationsForDate(date).map(r => r.table_unit_id));

    return (
    <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Přehled rezervací</h1>
            {token ? (
                <button
                    onClick={() => { localStorage.removeItem('access_token'); navigate('/login'); }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                    Odhlásit se
                </button>
            ) : (
                <button
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    Přihlásit se
                </button>
            )}
        </div>

        {/* Kalendář */}
        <div className="bg-gray-800 rounded shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">←</button>
                <h2 className="text-xl font-semibold text-white">{MONTHS[currentMonth]} {currentYear}</h2>
                <button onClick={nextMonth} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">→</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-400 mb-2">
                {DAYS.map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dateStr = formatDate(day);
                    const isToday = dateStr === today.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const hasReservation = getReservationsForDate(dateStr).length > 0;

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                                    p-2 rounded cursor-pointer text-center text-sm text-white
                                    ${isSelected ? 'bg-blue-600' : ''}
                                    ${isToday && !isSelected ? 'border-2 border-blue-400' : ''}
                                    ${hasReservation && !isSelected ? 'bg-gray-700' : ''}
                                    ${!isSelected && !isToday && !hasReservation ? 'hover:bg-gray-700' : ''}
                                    ${!isSelected && hasReservation ? 'hover:bg-gray-600' : ''}
                                `}
                            >
                                {day}
                                {hasReservation && (
                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mx-auto mt-0.5" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-orange-400 rounded-full inline-block" /> Má rezervace
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-blue-400 rounded inline-block" /> Dnes
                    </span>
                </div>
            </div>

            {/* Přehled stolů */}
            {selectedDate && (
    <div className="bg-gray-800 rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-white">
            Stoly pro {selectedDate}
        </h2>
        {tables.length === 0 ? (
            <p className="text-gray-400">Žádné stoly nenalezeny.</p>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tables.map(table => {
                    const reserved = getReservedTableIds(selectedDate).has(table.table_unit_id);
                    return (
                        <div
                            key={table.table_unit_id}
                            className={`p-3 rounded border text-center ${
                                reserved
                                    ? 'bg-red-900 border-red-700'
                                    : 'bg-green-900 border-green-700'
                            }`}
                        >
                            <div className="font-semibold text-white">Stůl #{table.table_unit_id}</div>
                            <div className="text-sm text-gray-400">{table.seats} míst</div>
                            <div className={`text-sm font-medium mt-1 ${reserved ? 'text-red-400' : 'text-green-400'}`}>
                                {reserved ? 'Rezervováno' : 'Volný'}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
)}
        </div>
    );
};

export default HomePage;