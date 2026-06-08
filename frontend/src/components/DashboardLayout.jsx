import React from 'react';
import { useAuth } from '../context/AuthContext';

// Encabezado y contenedor común para los tres paneles.
// Identidad visual profesional: azul · verde · amarillo (portal institucional).
const DashboardLayout = ({ title, subtitle, children }) => {
    const { user, logout } = useAuth();

    const iniciales = (user?.nombre || '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="layout">
            <header className="topbar">
                <div className="topbar-brand">
                    <span className="topbar-logo">ILE</span>
                    <span>
                        Portal Académico
                        <small>Instituto de Lengua Española</small>
                    </span>
                </div>

                {/* Menú de usuario: el desplegable aparece al pasar el mouse */}
                <div className="user-menu" tabIndex={0}>
                    <button className="user-trigger" type="button">
                        <span className="user-avatar">{iniciales}</span>
                        <span className="user-info">
                            <span className="u-name">{user?.nombre}</span>
                            <span className="u-role">{user?.rol}</span>
                        </span>
                        <span className="user-caret">▼</span>
                    </button>

                    <div className="user-dropdown">
                        <div className="dd-header">
                            <div className="n">{user?.nombre}</div>
                            <div className="e">{user?.email}</div>
                        </div>
                        <button className="dd-item" onClick={logout}>
                            <span className="ico">⏻</span> Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="content">
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-sub">{subtitle}</p>}
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
