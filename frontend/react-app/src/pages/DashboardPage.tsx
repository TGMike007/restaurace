import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { role } = useAuth();

    if (!role) {
        navigate('/login');
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">
                Dashboard — {role === 'admin' ? 'Administrátor' : role === 'vedouci' ? 'Vedoucí' : 'Číšník'}
            </h1>

            {/* Společné pro všechny */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                    onClick={() => navigate('/reservations')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Rezervace</h2>
                    <p className="text-gray-400">Správa rezervací stolů</p>
                </div>

                <div
                    onClick={() => navigate('/orders')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Objednávky</h2>
                    <p className="text-gray-400">Správa objednávek</p>
                </div>

                <div
                    onClick={() => navigate('/menu')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Menu</h2>
                    <p className="text-gray-400">Přehled jídel a nápojů</p>
                </div>

                <div
                    onClick={() => navigate('/shifts')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Směny</h2>
                    <p className="text-gray-400">Přehled směn</p>
                </div>

                <div
                    onClick={() => navigate('/customers')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Zákazníci</h2>
                    <p className="text-gray-400">Správa zákazníků</p>
                </div>
                                        
                <div
                    onClick={() => navigate('/tables')}
                    className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <h2 className="text-xl font-semibold text-white mb-2">Stoly</h2>
                    <p className="text-gray-400">Přehled a správa stolů</p>
                </div>
            </div>

            {/* Pouze vedoucí a admin */}
            {(role === 'vedouci' || role === 'admin') && (
                <>
                    <h2 className="text-xl font-semibold text-white mb-4">Správa provozu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div
                            onClick={() => navigate('/days')}
                            className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <h2 className="text-xl font-semibold text-white mb-2">Dny</h2>
                            <p className="text-gray-400">Správa provozních dní</p>
                        </div>

                        <div
                            onClick={() => navigate('/reports')}
                            className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <h2 className="text-xl font-semibold text-white mb-2">Reporty</h2>
                            <p className="text-gray-400">Přehledy a reporty</p>
                        </div>
                    </div>
                </>
            )}

            {/* Pouze admin */}
            {role === 'admin' && (
                <>
                    <h2 className="text-xl font-semibold text-white mb-4">Administrace</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => navigate('/users')}
                            className="bg-gray-800 p-6 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <h2 className="text-xl font-semibold text-white mb-2">Uživatelé</h2>
                            <p className="text-gray-400">Správa uživatelů systému</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;