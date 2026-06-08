import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';
import { decodeToken, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

// Construye el objeto de usuario a partir del token guardado.
const userFromStorage = () => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        return null;
    }
    const decoded = decodeToken(token);
    return {
        token,
        id: decoded.id,
        nombre: decoded.nombre,
        email: decoded.email,
        rol: decoded.rol,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(userFromStorage);

    // Bitácora 03, obj. 5: login conectado al backend con validación de credenciales.
    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { token } = response.data;
            localStorage.setItem('token', token);

            const decoded = decodeToken(token);
            const loggedUser = {
                token,
                id: decoded.id,
                nombre: decoded.nombre,
                email: decoded.email,
                rol: decoded.rol,
            };
            setUser(loggedUser);
            return { success: true, rol: loggedUser.rol };
        } catch (error) {
            const message =
                error.response?.data?.message ||
                'No se pudo iniciar sesión. Verifique sus credenciales.';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const isAuthenticated = () => user !== null;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
