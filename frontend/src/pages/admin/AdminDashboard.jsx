import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, Bell, Plus, Trash2, UserPlus,
    Eye, Search, BarChart3, CalendarRange, UserCircle, FileDown, FileSpreadsheet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import DashboardShell from '../../components/DashboardShell';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import Table from '../../components/Table';
import ProfilePanel from '../../components/ProfilePanel';
import { ROLES, rolNombre } from '../../utils/roles';

// Panel del Administrador — Sojourn Christian School.
// Gestión de usuarios, cursos, estudiantes, comunicados, reportes y períodos.

const NAV = [
    { key: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'cursos', label: 'Materias', icon: BookOpen },
    { key: 'estudiantes', label: 'Estudiantes', icon: GraduationCap },
    { key: 'comunicados', label: 'Comunicados', icon: Bell },
    { key: 'reportes', label: 'Reportes', icon: BarChart3 },
    { key: 'periodos', label: 'Períodos', icon: CalendarRange },
    { key: 'perfil', label: 'Perfil', icon: UserCircle },
];

// Niveles/grados. Las materias van de 1° a 11°; los estudiantes abarcan desde
// materno hasta duodécimo.
const NIVELES_MATERIA = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];
const NIVELES_ESTUDIANTE = ['Materno', 'Prekínder', 'Kínder', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°', '12°'];

const AdminDashboard = () => {
    const [seccion, setSeccion] = useState('inicio');
    const [usuarios, setUsuarios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [comunicados, setComunicados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [aviso, setAviso] = useState(null);

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

    useEffect(() => { cargarDatos(); }, []);

    const irA = (key) => { setAviso(null); setSeccion(key); };

    const docentes = useMemo(() => usuarios.filter((u) => Number(u.rol_id) === 2), [usuarios]);
    const padres = useMemo(() => usuarios.filter((u) => Number(u.rol_id) === 3), [usuarios]);
    const titulo = NAV.find((n) => n.key === seccion)?.label || '';

    return (
        <DashboardShell title={titulo} nav={NAV} active={seccion} onNavigate={irA}>
            {aviso && (
                <div className={`scs-alert ${aviso.tipo === 'error' ? 'scs-alert-error' : 'scs-alert-ok'}`}>{aviso.msg}</div>
            )}

            {cargando ? (
                <p className="scs-empty">Cargando información…</p>
            ) : (
                <>
                    {seccion === 'inicio' && <Inicio usuarios={usuarios} cursos={cursos} estudiantes={estudiantes} comunicados={comunicados} irA={irA} />}
                    {seccion === 'usuarios' && <Usuarios usuarios={usuarios} recargar={cargarDatos} notificar={notificar} />}
                    {seccion === 'cursos' && <Cursos cursos={cursos} docentes={docentes} recargar={cargarDatos} notificar={notificar} />}
                    {seccion === 'estudiantes' && <Estudiantes estudiantes={estudiantes} cursos={cursos} padres={padres} recargar={cargarDatos} notificar={notificar} />}
                    {seccion === 'comunicados' && <Comunicados comunicados={comunicados} padres={padres} recargar={cargarDatos} notificar={notificar} />}
                    {seccion === 'reportes' && <Reportes notificar={notificar} />}
                    {seccion === 'periodos' && <Periodos notificar={notificar} />}
                    {seccion === 'perfil' && <ProfilePanel />}
                </>
            )}
        </DashboardShell>
    );
};

/* =============================== INICIO ============================== */
const Inicio = ({ usuarios, cursos, estudiantes, comunicados, irA }) => {
    const tarjetas = [
        { key: 'usuarios', label: 'Usuarios', valor: usuarios.length, Icon: Users },
        { key: 'cursos', label: 'Materias', valor: cursos.length, Icon: BookOpen },
        { key: 'estudiantes', label: 'Estudiantes', valor: estudiantes.length, Icon: GraduationCap },
        { key: 'comunicados', label: 'Comunicados', valor: comunicados.length, Icon: Bell },
    ];
    return (
        <div className="scs-stats-grid">
            {tarjetas.map(({ key, label, valor, Icon }) => (
                <button key={key} className="scs-stat-card" onClick={() => irA(key)}>
                    <div className="scs-stat-head"><span className="scs-stat-label">{label}</span><span className="scs-stat-icon"><Icon size={20} /></span></div>
                    <span className="scs-stat-value">{valor}</span>
                </button>
            ))}
        </div>
    );
};

/* ----------------- Barra de búsqueda / filtros reutilizable ---------------- */
const Toolbar = ({ children }) => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>{children}</div>
);
const SearchBox = ({ value, onChange, placeholder }) => (
    <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
        <Search size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--scs-muted)' }} />
        <input className="scs-input" style={{ paddingLeft: 34 }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
);

/* ============================== USUARIOS ============================= */
const Usuarios = ({ usuarios, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

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

    const filtrados = usuarios.filter((u) => {
        const txt = `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase();
        if (busqueda && !txt.includes(busqueda.toLowerCase())) return false;
        if (filtroRol && Number(u.rol_id) !== Number(filtroRol)) return false;
        if (filtroEstado === 'activo' && u.activo === false) return false;
        if (filtroEstado === 'inactivo' && u.activo !== false) return false;
        return true;
    });

    return (
        <div className="scs-card">
            <div className="scs-card-head">
                <h2 className="scs-card-title"><Users size={18} /> Usuarios del sistema</h2>
                <button className="scs-btn scs-btn-primary scs-btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo usuario</button>
            </div>

            <Toolbar>
                <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o correo…" />
                <select className="scs-input" style={{ width: 'auto' }} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                    <option value="">Todos los roles</option>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                <select className="scs-input" style={{ width: 'auto' }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                </select>
            </Toolbar>

            <Table
                columns={['Nombre', 'Correo', 'Rol', 'Estado', 'Acción']}
                rows={filtrados}
                emptyText="No hay usuarios que coincidan."
                renderRow={(u) => (
                    <tr key={u.id}>
                        <td>{u.nombre} {u.apellido}</td>
                        <td>{u.email}</td>
                        <td><span className="scs-badge scs-badge-gray">{rolNombre(u.rol_id)}</span></td>
                        <td><span className={`scs-badge ${u.activo === false ? 'scs-badge-danger' : 'scs-badge-green'}`}>{u.activo === false ? 'Inactivo' : 'Activo'}</span></td>
                        <td><button className="scs-btn scs-btn-danger scs-btn-sm" onClick={() => desactivar(u)}><Trash2 size={15} /> Desactivar</button></td>
                    </tr>
                )}
            />

            {modal && (
                <ModalNuevoUsuario
                    onClose={() => setModal(false)}
                    onListo={() => { setModal(false); notificar('ok', 'Usuario creado correctamente.'); recargar(); }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </div>
    );
};

const ModalNuevoUsuario = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol_id: 2 });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido || !form.email || !form.password) return setError('Todos los campos son obligatorios.');
        if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
        setGuardando(true);
        try {
            await api.post('/api/auth/register', { ...form, rol_id: Number(form.rol_id) });
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el usuario.';
            setError(msg); onError?.(msg);
        } finally { setGuardando(false); }
    };

    return (
        <Modal titulo="Nuevo usuario" onClose={onClose}>
            {error && <div className="scs-alert scs-alert-error">{error}</div>}
            <form onSubmit={enviar}>
                <div className="scs-form-row">
                    <FormInput label="Nombre" value={form.nombre} onChange={set('nombre')} />
                    <FormInput label="Apellido" value={form.apellido} onChange={set('apellido')} />
                </div>
                <FormInput label="Correo electrónico" type="email" value={form.email} onChange={set('email')} />
                <FormInput label="Contraseña" type="password" value={form.password} onChange={set('password')} />
                <FormInput label="Rol" as="select" value={form.rol_id} onChange={set('rol_id')}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </FormInput>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear usuario" />
            </form>
        </Modal>
    );
};

/* =============================== CURSOS ============================== */
const Cursos = ({ cursos, docentes, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
    const [sel, setSel] = useState({});
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');

    const asignarDocente = async (cursoId) => {
        const docenteId = sel[cursoId];
        if (!docenteId) return notificar('error', 'Seleccione un docente antes de asignar.');
        try {
            await api.post(`/api/cursos/${cursoId}/asignar-docente`, { docente_id: Number(docenteId) });
            notificar('ok', 'Docente asignado a la materia correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo asignar el docente.');
        }
    };

    const filtrados = cursos.filter((c) => {
        if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
        if (filtroNivel && c.nivel !== filtroNivel) return false;
        return true;
    });

    return (
        <div className="scs-card">
            <div className="scs-card-head">
                <h2 className="scs-card-title"><BookOpen size={18} /> Materias registradas</h2>
                <button className="scs-btn scs-btn-primary scs-btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nueva materia</button>
            </div>

            <Toolbar>
                <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar materia…" />
                <select className="scs-input" style={{ width: 'auto' }} value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                    <option value="">Todos los niveles</option>
                    {NIVELES_MATERIA.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ color: 'var(--scs-muted)', fontSize: 13 }}>{filtrados.length} materia(s)</span>
            </Toolbar>

            <Table
                columns={['Materia', 'Nivel', 'Evaluación', 'Docente', 'Asignar docente']}
                rows={filtrados}
                emptyText="No hay materias que coincidan."
                renderRow={(c) => (
                    <tr key={c.id}>
                        <td>{c.nombre}</td>
                        <td>{c.nivel || '—'}</td>
                        <td>
                            <span className={`scs-badge ${c.componente_evaluacion === 'PROYECTO' ? 'scs-badge-green' : 'scs-badge-gray'}`}>
                                {c.componente_evaluacion || 'PRUEBAS'}
                            </span>
                        </td>
                        <td>{c.docente_nombre || '—'}</td>
                        <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select className="scs-input" style={{ minWidth: 150, width: 'auto' }} value={sel[c.id] || ''} onChange={(e) => setSel({ ...sel, [c.id]: e.target.value })}>
                                    <option value="">Seleccione…</option>
                                    {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
                                </select>
                                <button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={() => asignarDocente(c.id)}><UserPlus size={15} /> Asignar</button>
                            </div>
                        </td>
                    </tr>
                )}
            />

            {modal && (
                <ModalNuevoCurso
                    onClose={() => setModal(false)}
                    onListo={() => { setModal(false); notificar('ok', 'Materia creada correctamente.'); recargar(); }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </div>
    );
};

const ModalNuevoCurso = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ nombre: '', nivel: '1°', componente_evaluacion: 'PRUEBAS', descripcion: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre.trim()) return setError('El nombre de la materia es obligatorio.');
        setGuardando(true);
        try {
            await api.post('/api/cursos', form);
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear la materia.';
            setError(msg); onError?.(msg);
        } finally { setGuardando(false); }
    };

    return (
        <Modal titulo="Nueva materia" onClose={onClose}>
            {error && <div className="scs-alert scs-alert-error">{error}</div>}
            <form onSubmit={enviar}>
                <FormInput label="Nombre de la materia" value={form.nombre} onChange={set('nombre')} />
                <div className="scs-form-row">
                    <FormInput label="Nivel / grado" as="select" value={form.nivel} onChange={set('nivel')}>
                        {NIVELES_MATERIA.map((n) => <option key={n} value={n}>{n}</option>)}
                    </FormInput>
                    <FormInput label="Componente de evaluación" as="select" value={form.componente_evaluacion} onChange={set('componente_evaluacion')}>
                        <option value="PRUEBAS">Pruebas</option>
                        <option value="PROYECTO">Proyecto</option>
                    </FormInput>
                </div>
                <FormInput label="Descripción" as="textarea" rows={2} value={form.descripcion} onChange={set('descripcion')} />
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear materia" />
            </form>
        </Modal>
    );
};

/* ============================ ESTUDIANTES =========================== */
const Estudiantes = ({ estudiantes, cursos, padres, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const [sel, setSel] = useState({});
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');

    const inscribir = async (estudianteId) => {
        const cursoId = sel[estudianteId];
        if (!cursoId) return notificar('error', 'Seleccione una materia antes de inscribir.');
        try {
            await api.post(`/api/estudiantes/${estudianteId}/asignar-curso`, { curso_id: Number(cursoId) });
            notificar('ok', 'Estudiante inscrito a la materia correctamente.');
            recargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo inscribir al estudiante.');
        }
    };

    // Materias que puede cursar un estudiante según su nivel (si no tiene nivel, todas).
    const materiasDeNivel = (nivel) => (nivel ? cursos.filter((c) => c.nivel === nivel) : cursos);

    const filtrados = estudiantes.filter((e) => {
        if (busqueda && !`${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
        if (filtroNivel && e.nivel !== filtroNivel) return false;
        return true;
    });

    return (
        <div className="scs-card">
            <div className="scs-card-head">
                <h2 className="scs-card-title"><GraduationCap size={18} /> Estudiantes de la institución</h2>
                <button className="scs-btn scs-btn-primary scs-btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo estudiante</button>
            </div>

            <Toolbar>
                <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre…" />
                <select className="scs-input" style={{ width: 'auto' }} value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                    <option value="">Todos los grados</option>
                    {NIVELES_ESTUDIANTE.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ color: 'var(--scs-muted)', fontSize: 13 }}>{filtrados.length} estudiante(s)</span>
            </Toolbar>

            <Table
                columns={['Nombre', 'Grado', 'Padre/Madre', 'Inscribir a materia', 'Detalle']}
                rows={filtrados}
                emptyText="No hay estudiantes que coincidan."
                renderRow={(e) => {
                    const materias = materiasDeNivel(e.nivel);
                    return (
                        <tr key={e.id}>
                            <td>{e.nombre} {e.apellido}</td>
                            <td>{e.nivel ? <span className="scs-badge scs-badge-gray">{e.nivel}</span> : '—'}</td>
                            <td>{e.padre_nombre || '—'}</td>
                            <td>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select className="scs-input" style={{ minWidth: 160, width: 'auto' }} value={sel[e.id] || ''} onChange={(ev) => setSel({ ...sel, [e.id]: ev.target.value })}>
                                        <option value="">{materias.length ? 'Seleccione…' : 'Sin materias en su grado'}</option>
                                        {materias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                    <button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={() => inscribir(e.id)}><UserPlus size={15} /> Inscribir</button>
                                </div>
                            </td>
                            <td><button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={() => setDetalle(e)}><Eye size={15} /> Ver</button></td>
                        </tr>
                    );
                }}
            />

            {modal && (
                <ModalNuevoEstudiante
                    padres={padres}
                    onClose={() => setModal(false)}
                    onListo={() => { setModal(false); notificar('ok', 'Estudiante creado correctamente.'); recargar(); }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
            {detalle && <EstudianteDetalle estudiante={detalle} cursos={cursos} onClose={() => setDetalle(null)} />}
        </div>
    );
};

const ModalNuevoEstudiante = ({ padres, onClose, onListo, onError }) => {
    const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', nivel: '1°', padre_id: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.nombre || !form.apellido) return setError('El nombre y el apellido son obligatorios.');
        setGuardando(true);
        try {
            await api.post('/api/estudiantes', { ...form, padre_id: form.padre_id ? Number(form.padre_id) : null });
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el estudiante.';
            setError(msg); onError?.(msg);
        } finally { setGuardando(false); }
    };

    return (
        <Modal titulo="Nuevo estudiante" onClose={onClose}>
            {error && <div className="scs-alert scs-alert-error">{error}</div>}
            <form onSubmit={enviar}>
                <div className="scs-form-row">
                    <FormInput label="Nombre" value={form.nombre} onChange={set('nombre')} />
                    <FormInput label="Apellido" value={form.apellido} onChange={set('apellido')} />
                </div>
                <div className="scs-form-row">
                    <FormInput label="Grado" as="select" value={form.nivel} onChange={set('nivel')}>
                        {NIVELES_ESTUDIANTE.map((n) => <option key={n} value={n}>{n}</option>)}
                    </FormInput>
                    <FormInput label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
                </div>
                <FormInput label="Padre/Madre asociado" as="select" value={form.padre_id} onChange={set('padre_id')}>
                    <option value="">Sin asignar</option>
                    {padres.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </FormInput>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear estudiante" />
            </form>
        </Modal>
    );
};

// Vista de detalle del estudiante (Bitácora 05).
const EstudianteDetalle = ({ estudiante, cursos, onClose }) => {
    const [notas, setNotas] = useState([]);
    const [asistencia, setAsistencia] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [n, a] = await Promise.all([
                    api.get(`/api/notas/${estudiante.id}`),
                    api.get(`/api/asistencia/${estudiante.id}`),
                ]);
                setNotas(n.data || []);
                setAsistencia(a.data || []);
            } catch { /* noop */ } finally { setCargando(false); }
        })();
    }, [estudiante]);

    const idsCursos = String(estudiante.cursos_ids || '').split(',').filter(Boolean);
    const cursosInscritos = cursos.filter((c) => idsCursos.includes(String(c.id)));
    const total = asistencia.length;
    const presentes = asistencia.filter((a) => a.presente).length;
    const pctAsist = total ? Math.round((presentes / total) * 100) : 0;

    return (
        <Modal titulo={`${estudiante.nombre} ${estudiante.apellido}`} onClose={onClose} maxWidth={620}>
            <div style={{ display: 'grid', gap: 6, marginBottom: 16, fontSize: 14 }}>
                <Linea k="Grado" v={estudiante.nivel || '—'} />
                <Linea k="Fecha de nacimiento" v={estudiante.fecha_nacimiento ? String(estudiante.fecha_nacimiento).slice(0, 10) : '—'} />
                <Linea k="Padre/Madre" v={estudiante.padre_nombre || '—'} />
                <Linea k="Teléfono" v={estudiante.telefono || '—'} />
                <Linea k="Correo" v={estudiante.email || '—'} />
                <Linea k="Asistencia general" v={total ? `${pctAsist}% (${presentes}/${total})` : 'Sin registros'} />
            </div>

            <h3 style={{ fontSize: 14, color: 'var(--scs-navy)', margin: '0 0 8px' }}>Materias inscritas</h3>
            {cursosInscritos.length === 0 ? (
                <p className="scs-empty" style={{ padding: 12 }}>No está inscrito en materias.</p>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {cursosInscritos.map((c) => <span key={c.id} className="scs-badge scs-badge-green">{c.nombre}</span>)}
                </div>
            )}

            <h3 style={{ fontSize: 14, color: 'var(--scs-navy)', margin: '0 0 8px' }}>Historial de notas</h3>
            {cargando ? (
                <p className="scs-empty" style={{ padding: 12 }}>Cargando…</p>
            ) : notas.length === 0 ? (
                <p className="scs-empty" style={{ padding: 12 }}>Sin notas registradas.</p>
            ) : (
                <div className="scs-table-wrap">
                    <table className="scs-table">
                        <thead><tr><th>Materia</th><th>Período</th><th>Nota</th></tr></thead>
                        <tbody>
                            {notas.map((n) => (
                                <tr key={n.id}>
                                    <td>{n.curso_nombre || `Materia ${n.curso_id}`}</td>
                                    <td>{n.periodo_nombre || n.periodo || '—'}</td>
                                    <td><span className={`scs-badge ${Number(n.nota) >= 70 ? 'scs-badge-green' : 'scs-badge-danger'}`}>{Number(n.nota).toFixed(0)}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};
const Linea = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: 'var(--scs-muted)' }}>{k}</span>
        <span style={{ fontWeight: 500 }}>{v}</span>
    </div>
);

/* =========================== COMUNICADOS ============================ */
const Comunicados = ({ comunicados, padres, recargar, notificar }) => {
    const [modal, setModal] = useState(false);
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

    const destinoTexto = (c) => {
        if (!c.destinatarios) return 'Todos los padres';
        const n = String(c.destinatarios).split(',').filter(Boolean).length;
        return `${n} padre(s) específico(s)`;
    };

    return (
        <div className="scs-card">
            <div className="scs-card-head">
                <h2 className="scs-card-title"><Bell size={18} /> Comunicados institucionales</h2>
                <button className="scs-btn scs-btn-primary scs-btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo comunicado</button>
            </div>
            {comunicados.length === 0 ? (
                <p className="scs-empty">No hay comunicados publicados.</p>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {comunicados.map((c) => (
                        <article key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: 16, border: '1px solid var(--scs-border)', borderLeft: '4px solid var(--scs-navy)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
                                {c.imagen && (
                                    <img src={c.imagen} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--scs-border)' }} />
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 5px', fontSize: 15, color: 'var(--scs-navy)' }}>{c.titulo}</h3>
                                    <p style={{ margin: '0 0 8px', color: 'var(--scs-muted)', fontSize: 14, lineHeight: 1.5 }}>{c.contenido}</p>
                                    <span className="scs-badge scs-badge-gray">Para: {destinoTexto(c)}</span>
                                </div>
                            </div>
                            <button className="scs-btn scs-btn-danger scs-btn-sm" onClick={() => eliminar(c.id)}><Trash2 size={15} /> Eliminar</button>
                        </article>
                    ))}
                </div>
            )}
            {modal && (
                <ModalNuevoComunicado
                    padres={padres}
                    onClose={() => setModal(false)}
                    onListo={() => { setModal(false); notificar('ok', 'Comunicado publicado correctamente.'); recargar(); }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </div>
    );
};

const ModalNuevoComunicado = ({ padres, onClose, onListo, onError }) => {
    const [form, setForm] = useState({ titulo: '', contenido: '', imagen: '' });
    const [modo, setModo] = useState('todos'); // 'todos' | 'especificos'
    const [seleccion, setSeleccion] = useState([]); // padre ids
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const onImagen = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return setError('El archivo debe ser una imagen.');
        if (file.size > 2 * 1024 * 1024) return setError('La imagen no debe superar 2 MB.');
        setError('');
        const reader = new FileReader();
        reader.onload = () => setForm((f) => ({ ...f, imagen: reader.result }));
        reader.readAsDataURL(file);
    };

    const togglePadre = (id) =>
        setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.titulo.trim() || !form.contenido.trim()) return setError('El título y el contenido son obligatorios.');
        if (modo === 'especificos' && seleccion.length === 0) return setError('Seleccione al menos un padre o elija "Todos".');
        setGuardando(true);
        try {
            await api.post('/api/comunicados', {
                ...form,
                destinatarios: modo === 'especificos' ? seleccion : [],
            });
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo publicar el comunicado.';
            setError(msg); onError?.(msg);
        } finally { setGuardando(false); }
    };

    return (
        <Modal titulo="Nuevo comunicado" onClose={onClose}>
            {error && <div className="scs-alert scs-alert-error">{error}</div>}
            <form onSubmit={enviar}>
                <FormInput label="Título" value={form.titulo} onChange={set('titulo')} />
                <FormInput label="Contenido" as="textarea" rows={4} value={form.contenido} onChange={set('contenido')} />

                {/* Imagen opcional */}
                <div className="scs-field">
                    <span className="scs-label">Imagen (opcional)</span>
                    {form.imagen ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={form.imagen} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--scs-border)' }} />
                            <button type="button" className="scs-btn scs-btn-danger scs-btn-sm" onClick={() => setForm((f) => ({ ...f, imagen: '' }))}>
                                <Trash2 size={14} /> Quitar
                            </button>
                        </div>
                    ) : (
                        <input type="file" accept="image/*" onChange={onImagen} style={{ fontSize: 13 }} />
                    )}
                </div>

                {/* Destinatarios */}
                <div className="scs-field">
                    <span className="scs-label">Destinatarios</span>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                            <input type="radio" name="modo" checked={modo === 'todos'} onChange={() => setModo('todos')} /> Todos los padres
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                            <input type="radio" name="modo" checked={modo === 'especificos'} onChange={() => setModo('especificos')} /> Padres específicos
                        </label>
                    </div>
                    {modo === 'especificos' && (
                        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--scs-border)', borderRadius: 8, padding: 10, display: 'grid', gap: 6 }}>
                            {padres.length === 0 ? (
                                <span style={{ color: 'var(--scs-muted)', fontSize: 13 }}>No hay padres registrados.</span>
                            ) : (
                                padres.map((p) => (
                                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={seleccion.includes(p.id)} onChange={() => togglePadre(p.id)} />
                                        {p.nombre} {p.apellido}
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <AccionesModal onClose={onClose} guardando={guardando} texto="Publicar" />
            </form>
        </Modal>
    );
};

/* ============================== REPORTES ============================ */
// Reportes generales + exportación a PDF (jsPDF) y Excel (SheetJS) — Bitácora 08.
const Reportes = ({ notificar }) => {
    const [data, setData] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/api/reportes');
                setData(data);
            } catch {
                notificar('error', 'No se pudieron generar los reportes.');
            } finally { setCargando(false); }
        })();
    }, []);

    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('Sojourn Christian School — Reportes', 14, 16);
        autoTable(doc, { startY: 22, head: [['Materia', 'Nivel', 'Asistencia %', 'Registros']], body: data.asistenciaPorCurso.map((r) => [r.nombre, r.nivel ?? '—', r.porcentaje ?? '—', r.total_registros]) });
        autoTable(doc, { head: [['Materia', 'Nivel', 'Promedio', 'Notas']], body: data.rendimientoPorCurso.map((r) => [r.nombre, r.nivel ?? '—', r.promedio ?? '—', r.cantidad_notas]) });
        autoTable(doc, { head: [['Estudiante', 'Grado', 'Promedio (<70)']], body: data.bajoRendimiento.map((r) => [`${r.nombre} ${r.apellido}`, r.nivel ?? '—', r.promedio]) });
        doc.save('reportes-sojourn.pdf');
    };

    const exportarExcel = () => {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.asistenciaPorCurso), 'Asistencia');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.rendimientoPorCurso), 'Rendimiento');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.bajoRendimiento), 'Bajo rendimiento');
        XLSX.writeFile(wb, 'reportes-sojourn.xlsx');
    };

    if (cargando) return <p className="scs-empty">Generando reportes…</p>;
    if (!data) return <p className="scs-empty">No hay datos para reportar.</p>;

    return (
        <>
            <Toolbar>
                <button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={exportarPDF}><FileDown size={15} /> Exportar PDF</button>
                <button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={exportarExcel}><FileSpreadsheet size={15} /> Exportar Excel</button>
            </Toolbar>

            <div className="scs-card">
                <div className="scs-card-head"><h2 className="scs-card-title"><CalendarRange size={18} /> Asistencia por materia</h2></div>
                {data.asistenciaPorCurso.length === 0 ? (
                    <p className="scs-empty">Aún no hay asistencia registrada.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Materia</th><th>Nivel</th><th>Asistencia</th><th>Tardías</th><th>Justificadas</th><th>Registros</th></tr></thead>
                            <tbody>
                                {data.asistenciaPorCurso.map((r) => (
                                    <tr key={r.id}><td>{r.nombre}</td><td>{r.nivel || '—'}</td><td>{r.porcentaje != null ? `${r.porcentaje}%` : '—'}</td><td>{r.tardias ?? 0}</td><td>{r.justificadas ?? 0}</td><td>{r.total_registros}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="scs-card">
                <div className="scs-card-head"><h2 className="scs-card-title"><BarChart3 size={18} /> Rendimiento por materia</h2></div>
                {data.rendimientoPorCurso.length === 0 ? (
                    <p className="scs-empty">Aún no hay notas registradas.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Materia</th><th>Nivel</th><th>Promedio</th><th>Notas</th></tr></thead>
                            <tbody>
                                {data.rendimientoPorCurso.map((r) => (
                                    <tr key={r.id}><td>{r.nombre}</td><td>{r.nivel || '—'}</td><td>{r.promedio != null ? <span className={`scs-badge ${r.promedio >= 70 ? 'scs-badge-green' : 'scs-badge-danger'}`}>{r.promedio}</span> : '—'}</td><td>{r.cantidad_notas}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="scs-card">
                <div className="scs-card-head"><h2 className="scs-card-title"><GraduationCap size={18} /> Estudiantes con bajo rendimiento (&lt; 70)</h2></div>
                {data.bajoRendimiento.length === 0 ? (
                    <p className="scs-empty">Ningún estudiante con promedio menor a 70.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Estudiante</th><th>Grado</th><th>Promedio</th></tr></thead>
                            <tbody>
                                {data.bajoRendimiento.map((r) => (
                                    <tr key={r.id}><td>{r.nombre} {r.apellido}</td><td>{r.nivel || '—'}</td><td><span className="scs-badge scs-badge-danger">{r.promedio}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

/* ============================== PERÍODOS ============================ */
const Periodos = ({ notificar }) => {
    const [periodos, setPeriodos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);

    const cargar = async () => {
        setCargando(true);
        try {
            const { data } = await api.get('/api/periodos');
            setPeriodos(data || []);
        } catch {
            notificar('error', 'No se pudieron cargar los períodos.');
        } finally { setCargando(false); }
    };
    useEffect(() => { cargar(); }, []);

    const cambiarEstado = async (p) => {
        const estado = p.estado === 'cerrado' ? 'activo' : 'cerrado';
        try {
            await api.put(`/api/periodos/${p.id}`, { estado });
            notificar('ok', `Período ${estado === 'cerrado' ? 'cerrado' : 'activado'}.`);
            cargar();
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo actualizar el período.');
        }
    };

    return (
        <div className="scs-card">
            <div className="scs-card-head">
                <h2 className="scs-card-title"><CalendarRange size={18} /> Períodos académicos</h2>
                <button className="scs-btn scs-btn-primary scs-btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo período</button>
            </div>
            {cargando ? (
                <p className="scs-empty">Cargando…</p>
            ) : (
                <Table
                    columns={['Código', 'Nombre', 'Inicio', 'Fin', 'Estado', 'Acción']}
                    rows={periodos}
                    emptyText="No hay períodos registrados."
                    renderRow={(p) => (
                        <tr key={p.id}>
                            <td>{p.codigo}</td>
                            <td>{p.nombre}</td>
                            <td>{p.fecha_inicio ? String(p.fecha_inicio).slice(0, 10) : '—'}</td>
                            <td>{p.fecha_fin ? String(p.fecha_fin).slice(0, 10) : '—'}</td>
                            <td><span className={`scs-badge ${p.estado === 'cerrado' ? 'scs-badge-gray' : 'scs-badge-green'}`}>{p.estado}</span></td>
                            <td><button className="scs-btn scs-btn-secondary scs-btn-sm" onClick={() => cambiarEstado(p)}>{p.estado === 'cerrado' ? 'Activar' : 'Cerrar'}</button></td>
                        </tr>
                    )}
                />
            )}
            {modal && (
                <ModalNuevoPeriodo
                    onClose={() => setModal(false)}
                    onListo={() => { setModal(false); notificar('ok', 'Período creado correctamente.'); cargar(); }}
                    onError={(msg) => notificar('error', msg)}
                />
            )}
        </div>
    );
};

const ModalNuevoPeriodo = ({ onClose, onListo, onError }) => {
    const [form, setForm] = useState({ codigo: '', nombre: '', fecha_inicio: '', fecha_fin: '' });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const enviar = async (ev) => {
        ev.preventDefault();
        setError('');
        if (!form.codigo.trim() || !form.nombre.trim()) return setError('El código y el nombre son obligatorios.');
        setGuardando(true);
        try {
            await api.post('/api/periodos', form);
            onListo();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo crear el período.';
            setError(msg); onError?.(msg);
        } finally { setGuardando(false); }
    };
    return (
        <Modal titulo="Nuevo período" onClose={onClose}>
            {error && <div className="scs-alert scs-alert-error">{error}</div>}
            <form onSubmit={enviar}>
                <div className="scs-form-row">
                    <FormInput label="Código (I, II, III)" value={form.codigo} onChange={set('codigo')} />
                    <FormInput label="Nombre" value={form.nombre} onChange={set('nombre')} />
                </div>
                <div className="scs-form-row">
                    <FormInput label="Fecha de inicio" type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
                    <FormInput label="Fecha de fin" type="date" value={form.fecha_fin} onChange={set('fecha_fin')} />
                </div>
                <AccionesModal onClose={onClose} guardando={guardando} texto="Crear período" />
            </form>
        </Modal>
    );
};

/* ============================ AUXILIARES ============================ */
const AccionesModal = ({ onClose, guardando, texto }) => (
    <div className="scs-modal-actions">
        <button type="button" className="scs-btn scs-btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="scs-btn scs-btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : texto}</button>
    </div>
);

export default AdminDashboard;
