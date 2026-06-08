import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { ROLES, rolNombre } from '../utils/roles';

// Panel del administrador.
// Tarjetas de estadísticas que funcionan como accesos directos a cada módulo,
// gestión de estudiantes, usuarios, cursos y comunicados.
const AdminDashboard = () => {
    const [tab, setTab] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [comunicados, setComunicados] = useState([]);
    const [feedback, setFeedback] = useState(null);

    const cargarDatos = async () => {
        try {
            const [u, c, e, com] = await Promise.all([
                api.get('/usuarios'),
                api.get('/cursos'),
                api.get('/estudiantes'),
                api.get('/comunicados'),
            ]);
            setUsuarios(u.data);
            setCursos(c.data);
            setEstudiantes(e.data);
            setComunicados(com.data);
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudieron cargar los datos.' });
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Limpia el mensaje al cambiar de sección.
    const irA = (destino) => {
        setFeedback(null);
        setTab(destino);
    };

    const docentes = usuarios.filter((u) => Number(u.rol_id) === 2);

    return (
        <DashboardLayout
            title="Panel del Administrador"
            subtitle="Gestión integral de estudiantes, usuarios, cursos y comunicados."
        >
            {feedback && (
                <div className={`alert alert-${feedback.type === 'error' ? 'error' : 'success'}`}>
                    {feedback.msg}
                </div>
            )}

            {/* Tarjetas-acceso directo a cada módulo */}
            <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => irA('estudiantes')}>
                    <div className="stat-label">Estudiantes</div>
                    <div className="stat-value">{estudiantes.length}</div>
                    <span className="stat-go">Administrar →</span>
                </div>
                <div className="stat-card clickable" onClick={() => irA('cursos')}>
                    <div className="stat-label">Cursos activos</div>
                    <div className="stat-value">{cursos.length}</div>
                    <span className="stat-go">Administrar →</span>
                </div>
                <div className="stat-card clickable" onClick={() => irA('usuarios')}>
                    <div className="stat-label">Docentes</div>
                    <div className="stat-value">{docentes.length}</div>
                    <span className="stat-go">Administrar →</span>
                </div>
                <div className="stat-card clickable" onClick={() => irA('comunicados')}>
                    <div className="stat-label">Comunicados</div>
                    <div className="stat-value">{comunicados.length}</div>
                    <span className="stat-go">Administrar →</span>
                </div>
            </div>

            <div className="tabs">
                {[
                    ['resumen', 'Resumen'],
                    ['estudiantes', 'Estudiantes'],
                    ['usuarios', 'Usuarios'],
                    ['cursos', 'Cursos'],
                    ['comunicados', 'Comunicados'],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        className={`tab ${tab === key ? 'active' : ''}`}
                        onClick={() => irA(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'resumen' && (
                <div className="card">
                    <div className="card-head">
                        <h2>Últimos comunicados</h2>
                    </div>
                    {comunicados.length === 0 ? (
                        <p className="empty">No hay comunicados registrados.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Contenido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comunicados.slice(0, 5).map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.titulo}</td>
                                        <td className="muted">{c.contenido}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'estudiantes' && (
                <EstudiantesPanel
                    estudiantes={estudiantes}
                    onChange={cargarDatos}
                    setFeedback={setFeedback}
                />
            )}

            {tab === 'usuarios' && (
                <UsuariosPanel usuarios={usuarios} onChange={cargarDatos} setFeedback={setFeedback} />
            )}

            {tab === 'cursos' && (
                <CursosPanel
                    cursos={cursos}
                    docentes={docentes}
                    onChange={cargarDatos}
                    setFeedback={setFeedback}
                />
            )}

            {tab === 'comunicados' && (
                <ComunicadosPanel
                    comunicados={comunicados}
                    onChange={cargarDatos}
                    setFeedback={setFeedback}
                />
            )}
        </DashboardLayout>
    );
};

/* ---------------- Estudiantes (listado completo de la institución) ---------------- */
const ESTUDIANTE_VACIO = {
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    email: '',
};

const EstudiantesPanel = ({ estudiantes, onChange, setFeedback }) => {
    const [modal, setModal] = useState(null); // null | 'nuevo' | objeto estudiante

    return (
        <div className="card">
            <div className="card-head">
                <h2>Estudiantes de la institución</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setModal('nuevo')}>
                    + Nuevo estudiante
                </button>
            </div>

            {estudiantes.length === 0 ? (
                <p className="empty">No hay estudiantes registrados.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Fecha nac.</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estudiantes.map((e) => (
                            <tr key={e.id}>
                                <td>
                                    {e.nombre} {e.apellido}
                                </td>
                                <td>{e.fecha_nacimiento ? String(e.fecha_nacimiento).slice(0, 10) : '—'}</td>
                                <td>{e.telefono || '—'}</td>
                                <td>{e.email || '—'}</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(e)}>
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {modal && (
                <EstudianteModal
                    estudiante={modal === 'nuevo' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={(msg) => {
                        setModal(null);
                        setFeedback({ type: 'ok', msg });
                        onChange();
                    }}
                />
            )}
        </div>
    );
};

const EstudianteModal = ({ estudiante, onClose, onSaved }) => {
    const esEdicion = Boolean(estudiante);
    const [form, setForm] = useState(
        esEdicion
            ? {
                  nombre: estudiante.nombre || '',
                  apellido: estudiante.apellido || '',
                  fecha_nacimiento: estudiante.fecha_nacimiento
                      ? String(estudiante.fecha_nacimiento).slice(0, 10)
                      : '',
                  direccion: estudiante.direccion || '',
                  telefono: estudiante.telefono || '',
                  email: estudiante.email || '',
              }
            : { ...ESTUDIANTE_VACIO }
    );
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido) {
            setError('El nombre y el apellido son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            if (esEdicion) {
                await api.put(`/estudiantes/${estudiante.id}`, form);
                onSaved('Estudiante actualizado correctamente.');
            } else {
                await api.post('/estudiantes', form);
                onSaved('Estudiante creado correctamente.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar el estudiante.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(ev) => ev.stopPropagation()}>
                <h2>{esEdicion ? 'Editar estudiante' : 'Nuevo estudiante'}</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={submit}>
                    <div className="row">
                        <div className="field">
                            <label>Nombre</label>
                            <input value={form.nombre} onChange={set('nombre')} />
                        </div>
                        <div className="field">
                            <label>Apellido</label>
                            <input value={form.apellido} onChange={set('apellido')} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="field">
                            <label>Fecha de nacimiento</label>
                            <input
                                type="date"
                                value={form.fecha_nacimiento}
                                onChange={set('fecha_nacimiento')}
                            />
                        </div>
                        <div className="field">
                            <label>Teléfono</label>
                            <input value={form.telefono} onChange={set('telefono')} />
                        </div>
                    </div>
                    <div className="field">
                        <label>Dirección</label>
                        <input value={form.direccion} onChange={set('direccion')} />
                    </div>
                    <div className="field">
                        <label>Correo electrónico</label>
                        <input type="email" value={form.email} onChange={set('email')} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear estudiante'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ---------------- Gestión de usuarios ---------------- */
const UsuariosPanel = ({ usuarios, onChange, setFeedback }) => {
    const [modal, setModal] = useState(false);

    const toggleActivo = async (u) => {
        try {
            await api.patch(`/usuarios/${u.id}/estado`, { activo: !u.activo });
            setFeedback({ type: 'ok', msg: 'Estado del usuario actualizado.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo cambiar el estado.' });
        }
    };

    return (
        <div className="card">
            <div className="card-head">
                <h2>Usuarios del sistema</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
                    + Nuevo usuario
                </button>
            </div>

            {usuarios.length === 0 ? (
                <p className="empty">No hay usuarios registrados.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    {u.nombre} {u.apellido}
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    <span className="badge badge-role">{rolNombre(u.rol_id)}</span>
                                </td>
                                <td>
                                    <span className={`badge ${u.activo ? 'badge-on' : 'badge-off'}`}>
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-green'}`}
                                        onClick={() => toggleActivo(u)}
                                    >
                                        {u.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {modal && (
                <NuevoUsuarioModal
                    onClose={() => setModal(false)}
                    onCreated={() => {
                        setModal(false);
                        setFeedback({ type: 'ok', msg: 'Usuario creado correctamente.' });
                        onChange();
                    }}
                />
            )}
        </div>
    );
};

const NuevoUsuarioModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol_id: 2,
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido || !form.email || !form.password) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/auth/register', { ...form, rol_id: Number(form.rol_id) });
            onCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear el usuario.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Nuevo usuario</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={submit}>
                    <div className="row">
                        <div className="field">
                            <label>Nombre</label>
                            <input value={form.nombre} onChange={set('nombre')} />
                        </div>
                        <div className="field">
                            <label>Apellido</label>
                            <input value={form.apellido} onChange={set('apellido')} />
                        </div>
                    </div>
                    <div className="field">
                        <label>Correo electrónico</label>
                        <input type="email" value={form.email} onChange={set('email')} />
                    </div>
                    <div className="field">
                        <label>Contraseña</label>
                        <input type="password" value={form.password} onChange={set('password')} />
                    </div>
                    <div className="field">
                        <label>Rol</label>
                        <select value={form.rol_id} onChange={set('rol_id')}>
                            {ROLES.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando…' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ---------------- Gestión de cursos ---------------- */
const CursosPanel = ({ cursos, docentes, onChange, setFeedback }) => {
    const [form, setForm] = useState({ nombre: '', descripcion: '' });
    const [asignar, setAsignar] = useState({});

    const crearCurso = async (ev) => {
        ev.preventDefault();
        if (!form.nombre) return;
        try {
            await api.post('/cursos', form);
            setForm({ nombre: '', descripcion: '' });
            setFeedback({ type: 'ok', msg: 'Curso creado correctamente.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo crear el curso.' });
        }
    };

    const eliminarCurso = async (id) => {
        try {
            await api.delete(`/cursos/${id}`);
            setFeedback({ type: 'ok', msg: 'Curso desactivado correctamente.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo desactivar el curso.' });
        }
    };

    const asignarDocente = async (cursoId) => {
        const docenteId = asignar[cursoId];
        if (!docenteId) return;
        try {
            await api.post(`/cursos/${cursoId}/asignar-docente`, { docente_id: Number(docenteId) });
            setFeedback({ type: 'ok', msg: 'Docente asignado al curso.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo asignar el docente.' });
        }
    };

    return (
        <>
            <div className="card">
                <div className="card-head">
                    <h2>Crear curso</h2>
                </div>
                <form onSubmit={crearCurso} className="row" style={{ alignItems: 'flex-end' }}>
                    <div className="field">
                        <label>Nombre del curso</label>
                        <input
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Descripción</label>
                        <input
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto' }}>
                        Agregar
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-head">
                    <h2>Cursos registrados</h2>
                </div>
                {cursos.length === 0 ? (
                    <p className="empty">No hay cursos registrados.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Curso</th>
                                <th>Descripción</th>
                                <th>Asignar docente</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cursos.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.nombre}</td>
                                    <td className="muted">{c.descripcion}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <select
                                                value={asignar[c.id] || ''}
                                                onChange={(e) =>
                                                    setAsignar({ ...asignar, [c.id]: e.target.value })
                                                }
                                            >
                                                <option value="">Seleccione…</option>
                                                {docentes.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.nombre} {d.apellido}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn btn-navy btn-sm"
                                                onClick={() => asignarDocente(c.id)}
                                            >
                                                Asignar
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => eliminarCurso(c.id)}
                                        >
                                            Desactivar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

/* ---------------- Gestión de comunicados ---------------- */
const ComunicadosPanel = ({ comunicados, onChange, setFeedback }) => {
    const [form, setForm] = useState({ titulo: '', contenido: '' });

    const crear = async (ev) => {
        ev.preventDefault();
        if (!form.titulo || !form.contenido) {
            setFeedback({ type: 'error', msg: 'El título y el contenido son obligatorios.' });
            return;
        }
        try {
            await api.post('/comunicados', form);
            setForm({ titulo: '', contenido: '' });
            setFeedback({ type: 'ok', msg: 'Comunicado publicado correctamente.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo publicar el comunicado.' });
        }
    };

    const eliminar = async (id) => {
        try {
            await api.delete(`/comunicados/${id}`);
            setFeedback({ type: 'ok', msg: 'Comunicado eliminado.' });
            onChange();
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo eliminar el comunicado.' });
        }
    };

    return (
        <>
            <div className="card">
                <div className="card-head">
                    <h2>Publicar comunicado</h2>
                </div>
                <form onSubmit={crear}>
                    <div className="field">
                        <label>Título</label>
                        <input
                            value={form.titulo}
                            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Contenido</label>
                        <textarea
                            rows="3"
                            value={form.contenido}
                            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Publicar
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-head">
                    <h2>Comunicados publicados</h2>
                </div>
                {comunicados.length === 0 ? (
                    <p className="empty">No hay comunicados publicados.</p>
                ) : (
                    comunicados.map((c) => (
                        <div key={c.id} className="comunicado" style={{ position: 'relative' }}>
                            <h3>{c.titulo}</h3>
                            <p className="muted">{c.contenido}</p>
                            <button
                                className="btn btn-danger btn-sm"
                                style={{ position: 'absolute', top: 12, right: 12 }}
                                onClick={() => eliminar(c.id)}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default AdminDashboard;
