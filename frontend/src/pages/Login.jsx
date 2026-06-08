import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/jwt';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Bitácora 04, obj. 6: validación de formularios en el frontend.
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
            // Bitácora 03, obj. 5: redirección según el rol del usuario.
            navigate(homePathForRole(result.rol), { replace: true });
        } else {
            setAuthError(result.message);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-card">
                <div className="login-brand">ILE</div>
                <h1>Gestión Académica</h1>
                <p className="login-sub">
                    Asociación del Instituto de Lengua Española
                </p>

                {authError && <div className="alert alert-error">{authError}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            className={errors.email ? 'input-error' : ''}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@instituto.cr"
                        />
                        {errors.email && <span className="field-msg">{errors.email}</span>}
                    </div>

                    <div className="field">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            className={errors.password ? 'input-error' : ''}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <span className="field-msg">{errors.password}</span>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Ingresando…' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="login-foot">
                    © 2026 Asociación del Instituto de Lengua Española
                </p>
            </div>
        </div>
    );
};

export default Login;
