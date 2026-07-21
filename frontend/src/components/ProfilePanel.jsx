import React, { useState } from 'react';
import { UserCircle, KeyRound } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FormInput from './FormInput';

// Perfil del usuario y cambio de contraseña — disponible para todos los roles
// (Bitácora 07). El backend valida la contraseña actual antes de cambiarla.
const ProfilePanel = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
    const [errores, setErrores] = useState({});
    const [aviso, setAviso] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const validar = () => {
        const er = {};
        if (!form.actual) er.actual = 'Ingrese su contraseña actual.';
        if (!form.nueva) er.nueva = 'Ingrese la nueva contraseña.';
        else if (form.nueva.length < 6) er.nueva = 'Debe tener al menos 6 caracteres.';
        if (form.confirmar !== form.nueva) er.confirmar = 'Las contraseñas no coinciden.';
        setErrores(er);
        return Object.keys(er).length === 0;
    };

    const enviar = async (e) => {
        e.preventDefault();
        setAviso(null);
        if (!validar()) return;
        setGuardando(true);
        try {
            await api.patch(`/api/usuarios/${user.id}/password`, {
                actual: form.actual,
                nueva: form.nueva,
            });
            setAviso({ tipo: 'ok', msg: 'Contraseña actualizada correctamente.' });
            setForm({ actual: '', nueva: '', confirmar: '' });
        } catch (err) {
            setAviso({ tipo: 'error', msg: err.response?.data?.message || 'No se pudo cambiar la contraseña.' });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
            <div className="scs-card">
                <div className="scs-card-head">
                    <h2 className="scs-card-title"><UserCircle size={18} /> Datos personales</h2>
                </div>
                <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
                    <Dato label="Nombre" valor={`${user?.nombre || ''}`} />
                    <Dato label="Correo electrónico" valor={user?.email} />
                    <Dato label="Rol" valor={user?.rol} capitalize />
                </dl>
            </div>

            <div className="scs-card">
                <div className="scs-card-head">
                    <h2 className="scs-card-title"><KeyRound size={18} /> Cambiar contraseña</h2>
                </div>
                {aviso && (
                    <div className={`scs-alert ${aviso.tipo === 'error' ? 'scs-alert-error' : 'scs-alert-ok'}`}>
                        {aviso.msg}
                    </div>
                )}
                <form onSubmit={enviar}>
                    <FormInput
                        label="Contraseña actual"
                        type="password"
                        value={form.actual}
                        onChange={set('actual')}
                        error={errores.actual}
                    />
                    <FormInput
                        label="Nueva contraseña"
                        type="password"
                        value={form.nueva}
                        onChange={set('nueva')}
                        error={errores.nueva}
                    />
                    <FormInput
                        label="Confirmar nueva contraseña"
                        type="password"
                        value={form.confirmar}
                        onChange={set('confirmar')}
                        error={errores.confirmar}
                    />
                    <button type="submit" className="scs-btn scs-btn-primary" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Actualizar contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Dato = ({ label, valor, capitalize }) => (
    <div>
        <dt style={{ fontSize: 12, color: 'var(--scs-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</dt>
        <dd style={{ margin: '2px 0 0', fontSize: 15, color: 'var(--scs-text)', textTransform: capitalize ? 'capitalize' : 'none' }}>
            {valor || '—'}
        </dd>
    </div>
);

export default ProfilePanel;
