import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Chrome compartido de los tres paneles (admin, docente, padre):
// topbar navy con logo + usuario, y barra lateral blanca con la navegación.
// En pantallas pequeñas la barra lateral se convierte en un menú deslizable.
//
// Props:
//   title       — título de la sección actual
//   subtitle    — texto secundario opcional
//   nav         — [{ key, label, icon }]  (icon = componente de lucide-react)
//   active      — key de la sección activa
//   onNavigate  — (key) => void
const DashboardShell = ({ title, subtitle, nav, active, onNavigate, children }) => {
    const { user, logout } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const navegar = (key) => {
        setMenuAbierto(false);
        onNavigate(key);
    };

    return (
        <div className="scs-shell">
            {/* Topbar */}
            <header className="scs-topbar">
                <div className="scs-brand">
                    <button
                        className="scs-hamburger"
                        onClick={() => setMenuAbierto((v) => !v)}
                        aria-label="Menú"
                    >
                        {menuAbierto ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="scs-logo-chip">
                        <img src="/logo.png" alt="Sojourn Christian School" />
                    </span>
                    <span className="scs-brand-text">Sojourn Christian School</span>
                </div>

                <div className="scs-user-area">
                    <div className="scs-user-info">
                        <span className="scs-user-name">{user?.nombre || 'Usuario'}</span>
                        <span className="scs-user-role">{user?.rol || ''}</span>
                    </div>
                    <button className="scs-logout" onClick={logout}>
                        <LogOut size={18} />
                        <span className="scs-logout-text">Cerrar sesión</span>
                    </button>
                </div>
            </header>

            {/* Cuerpo: sidebar + contenido */}
            <div className="scs-body">
                {menuAbierto && <div className="scs-overlay-nav" onClick={() => setMenuAbierto(false)} />}
                <aside className={`scs-sidebar ${menuAbierto ? 'open' : ''}`}>
                    <nav className="scs-nav">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.key}
                                    className={`scs-navitem ${active === item.key ? 'active' : ''}`}
                                    onClick={() => navegar(item.key)}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="scs-main">
                    {title && <h1 className="scs-page-title">{title}</h1>}
                    {subtitle && <p className="scs-page-sub">{subtitle}</p>}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardShell;
