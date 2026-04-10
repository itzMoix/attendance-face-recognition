import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 * Optionally checks for specific roles
 */
const ProtectedRoute = ({ children, allowedRoles = null }) => {
    const { isAuthenticated, user } = useAuthStore();

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role (if specified)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on their actual role
        switch (user.role) {
            case 'ADMIN':
                return <Navigate to="/admin" replace />;
            case 'PROFESSOR':
                return <Navigate to="/professor" replace />;
            case 'STUDENT':
                return <Navigate to="/student" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
