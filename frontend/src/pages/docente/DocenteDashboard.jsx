import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    CalendarCheck,
    Bell,
    GraduationCap,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    UserCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import ProfilePanel from '../../components/ProfilePanel';

// Panel del Docente — Sojourn Christian School.
// Materias asignadas, estudiantes por curso con indicadores, ingreso de notas por
// período, registro de asistencia, comunicados y perfil.

const NAV = [
    { key: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { key: 'cursos', label: 'Mis Materias', icon: BookOpen },
    { key: 'notas', label: 'Notas', icon: ClipboardList },
    { key: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
    { key: 'comunicados', label: 'Comunicados', icon: Bell },
    { key: 'perfil', label: 'Perfil', icon: UserCircle },
];

const iniciales = (nombre, apellido) =>
    `${(nombre || '?').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();

const DocenteDashboard = () => {
    const { user } = useAuth();
    const [seccion, setSeccion] = useState('inicio');
    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [comunicados, setComunicados] = useState([]);
    const [periodos, setPeriodos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [aviso, setAviso] = useState(null);

    const notificar = (tipo, msg) => {
        setAviso({ tipo, msg });
        window.clearTimeout(notificar._t);
        notificar._t = window.setTimeout(() => setAviso(null), 4000);
    };

    useEffect(() => {
        (async () => {
            setCargando(true);
            try {
                const [c, e, com, per] = await Promise.all([
                    api.get('/api/cursos'),
                    api.get('/api/estudiantes'),
                    api.get('/api/comunicados'),
                    api.get('/api/periodos'),
                ]);
                setCursos(c.data || []);
                setEstudiantes(e.data || []);
                setComunicados(com.data || []);
                setPeriodos(per.data || []);
            } catch {
                notificar('error', 'No se pudieron cargar los datos del sistema.');
            } finally {
                setCargando(false);
            }
        })();
    }, []);

    const irA = (key) => {
        setAviso(null);
        setSeccion(key);
    };

    const perteneceADocente = (c) => {
        const uid = String(user?.id);
        if (String(c.docente_id) === uid) return true;
        return String(c.docente_ids || '').split(',').includes(uid);
    };
    const misCursos = useMemo(() => cursos.filter(perteneceADocente), [cursos, user]);

    const hayRelacionCurso = useMemo(
        () => estudiantes.some((e) => e.cursos_ids != null || e.curso_id != null || Array.isArray(e.cursos)),
        [estudiantes]
    );

    const idsDeCurso = (e) => {
        if (e.cursos_ids != null) return String(e.cursos_ids).split(',').filter(Boolean);
        if (Array.isArray(e.cursos_ids)) return e.cursos_ids.map(String);
        if (e.curso_id != null) return [String(e.curso_id)];
        if (Array.isArray(e.cursos)) return e.cursos.map((c) => String(c.id ?? c));
        return [];
    };

    const estudiantesDeCurso = (cursoId) => {
        if (!cursoId) return [];
        if (!hayRelacionCurso) return estudiantes;
        const id = String(cursoId);
        return estudiantes.filter((e) => idsDeCurso(e).includes(id));
    };

    const titulo = NAV.find((n) => n.key === seccion)?.label || '';

    return (
        <DashboardShell title={titulo} nav={NAV} active={seccion} onNavigate={irA}>
            {aviso && (
                <div className={`scs-alert ${aviso.tipo === 'error' ? 'scs-alert-error' : 'scs-alert-ok'}`}>
                    {aviso.msg}
                </div>
            )}

            {cargando ? (
                <p className="scs-empty">Cargando información…</p>
            ) : (
                <>
                    {seccion === 'inicio' && <Inicio user={user} misCursos={misCursos} estudiantesDeCurso={estudiantesDeCurso} />}
                    {seccion === 'cursos' && <MisCursos misCursos={misCursos} estudiantesDeCurso={estudiantesDeCurso} notificar={notificar} />}
                    {seccion === 'notas' && <Notas misCursos={misCursos} estudiantesDeCurso={estudiantesDeCurso} periodos={periodos} notificar={notificar} />}
                    {seccion === 'asistencia' && <Asistencia misCursos={misCursos} estudiantesDeCurso={estudiantesDeCurso} notificar={notificar} />}
                    {seccion === 'comunicados' && <Comunicados comunicados={comunicados} />}
                    {seccion === 'perfil' && <ProfilePanel />}
                </>
            )}
        </DashboardShell>
    );
};

/* =============================== INICIO ============================== */
const Inicio = ({ user, misCursos, estudiantesDeCurso }) => {
    const totalEstudiantes = useMemo(() => {
        const ids = new Set();
        misCursos.forEach((c) => estudiantesDeCurso(c.id).forEach((e) => ids.add(e.id)));
        return ids.size;
    }, [misCursos, estudiantesDeCurso]);

    return (
        <>
            <div className="scs-welcome">
                <h2>Bienvenido, {user?.nombre || 'docente'}</h2>
                <p>Gestione las notas y la asistencia de sus materias asignadas.</p>
            </div>
            <div className="scs-stats-grid">
                <div className="scs-stat-card">
                    <div className="scs-stat-head"><span className="scs-stat-label">Materias asignadas</span><span className="scs-stat-icon"><BookOpen size={20} /></span></div>
                    <span className="scs-stat-value">{misCursos.length}</span>
                </div>
                <div className="scs-stat-card">
                    <div className="scs-stat-head"><span className="scs-stat-label">Estudiantes</span><span className="scs-stat-icon"><GraduationCap size={20} /></span></div>
                    <span className="scs-stat-value">{totalEstudiantes}</span>
                </div>
            </div>
            <div className="scs-card">
                <div className="scs-card-head"><h2 className="scs-card-title"><BookOpen size={18} /> Resumen de mis materias</h2></div>
                {misCursos.length === 0 ? (
                    <p className="scs-empty">Aún no tiene materias asignadas.</p>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {misCursos.map((c) => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: '1px solid var(--scs-border)', borderRadius: 8, background: 'var(--scs-bg)' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                                    <div style={{ fontSize: 13, color: 'var(--scs-muted)' }}>{c.descripcion || 'Sin descripción'}</div>
                                </div>
                                <span className="scs-badge scs-badge-green">{estudiantesDeCurso(c.id).length} estudiantes</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

/* ============================= MIS CURSOS ============================ */
// Estudiantes por curso con avatar de iniciales, % de asistencia y promedio,
// más alerta roja cuando las ausencias superan el 20% (Bitácora 06).
const MisCursos = ({ misCursos, estudiantesDeCurso, notificar }) => {
    const [cursoSel, setCursoSel] = useState(null);
    const [stats, setStats] = useState({}); // { [estId]: { promedio, asistencia, ausenciaPct } }
    const [cargandoStats, setCargandoStats] = useState(false);

    const inscritos = cursoSel ? estudiantesDeCurso(cursoSel.id) : [];

    useEffect(() => {
        if (!cursoSel || inscritos.length === 0) {
            setStats({});
            return;
        }
        let cancelado = false;
        (async () => {
            setCargandoStats(true);
            try {
                const resultados = await Promise.all(
                    inscritos.map(async (e) => {
                        const [n, a] = await Promise.all([
                            api.get(`/api/notas/${e.id}`),
                            api.get(`/api/asistencia/${e.id}`),
                        ]);
                        const notasCurso = (n.data || []).filter((x) => Number(x.curso_id) === Number(cursoSel.id));
                        const asisCurso = (a.data || []).filter((x) => Number(x.curso_id) === Number(cursoSel.id));
                        const valores = notasCurso.map((x) => Number(x.nota)).filter((v) => !Number.isNaN(v));
                        const promedio = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
                        const total = asisCurso.length;
                        const presentes = asisCurso.filter((x) => x.presente).length;
                        const asistencia = total ? Math.round((presentes / total) * 100) : null;
                        const ausenciaPct = total ? Math.round(((total - presentes) / total) * 100) : 0;
                        return [e.id, { promedio, asistencia, ausenciaPct }];
                    })
                );
                if (!cancelado) setStats(Object.fromEntries(resultados));
            } catch {
                if (!cancelado) notificar('error', 'No se pudieron cargar los indicadores de los estudiantes.');
            } finally {
                if (!cancelado) setCargandoStats(false);
            }
        })();
        return () => {
            cancelado = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursoSel]);

    if (misCursos.length === 0) {
        return <div className="scs-card"><p className="scs-empty">Aún no tiene materias asignadas.</p></div>;
    }

    return (
        <div className="scs-two-col">
            <div className="scs-card">
                <div className="scs-card-head"><h2 className="scs-card-title"><BookOpen size={18} /> Materias asignadas</h2></div>
                <div style={{ display: 'grid', gap: 8 }}>
                    {misCursos.map((c) => {
                        const activo = cursoSel?.id === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => setCursoSel(c)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, border: `1px solid ${activo ? 'var(--scs-green)' : 'var(--scs-border)'}`, background: activo ? 'var(--scs-bg)' : 'var(--scs-white)', color: activo ? 'var(--scs-green)' : 'var(--scs-text)', fontFamily: 'inherit', fontSize: 14.5, fontWeight: activo ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                            >
                                <span>{c.nombre}</span>
                                <ChevronRight size={18} />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="scs-card">
                <div className="scs-card-head">
                    <h2 className="scs-card-title"><GraduationCap size={18} /> {cursoSel ? `Estudiantes — ${cursoSel.nombre}` : 'Estudiantes inscritos'}</h2>
                </div>
                {!cursoSel ? (
                    <p className="scs-empty">Seleccione una materia para ver sus estudiantes.</p>
                ) : inscritos.length === 0 ? (
                    <p className="scs-empty">Esta materia no tiene estudiantes inscritos.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead>
                                <tr><th>Estudiante</th><th>Asistencia</th><th>Promedio</th><th>Estado</th></tr>
                            </thead>
                            <tbody>
                                {inscritos.map((e) => {
                                    const s = stats[e.id] || {};
                                    const alerta = (s.ausenciaPct ?? 0) > 20;
                                    return (
                                        <tr key={e.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--scs-gray)', color: 'var(--scs-green)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                                        {iniciales(e.nombre, e.apellido)}
                                                    </span>
                                                    {e.nombre} {e.apellido}
                                                </div>
                                            </td>
                                            <td>{cargandoStats ? '…' : s.asistencia != null ? `${s.asistencia}%` : '—'}</td>
                                            <td>{cargandoStats ? '…' : s.promedio != null ? Number(s.promedio).toFixed(1) : '—'}</td>
                                            <td>
                                                {alerta ? (
                                                    <span className="scs-badge scs-badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                        <AlertTriangle size={13} /> Ausencias {s.ausenciaPct}%
                                                    </span>
                                                ) : (
                                                    <span className="scs-badge scs-badge-green">Al día</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

/* =============================== NOTAS ============================== */
const Notas = ({ misCursos, estudiantesDeCurso, periodos, notificar }) => {
    const [cursoId, setCursoId] = useState('');
    const [periodoId, setPeriodoId] = useState('');
    const [filas, setFilas] = useState({});
    const [guardando, setGuardando] = useState(false);

    const periodosActivos = periodos.filter((p) => p.estado !== 'cerrado');
    const inscritos = cursoId ? estudiantesDeCurso(cursoId) : [];

    useEffect(() => {
        if (!periodoId && periodosActivos.length > 0) setPeriodoId(String(periodosActivos[0].id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodos]);

    const cambiarCurso = (id) => {
        setCursoId(id);
        setFilas({});
    };
    const setNota = (estId, valor) => setFilas((f) => ({ ...f, [estId]: valor }));

    const guardar = async () => {
        if (!cursoId) return notificar('error', 'Seleccione una materia.');
        if (!periodoId) return notificar('error', 'Seleccione un período.');
        const periodo = periodos.find((p) => String(p.id) === String(periodoId));
        const pendientes = inscritos
            .map((e) => ({ est: e, nota: filas[e.id] }))
            .filter(({ nota }) => nota !== '' && nota != null);

        if (pendientes.length === 0) return notificar('error', 'Ingrese al menos una nota.');
        for (const { nota } of pendientes) {
            const n = Number(nota);
            if (Number.isNaN(n) || n < 0 || n > 100) return notificar('error', 'Las notas deben estar entre 0 y 100.');
        }

        setGuardando(true);
        try {
            await Promise.all(
                pendientes.map(({ est, nota }) =>
                    api.post('/api/notas', {
                        estudiante_id: est.id,
                        curso_id: Number(cursoId),
                        nota: Number(nota),
                        periodo: periodo?.codigo || null,
                        periodo_id: Number(periodoId),
                    })
                )
            );
            notificar('ok', `${pendientes.length} nota(s) guardada(s) correctamente.`);
            setFilas({});
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudieron guardar las notas.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="scs-card">
            <div className="scs-card-head"><h2 className="scs-card-title"><ClipboardList size={18} /> Ingreso de notas</h2></div>

            <div className="scs-form-row" style={{ maxWidth: 520 }}>
                <label className="scs-field">
                    <span className="scs-label">Materia</span>
                    <select className="scs-input" value={cursoId} onChange={(e) => cambiarCurso(e.target.value)}>
                        <option value="">Seleccione una materia…</option>
                        {misCursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </label>
                <label className="scs-field">
                    <span className="scs-label">Período</span>
                    <select className="scs-input" value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
                        {periodosActivos.length === 0 && <option value="">Sin períodos</option>}
                        {periodosActivos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </label>
            </div>

            {!cursoId ? (
                <p className="scs-empty">Seleccione una materia para ingresar notas.</p>
            ) : inscritos.length === 0 ? (
                <p className="scs-empty">Esta materia no tiene estudiantes inscritos.</p>
            ) : (
                <>
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Estudiante</th><th>Nota (0–100)</th></tr></thead>
                            <tbody>
                                {inscritos.map((e) => (
                                    <tr key={e.id}>
                                        <td>{e.nombre} {e.apellido}</td>
                                        <td>
                                            <input className="scs-input" style={{ maxWidth: 120, width: 'auto' }} type="number" min="0" max="100" placeholder="—" value={filas[e.id] ?? ''} onChange={(ev) => setNota(e.id, ev.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: 18 }}>
                        <button className="scs-btn scs-btn-primary" onClick={guardar} disabled={guardando}>
                            {guardando ? 'Guardando…' : 'Guardar notas'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ============================= ASISTENCIA =========================== */
// Estados de asistencia (Bitácora 06). Se marca por materia + fecha; al elegir
// una sesión ya registrada, se cargan las marcas existentes para poder editarlas.
const ESTADOS_ASIS = [
    { v: 'presente', label: 'Presente' },
    { v: 'ausente', label: 'Ausente' },
    { v: 'tardia', label: 'Tardía' },
    { v: 'justificada', label: 'Justificada' },
];
const colorEstado = (v) =>
    v === 'presente' ? { bg: 'var(--scs-ok-bg)', fg: 'var(--scs-green)' }
    : v === 'tardia' ? { bg: '#fff4d6', fg: '#8a6d00' }
    : v === 'justificada' ? { bg: '#e6efff', fg: 'var(--scs-navy)' }
    : { bg: 'var(--scs-danger-bg)', fg: 'var(--scs-danger)' };

const Asistencia = ({ misCursos, estudiantesDeCurso, notificar }) => {
    const [cursoId, setCursoId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [marcas, setMarcas] = useState({}); // { [estId]: estado }
    const [guardando, setGuardando] = useState(false);
    const [cargandoSesion, setCargandoSesion] = useState(false);

    const inscritos = cursoId ? estudiantesDeCurso(cursoId) : [];
    const estadoDe = (id) => marcas[id] || 'presente';
    const setEstado = (id, v) => setMarcas((m) => ({ ...m, [id]: v }));

    // Al cambiar materia o fecha, cargar lo ya registrado para esa sesión.
    useEffect(() => {
        if (!cursoId || !fecha) {
            setMarcas({});
            return;
        }
        let cancelado = false;
        (async () => {
            setCargandoSesion(true);
            try {
                const { data } = await api.get(`/api/asistencia/curso/${cursoId}/${fecha}`);
                if (cancelado) return;
                const previas = {};
                (data || []).forEach((r) => { previas[r.estudiante_id] = r.estado || (r.presente ? 'presente' : 'ausente'); });
                setMarcas(previas);
            } catch {
                if (!cancelado) setMarcas({});
            } finally {
                if (!cancelado) setCargandoSesion(false);
            }
        })();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursoId, fecha]);

    const guardar = async () => {
        if (!cursoId) return notificar('error', 'Seleccione una materia.');
        if (inscritos.length === 0) return notificar('error', 'Esta materia no tiene estudiantes inscritos.');
        setGuardando(true);
        try {
            await Promise.all(
                inscritos.map((e) =>
                    api.post('/api/asistencia', { estudiante_id: e.id, curso_id: Number(cursoId), fecha, estado: estadoDe(e.id) })
                )
            );
            notificar('ok', 'Asistencia registrada correctamente.');
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudo registrar la asistencia.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="scs-card">
            <div className="scs-card-head"><h2 className="scs-card-title"><CalendarCheck size={18} /> Registro de asistencia</h2></div>
            <div className="scs-form-row" style={{ maxWidth: 520 }}>
                <label className="scs-field">
                    <span className="scs-label">Materia</span>
                    <select className="scs-input" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                        <option value="">Seleccione una materia…</option>
                        {misCursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </label>
                <label className="scs-field">
                    <span className="scs-label">Fecha</span>
                    <input className="scs-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
            </div>

            {!cursoId ? (
                <p className="scs-empty">Seleccione una materia para registrar la asistencia.</p>
            ) : inscritos.length === 0 ? (
                <p className="scs-empty">Esta materia no tiene estudiantes inscritos.</p>
            ) : (
                <>
                    {cargandoSesion && <p className="scs-empty">Cargando registros de la sesión…</p>}
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Estudiante</th><th>Asistencia</th></tr></thead>
                            <tbody>
                                {inscritos.map((e) => {
                                    const v = estadoDe(e.id);
                                    const col = colorEstado(v);
                                    return (
                                        <tr key={e.id}>
                                            <td>{e.nombre} {e.apellido}</td>
                                            <td>
                                                <select
                                                    className="scs-input"
                                                    value={v}
                                                    onChange={(ev) => setEstado(e.id, ev.target.value)}
                                                    style={{ maxWidth: 170, width: 'auto', fontWeight: 600, background: col.bg, color: col.fg }}
                                                >
                                                    {ESTADOS_ASIS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: 18 }}>
                        <button className="scs-btn scs-btn-primary" onClick={guardar} disabled={guardando}>
                            {guardando ? 'Guardando…' : 'Guardar registro'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ============================ COMUNICADOS =========================== */
const Comunicados = ({ comunicados }) => (
    <div className="scs-card">
        <div className="scs-card-head"><h2 className="scs-card-title"><Bell size={18} /> Comunicados institucionales</h2></div>
        {comunicados.length === 0 ? (
            <p className="scs-empty">No hay comunicados publicados.</p>
        ) : (
            <div style={{ display: 'grid', gap: 12 }}>
                {comunicados.map((c) => {
                    const fecha = c.fecha || c.fecha_publicacion;
                    return (
                        <article key={c.id} style={{ padding: 16, border: '1px solid var(--scs-border)', borderLeft: '4px solid var(--scs-navy)', borderRadius: 8 }}>
                            <h3 style={{ margin: '0 0 5px', fontSize: 15, color: 'var(--scs-navy)' }}>{c.titulo}</h3>
                            <p style={{ margin: 0, color: 'var(--scs-muted)', fontSize: 14, lineHeight: 1.5 }}>{c.contenido}</p>
                            {c.imagen && <img src={c.imagen} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--scs-border)', marginTop: 8 }} />}
                            {fecha && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: 'var(--scs-muted)' }}>{String(fecha).slice(0, 10)}</span>}
                        </article>
                    );
                })}
            </div>
        )}
    </div>
);

export default DocenteDashboard;
