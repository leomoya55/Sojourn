import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/jwt';

// Inicio de sesión — Sojourn Christian School.
// Diseño institucional de dos paneles: marca (navy) + formulario.
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        const e = {};
        if (!email.trim()) {
            e.email = 'El correo es obligatorio.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            e.email = 'Ingrese un correo válido.';
        }
        if (!password) {
            e.password = 'La contraseña es obligatoria.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setAuthError('');
        if (!validate()) return;

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            navigate(homePathForRole(result.rol), { replace: true });
        } else {
            setAuthError(result.message);
        }
    };

    return (
        <div className="scs-login">
            {/* Panel de marca */}
            <aside className="scs-login-brand">
                <div className="logo-box">
                    <img src="/logo.png" alt="Sojourn Christian School" />
                </div>
                <h1>Portal Académico Institucional</h1>
                <p>
                    Plataforma de gestión académica de Sojourn Christian School: administración
                    de materias, calificaciones, asistencia y comunicación con las familias, en un
                    solo lugar.
                </p>
                <div className="brand-foot">© 2026 Sojourn Christian School · Todos los derechos reservados</div>
            </aside>

            {/* Panel de formulario */}
            <main className="scs-login-form">
                <div className="scs-login-card">
                    <h2>Iniciar sesión</h2>
                    <p className="scs-login-sub">Ingrese sus credenciales para continuar</p>

                    {authError && <div className="scs-alert scs-alert-error">{authError}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="scs-field">
                            <label className="scs-label" htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                className={`scs-input ${errors.email ? 'error' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@sojourn.cr"
                            />
                            {errors.email && <span className="scs-field-msg">{errors.email}</span>}
                        </div>

                        <div className="scs-field">
                            <label className="scs-label" htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                className={`scs-input ${errors.password ? 'error' : ''}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                            />
                            {errors.password && <span className="scs-field-msg">{errors.password}</span>}
                        </div>

                        <button
                            type="submit"
                            className="scs-btn scs-btn-primary scs-login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Ingresando…' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="scs-login-foot">Sojourn Christian School — Portal Académico</p>
                </div>
            </main>
        </div>
    );
};

export default Login;
