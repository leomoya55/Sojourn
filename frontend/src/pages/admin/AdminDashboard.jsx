import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, rolNombre } from '../../utils/roles';

// Panel del Administrador — Sojourn Christian School.
// Bitácora 05: gestión de cursos, estudiantes, usuarios y comunicados desde un
// único panel con barra lateral fija y cinco secciones. Todo en un solo archivo.
// Cada petición usa la instancia de axios (services/api) que adjunta el token JWT
// del usuario autenticado en el header Authorization: Bearer <token>.

/* ------------------------- Identidad visual Sojourn ------------------------- */
const C = {
    verdeOscuro: '#1a3a2a',
    verdeMedio: '#2d6a4f',
    verdeClaro: '#e8f5ee',
    navy: '#1a2e4a',
    blanco: '#ffffff',
    texto: '#1f2937',
    textoSuave: '#6b7280',
    borde: '#e2e8e4',
    fondo: '#f4f7f5',
    error: '#b91c1c',
    errorBg: '#fde8e8',
    ok: '#1b6b3a',
    okBg: '#e3f5ea',
};

const SECCIONES = [
    { key: 'inicio', label: 'Inicio', icon: '🏠' },
    { key: 'usuarios', label: 'Usuarios', icon: '👥' },
    { key: 'cursos', label: 'Cursos', icon: '📚' },
    { key: 'estudiantes', label: 'Estudiantes', icon: '🎓' },
    { key: 'comunicados', label: 'Comunicados', icon: '📢' },
];

/* ============================== COMPONENTE RAÍZ ============================== */
const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [seccion, setSeccion] = useState('inicio');

    const [usuarios, setUsuarios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [comunicados, setComunicados] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', msg }

    // Muestra un mensaje de éxito/error que se oculta automáticamente.
    const notificar = (tipo, msg) => {
        setAviso({ tipo, msg });
        window.clearTimeout(notificar._t);
        notificar._t = window.setTimeout(() => setAviso(null), 4000);
    };

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [u, c, e, com] = await Promise.all([
                api.get('/api/usuarios'),
                api.get('/api/cursos'),
                api.get('/api/estudiantes'),
                api.get('/api/comunicados'),
            ]);
            setUsuarios(u.data || []);
            setCursos(c.data || []);
            setEstudiantes(e.data || []);
            setComunicados(com.data || []);
        } catch {
            notificar('error', 'No se pudieron cargar los datos del sistema.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const irA = (key) => {
        setAviso(null);
        setSeccion(key);
    };

    // Docentes disponibles para asignación de cursos (rol_id = 2).
    const docentes = useMemo(
        () => usuarios.filter((u) => Number(u.rol_id) === 2),
        [usuarios]
    );

    const tituloSeccion = SECCIONES.find((s) => s.key === seccion)?.label || '';

    return (
        <div style={S.shell}>
            {/* ----------------------------- Sidebar fijo ----------------------------- */}
            <aside style={S.sidebar}>
                <div style={S.brand}>
                    <div style={S.brandLogo}>S</div>
                    <div>
                        <div style={S.brandName}>Sojourn</div>
                        <div style={S.brandSub}>Christian School</div>
                    </div>
                </div>

                <nav style={S.nav}>
                    {SECCIONES.map((s) => {
                        const activo = seccion === s.key;
                        return (
                            <button
                                key={s.key}
                                onClick={() => irA(s.key)}
                                style={{ ...S.navItem, ...(activo ? S.navItemActivo : null) }}
                            >
                                <span style={S.navIcon}>{s.icon}</span>
                                <span>{s.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div style={S.sidebarFoot}>
                    <div style={S.userBox}>
                        <div style={S.userAvatar}>
                            {(user?.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={S.userName}>{user?.nombre || 'Administrador'}</div>
                            <div style={S.userRole}>{user?.rol || 'administrador'}</div>
                        </div>
                    </div>
                    <button onClick={logout} style={S.logout}>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ------------------------------ Contenido ------------------------------ */}
            <main style={S.main}>
                <header style={S.topbar}>
                    <h1 style={S.titulo}>{tituloSeccion}</h1>
                    <span style={S.fecha}>
                        {new Date().toLocaleDateString('es-CR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                </header>

                {aviso && (
                    <div
                        style={{
                            ...S.aviso,
                            ...(aviso.tipo === 'error' ? S.avisoError : S.avisoOk),
                        }}
                    >
                        {aviso.msg}
                    </div>
                )}

                <section style={S.contenido}>
                    {cargando ? (
                        <p style={S.vacio}>Cargando información…</p>
                    ) : (
                        <>
                            {seccion === 'inicio' && (
                                <Inicio
                                    usuarios={usuarios}
                                    cursos={cursos}
                                    estudiantes={estudiantes}
                                    comunicados={comunicados}
                                    irA={irA}
                                />
                            )}
                            {seccion === 'usuarios' && (
                                <Usuarios
                                    usuarios={usuarios}
                                    recargar={cargarDatos}
                                    notificar={notificar}
                                />
                            )}
                            {seccion === 'cursos' && (
                                <Cursos
                                    cursos={cursos}
                                    docentes={docentes}
                                    recargar={cargarDatos}
                                    notificar={notificar}
                                />
                            )}
                            {seccion === 'estudiantes' && (
                                <Estudiantes
                                    estudiantes={estudiantes}
                                    cursos={cursos}
                                    recargar={cargarDatos}
                                    notificar={notificar}
                                />
                            )}
                            {seccion === 'comunicados' && (
                                <Comunicados
                                    comunicados={comunicados}
                                    recargar={cargarDatos}
                                    notificar={notificar}
                                />
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

/* =============================== SECCIÓN: INICIO ============================== */
const Inicio = ({ usuarios, cursos, estudiantes, comunicados, irA }) => {
    const tarjetas = [
        { key: 'usuarios', label: 'Usuarios', valor: usuarios.length, icon: '👥' },
        { key: 'cursos', label: 'Cursos', valor: cursos.length, icon: '📚' },
        { key: 'estudiantes', label: 'Estudiantes', valor: estudiantes.length, icon: '🎓' },
        { key: 'comunicados', label: 'Comunicados', valor: comunicados.length, icon: '📢' },
    ];

    return (
        <div style={S.cardsGrid}>
            {tarjetas.map((t) => (
                <button key={t.key} style={S.statCard} onClick={() => irA(t.key)}>
                    <span style={S.statIcon}>{t.icon}</span>
                    <span style={S.statValor}>{t.valor}</span>
                    <span style={S.statLabel}>{t.label}</span>
                </button>
            ))}
        </div>
    );
};

/* ============================== SECCIÓN: USUARIOS ============================= */
const Usuarios = ({ usuarios, recargar, notificar }) => {
    const [modal, setModal] = useState(false);

    // Desactivar usuario: DELETE /api/usuarios/:id
    const desactivar = async (u) => {
        if (!window.confirm(`¿Desactivar al usuario ${u.nombre} ${u.apellido || ''}?`)) return;
        try {
            await api.delete(`/api/usuarios/${u.id}`);
            notificar('ok', 'Usuario desactivado correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo desactivar el usuario.');
        }
    };

    return (
        <Panel
            titulo="Usuarios del sistema"
            accion={<BtnPrimario onClick={() => setModal(true)}>+ Nuevo usuario</BtnPrimario>}
        >
            {usuarios.length === 0 ? (
                <p style={S.vacio}>No hay usuarios registrados.</p>
            ) : (
                <Tabla columnas={['Nombre', 'Correo', 'Rol', 'Estado', 'Acción']}>
                    {usuarios.map((u) => (
                        <tr key={u.id}>
                            <td style={S.td}>{u.nombre} {u.apellido}</td>
                            <td style={S.td}>{u.email}</td>
                            <td style={S.td}>
                                <span style={S.badgeRol}>{rolNombre(u.rol_id)}</span>
                            </td>
                            <td style={S.td}>
                                <span style={u.activo === false ? S.badgeOff : S.badgeOn}>
                                    {u.activo === false ? 'Inactivo' : 'Activo'}
                                </span>
                            </td>
                            <td style={S.td}>
                                <BtnPeligro onClick={() => desactivar(u)}>Desactivar</BtnPeligro>
                            </td>
                        </tr>
                    ))}
                </Tabla>
            )}

            {modal && (
                <ModalNuevoUsuario
                    onClose={() => setModal(false)}
                    onListo={() => {
                        setModal(false);
                        notificar('ok', 'Usuario creado correctamente.');
                        recargar();
                    }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </Panel>
    );
};

const ModalNuevoUsuario = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol_id: 2,
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido || !form.email || !form.password) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        if (form.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setGuardando(true);
        try {
            // Crear usuario: POST /api/usuarios
            await api.post('/api/usuarios', { ...form, rol_id: Number(form.rol_id) });
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el usuario.';
            setError(msg);
            onError?.(msg);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Nuevo usuario" onClose={onClose}>
            {error && <div style={{ ...S.aviso, ...S.avisoError }}>{error}</div>}
            <form onSubmit={enviar}>
                <div style={S.formRow}>
                    <Campo label="Nombre">
                        <input style={S.input} value={form.nombre} onChange={set('nombre')} />
                    </Campo>
                    <Campo label="Apellido">
                        <input style={S.input} value={form.apellido} onChange={set('apellido')} />
                    </Campo>
                </div>
                <Campo label="Correo electrónico">
                    <input style={S.input} type="email" value={form.email} onChange={set('email')} />
                </Campo>
                <Campo label="Contraseña">
                    <input
                        style={S.input}
                        type="password"
                        value={form.password}
                        onChange={set('password')}
                    />
                </Campo>
                <Campo label="Rol">
                    <select style={S.input} value={form.rol_id} onChange={set('rol_id')}>
                        {ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.nombre}
                            </option>
                        ))}
                    </select>
                </Campo>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear usuario" />
            </form>
        </Modal>
    );
};

/* =============================== SECCIÓN: CURSOS ============================== */
const Cursos = ({ cursos, docentes, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
    const [sel, setSel] = useState({}); // { [cursoId]: docenteId }

    // Asignar docente: POST /api/cursos/:id/asignar-docente
    const asignarDocente = async (cursoId) => {
        const docenteId = sel[cursoId];
        if (!docenteId) {
            notificar('error', 'Seleccione un docente antes de asignar.');
            return;
        }
        try {
            await api.post(`/api/cursos/${cursoId}/asignar-docente`, {
                docente_id: Number(docenteId),
            });
            notificar('ok', 'Docente asignado al curso correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo asignar el docente.');
        }
    };

    return (
        <Panel
            titulo="Cursos registrados"
            accion={<BtnPrimario onClick={() => setModal(true)}>+ Nuevo curso</BtnPrimario>}
        >
            {cursos.length === 0 ? (
                <p style={S.vacio}>No hay cursos registrados.</p>
            ) : (
                <Tabla columnas={['Curso', 'Descripción', 'Docente', 'Asignar docente']}>
                    {cursos.map((c) => (
                        <tr key={c.id}>
                            <td style={S.td}>{c.nombre}</td>
                            <td style={{ ...S.td, color: C.textoSuave }}>{c.descripcion || '—'}</td>
                            <td style={S.td}>{c.docente_nombre || c.docente || '—'}</td>
                            <td style={S.td}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select
                                        style={{ ...S.input, minWidth: 160 }}
                                        value={sel[c.id] || ''}
                                        onChange={(e) => setSel({ ...sel, [c.id]: e.target.value })}
                                    >
                                        <option value="">Seleccione…</option>
                                        {docentes.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.nombre} {d.apellido}
                                            </option>
                                        ))}
                                    </select>
                                    <BtnNavy onClick={() => asignarDocente(c.id)}>Asignar</BtnNavy>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Tabla>
            )}

            {modal && (
                <ModalNuevoCurso
                    onClose={() => setModal(false)}
                    onListo={() => {
                        setModal(false);
                        notificar('ok', 'Curso creado correctamente.');
                        recargar();
                    }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </Panel>
    );
};

const ModalNuevoCurso = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ nombre: '', descripcion: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre.trim()) {
            setError('El nombre del curso es obligatorio.');
            return;
        }
        setGuardando(true);
        try {
            // Crear curso: POST /api/cursos
            await api.post('/api/cursos', form);
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el curso.';
            setError(msg);
            onError?.(msg);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Nuevo curso" onClose={onClose}>
            {error && <div style={{ ...S.aviso, ...S.avisoError }}>{error}</div>}
            <form onSubmit={enviar}>
                <Campo label="Nombre del curso">
                    <input style={S.input} value={form.nombre} onChange={set('nombre')} />
                </Campo>
                <Campo label="Descripción">
                    <textarea
                        style={{ ...S.input, resize: 'vertical' }}
                        rows={3}
                        value={form.descripcion}
                        onChange={set('descripcion')}
                    />
                </Campo>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear curso" />
            </form>
        </Modal>
    );
};

/* ============================ SECCIÓN: ESTUDIANTES =========================== */
const Estudiantes = ({ estudiantes, cursos, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
    const [sel, setSel] = useState({}); // { [estudianteId]: cursoId }

    // Inscribir a curso: POST /api/estudiantes/:id/asignar-curso
    const inscribir = async (estudianteId) => {
        const cursoId = sel[estudianteId];
        if (!cursoId) {
            notificar('error', 'Seleccione un curso antes de inscribir.');
            return;
        }
        try {
            await api.post(`/api/estudiantes/${estudianteId}/asignar-curso`, {
                curso_id: Number(cursoId),
            });
            notificar('ok', 'Estudiante inscrito al curso correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo inscribir al estudiante.');
        }
    };

    return (
        <Panel
            titulo="Estudiantes de la institución"
            accion={<BtnPrimario onClick={() => setModal(true)}>+ Nuevo estudiante</BtnPrimario>}
        >
            {estudiantes.length === 0 ? (
                <p style={S.vacio}>No hay estudiantes registrados.</p>
            ) : (
                <Tabla columnas={['Nombre', 'Fecha de nacimiento', 'Inscribir a curso']}>
                    {estudiantes.map((e) => (
                        <tr key={e.id}>
                            <td style={S.td}>{e.nombre} {e.apellido}</td>
                            <td style={S.td}>
                                {e.fecha_nacimiento
                                    ? String(e.fecha_nacimiento).slice(0, 10)
                                    : '—'}
                            </td>
                            <td style={S.td}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select
                                        style={{ ...S.input, minWidth: 160 }}
                                        value={sel[e.id] || ''}
                                        onChange={(ev) => setSel({ ...sel, [e.id]: ev.target.value })}
                                    >
                                        <option value="">Seleccione…</option>
                                        {cursos.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <BtnNavy onClick={() => inscribir(e.id)}>Inscribir</BtnNavy>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Tabla>
            )}

            {modal && (
                <ModalNuevoEstudiante
                    onClose={() => setModal(false)}
                    onListo={() => {
                        setModal(false);
                        notificar('ok', 'Estudiante creado correctamente.');
                        recargar();
                    }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </Panel>
    );
};

const ModalNuevoEstudiante = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido) {
            setError('El nombre y el apellido son obligatorios.');
            return;
        }
        setGuardando(true);
        try {
            // Crear estudiante: POST /api/estudiantes
            await api.post('/api/estudiantes', form);
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el estudiante.';
            setError(msg);
            onError?.(msg);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Nuevo estudiante" onClose={onClose}>
            {error && <div style={{ ...S.aviso, ...S.avisoError }}>{error}</div>}
            <form onSubmit={enviar}>
                <div style={S.formRow}>
                    <Campo label="Nombre">
                        <input style={S.input} value={form.nombre} onChange={set('nombre')} />
                    </Campo>
                    <Campo label="Apellido">
                        <input style={S.input} value={form.apellido} onChange={set('apellido')} />
                    </Campo>
                </div>
                <Campo label="Fecha de nacimiento">
                    <input
                        style={S.input}
                        type="date"
                        value={form.fecha_nacimiento}
                        onChange={set('fecha_nacimiento')}
                    />
                </Campo>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear estudiante" />
            </form>
        </Modal>
    );
};

/* =========================== SECCIÓN: COMUNICADOS ============================ */
const Comunicados = ({ comunicados, recargar, notificar }) => {
    const [modal, setModal] = useState(false);

    // Eliminar comunicado: DELETE /api/comunicados/:id
    const eliminar = async (id) => {
        if (!window.confirm('¿Eliminar este comunicado?')) return;
        try {
            await api.delete(`/api/comunicados/${id}`);
            notificar('ok', 'Comunicado eliminado correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo eliminar el comunicado.');
        }
    };

    return (
        <Panel
            titulo="Comunicados institucionales"
            accion={<BtnPrimario onClick={() => setModal(true)}>+ Nuevo comunicado</BtnPrimario>}
        >
            {comunicados.length === 0 ? (
                <p style={S.vacio}>No hay comunicados publicados.</p>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {comunicados.map((c) => (
                        <article key={c.id} style={S.comunicado}>
                            <div style={{ flex: 1 }}>
                                <h3 style={S.comunicadoTitulo}>{c.titulo}</h3>
                                <p style={S.comunicadoTexto}>{c.contenido}</p>
                            </div>
                            <BtnPeligro onClick={() => eliminar(c.id)}>Eliminar</BtnPeligro>
                        </article>
                    ))}
                </div>
            )}

            {modal && (
                <ModalNuevoComunicado
                    onClose={() => setModal(false)}
                    onListo={() => {
                        setModal(false);
                        notificar('ok', 'Comunicado publicado correctamente.');
                        recargar();
                    }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </Panel>
    );
};

const ModalNuevoComunicado = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ titulo: '', contenido: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.titulo.trim() || !form.contenido.trim()) {
            setError('El título y el contenido son obligatorios.');
            return;
        }
        setGuardando(true);
        try {
            // Crear comunicado: POST /api/comunicados
            await api.post('/api/comunicados', form);
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo publicar el comunicado.';
            setError(msg);
            onError?.(msg);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Nuevo comunicado" onClose={onClose}>
            {error && <div style={{ ...S.aviso, ...S.avisoError }}>{error}</div>}
            <form onSubmit={enviar}>
                <Campo label="Título">
                    <input style={S.input} value={form.titulo} onChange={set('titulo')} />
                </Campo>
                <Campo label="Contenido">
                    <textarea
                        style={{ ...S.input, resize: 'vertical' }}
                        rows={4}
                        value={form.contenido}
                        onChange={set('contenido')}
                    />
                </Campo>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Publicar" />
            </form>
        </Modal>
    );
};

/* ============================ COMPONENTES AUXILIARES ========================= */
const Panel = ({ titulo, accion, children }) => (
    <div style={S.panel}>
        <div style={S.panelHead}>
            <h2 style={S.panelTitulo}>{titulo}</h2>
            {accion}
        </div>
        {children}
    </div>
);

const Tabla = ({ columnas, children }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
            <thead>
                <tr>
                    {columnas.map((c) => (
                        <th key={c} style={S.th}>{c}</th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    </div>
);

const Modal = ({ titulo, onClose, children }) => (
    <div style={S.overlay} onClick={onClose}>
        <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHead}>
                <h2 style={S.modalTitulo}>{titulo}</h2>
                <button style={S.modalClose} onClick={onClose} aria-label="Cerrar">
                    ×
                </button>
            </div>
            {children}
        </div>
    </div>
);

const Campo = ({ label, children }) => (
    <label style={S.campo}>
        <span style={S.campoLabel}>{label}</span>
        {children}
    </label>
);

const AccionesModal = ({ onClose, guardando, texto }) => (
    <div style={S.modalAcciones}>
        <button type="button" style={S.btnGhost} onClick={onClose}>
            Cancelar
        </button>
        <button type="submit" style={{ ...S.btn, ...S.btnPrimario }} disabled={guardando}>
            {guardando ? 'Guardando…' : texto}
        </button>
    </div>
);

const BtnPrimario = ({ onClick, children }) => (
    <button style={{ ...S.btn, ...S.btnPrimario }} onClick={onClick}>
        {children}
    </button>
);
const BtnNavy = ({ onClick, children }) => (
    <button style={{ ...S.btn, ...S.btnNavy }} onClick={onClick}>
        {children}
    </button>
);
const BtnPeligro = ({ onClick, children }) => (
    <button style={{ ...S.btn, ...S.btnPeligro }} onClick={onClick}>
        {children}
    </button>
);

/* ================================== ESTILOS ================================= */
const S = {
    shell: {
        display: 'flex',
        minHeight: '100vh',
        background: C.fondo,
        color: C.texto,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },

    /* Sidebar */
    sidebar: {
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        width: 250,
        minWidth: 250,
        height: '100vh',
        background: C.verdeOscuro,
        color: C.blanco,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        boxSizing: 'border-box',
    },
    brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 24px' },
    brandLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: C.verdeMedio,
        color: C.blanco,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: 22,
    },
    brandName: { fontWeight: 700, fontSize: 18, lineHeight: 1.1 },
    brandSub: { fontSize: 12, color: C.verdeClaro, opacity: 0.85 },
    nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        borderRadius: 10,
        border: 'none',
        background: 'transparent',
        color: C.verdeClaro,
        font: 'inherit',
        fontSize: 15,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .15s',
    },
    navItemActivo: { background: C.verdeMedio, color: C.blanco, fontWeight: 600 },
    navIcon: { fontSize: 18, width: 22, textAlign: 'center' },
    sidebarFoot: { borderTop: `1px solid rgba(255,255,255,0.12)`, paddingTop: 16 },
    userBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 12px' },
    userAvatar: {
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: C.verdeMedio,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
    },
    userName: {
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userRole: { fontSize: 12, color: C.verdeClaro, opacity: 0.8, textTransform: 'capitalize' },
    logout: {
        width: '100%',
        padding: '10px',
        borderRadius: 10,
        border: `1px solid rgba(255,255,255,0.2)`,
        background: 'transparent',
        color: C.blanco,
        font: 'inherit',
        fontSize: 14,
        cursor: 'pointer',
    },

    /* Main */
    main: { flex: 1, padding: '28px 36px', minWidth: 0 },
    topbar: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 8,
    },
    titulo: { fontSize: 26, fontWeight: 700, color: C.verdeOscuro, margin: 0 },
    fecha: { color: C.textoSuave, fontSize: 14, textTransform: 'capitalize' },
    contenido: {},

    aviso: { padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: 14, fontWeight: 500 },
    avisoOk: { background: C.okBg, color: C.ok, border: `1px solid ${C.ok}33` },
    avisoError: { background: C.errorBg, color: C.error, border: `1px solid ${C.error}33` },

    /* Tarjetas de inicio */
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 18,
    },
    statCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        background: C.blanco,
        border: `1px solid ${C.borde}`,
        borderLeft: `5px solid ${C.verdeMedio}`,
        borderRadius: 14,
        padding: '20px 22px',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        boxShadow: '0 1px 3px rgba(16,40,28,0.06)',
    },
    statIcon: { fontSize: 24 },
    statValor: { fontSize: 34, fontWeight: 800, color: C.verdeOscuro, lineHeight: 1 },
    statLabel: { fontSize: 14, color: C.textoSuave, fontWeight: 600 },

    /* Panel / tabla */
    panel: {
        background: C.blanco,
        border: `1px solid ${C.borde}`,
        borderRadius: 14,
        padding: 22,
        boxShadow: '0 1px 3px rgba(16,40,28,0.06)',
    },
    panelHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
        flexWrap: 'wrap',
    },
    panelTitulo: { fontSize: 18, fontWeight: 700, color: C.verdeOscuro, margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: {
        textAlign: 'left',
        padding: '10px 12px',
        borderBottom: `2px solid ${C.borde}`,
        color: C.textoSuave,
        fontWeight: 600,
        whiteSpace: 'nowrap',
    },
    td: { padding: '12px', borderBottom: `1px solid ${C.borde}`, verticalAlign: 'middle' },

    badgeRol: {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: C.verdeClaro,
        color: C.verdeMedio,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
    },
    badgeOn: {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: C.okBg,
        color: C.ok,
        fontSize: 12,
        fontWeight: 600,
    },
    badgeOff: {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: C.errorBg,
        color: C.error,
        fontSize: 12,
        fontWeight: 600,
    },

    /* Comunicados */
    comunicado: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 16,
        border: `1px solid ${C.borde}`,
        borderLeft: `4px solid ${C.navy}`,
        borderRadius: 12,
        background: C.blanco,
    },
    comunicadoTitulo: { margin: '0 0 6px', fontSize: 16, color: C.navy },
    comunicadoTexto: { margin: 0, color: C.textoSuave, fontSize: 14, lineHeight: 1.5 },

    /* Vacío */
    vacio: { color: C.textoSuave, padding: '24px 4px', textAlign: 'center', fontSize: 14 },

    /* Botones */
    btn: {
        padding: '9px 16px',
        borderRadius: 9,
        border: 'none',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    btnPrimario: { background: C.verdeMedio, color: C.blanco },
    btnNavy: { background: C.navy, color: C.blanco },
    btnPeligro: { background: C.error, color: C.blanco },
    btnGhost: {
        padding: '9px 16px',
        borderRadius: 9,
        border: `1px solid ${C.borde}`,
        background: C.blanco,
        color: C.texto,
        font: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
    },

    /* Modal */
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(16,30,22,0.5)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50,
    },
    modal: {
        width: '100%',
        maxWidth: 460,
        background: C.blanco,
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        maxHeight: '90vh',
        overflowY: 'auto',
    },
    modalHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitulo: { fontSize: 19, fontWeight: 700, color: C.verdeOscuro, margin: 0 },
    modalClose: {
        border: 'none',
        background: 'transparent',
        fontSize: 26,
        lineHeight: 1,
        color: C.textoSuave,
        cursor: 'pointer',
    },
    modalAcciones: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },

    /* Formularios */
    formRow: { display: 'flex', gap: 12 },
    campo: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flex: 1 },
    campoLabel: { fontSize: 13, fontWeight: 600, color: C.texto },
    input: {
        padding: '10px 12px',
        borderRadius: 9,
        border: `1px solid ${C.borde}`,
        font: 'inherit',
        fontSize: 14,
        width: '100%',
        boxSizing: 'border-box',
        background: C.blanco,
        color: C.texto,
    },
};

export default AdminDashboard;
