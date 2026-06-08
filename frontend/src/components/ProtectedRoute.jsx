import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/jwt';

// Protege rutas según autenticación y rol.
// Bitácora 04, obj. 5: navegación protegida con redirección automática por rol.
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    // Si la ruta exige roles específicos y el usuario no los tiene,
    // se le redirige a su propio panel.
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        return <Navigate to={homePathForRole(user.rol)} replace />;
    }

    return children;
};

export default ProtectedRoute;
