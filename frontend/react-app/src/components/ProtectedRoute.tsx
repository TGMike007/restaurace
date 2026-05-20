import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const { token, role, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!token || !role) {
        // Uložíme původní cestu do state
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;