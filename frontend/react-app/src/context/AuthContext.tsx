import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface AuthContextType {
    token: string | null;
    role: string | null;
    loading: boolean;
    login: (name: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = useCallback(() => {
        setToken(null);
        setRole(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            logout();
            alert('Byli jste odhlášeni z důvodu nečinnosti.');
        }, INACTIVITY_TIMEOUT);
    }, [logout]);

    const login = async (name: string, password: string) => {
        setLoading(true);
        try {
            const response = await axios.post('/api/v1/login', { name, password });
            const accessToken = response.data.access_token;
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const userRole = payload.role;
            setToken(accessToken);
            setRole(userRole);
            resetTimer();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [token, resetTimer]);

    return (
        <AuthContext.Provider value={{ token, role, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth musí být použit uvnitř AuthProvider');
    return ctx;
};