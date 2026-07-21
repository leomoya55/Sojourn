import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    CalendarCheck,
    Bell,
    Award,
    BookOpen,
    UserCircle,
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import ProfilePanel from '../../components/ProfilePanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Portal del Padre de Familia — Sojourn Christian School.
// Consulta (solo lectura) del rendimiento del hijo: resumen, calificaciones por
// curso y período, asistencia con gráficos, comunicados y perfil.

const PERIODOS = ['I', 'II', 'III'];
const VERDE = '#2D5016';
const VERDE_MID = '#3D6B20';
const NAVY = '#1B2A4A';
const DANGER = '#b3261e';

const NAV = [
    { key: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { key: 'notas', label: 'Notas', icon: ClipboardList },
    { key: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
    { key: 'comunicados', label: 'Comunicados', icon: Bell },
    { key: 'perfil', label: 'Perfil', icon: UserCircle },
];

const nombreCurso = (n) =>
    n.curso_nombre || n.curso || (n.curso_id != null ? `Materia ${n.curso_id}` : 'Materia');
const fmt = (n, dec = 1) => (n == null ? '—' : Number(n).toFixed(dec));
const claseNota = (n) =>
    n == null ? 'scs-badge-gray' : Number(n) >= 70 ? 'scs-badge-green' : 'scs-badge-danger';

const PadreDashboard = () => {
    const { user } = useAuth();
    const [seccion, setSeccion] = useState('inicio');
    const [hijos, setHijos] = useState([]);
    const [hijoId, setHijoId] = useState('');
    const [notas, setNotas] = useState([]);
    const [asistencia, setAsistencia] = useState([]);
    const [comunicados, setComunicados] = useState([]);
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
                const [e, com] = await Promise.all([
                    api.get('/api/estudiantes'),
                    api.get('/api/comunicados'),
                ]);
                const lista = e.data || [];
                const propios = lista.some((est) => est.padre_id != null)
                    ? lista.filter((est) => Number(est.padre_id) === Number(user?.id))
                    : lista;
                setHijos(propios);
                setComunicados(com.data || []);
                if (propios.length > 0) setHijoId(String(propios[0].id));
            } catch {
                notificar('error', 'No se pudo cargar la información.');
            } finally {
                setCargando(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hijoId) return;
        (async () => {
            try {
                const [n, a] = await Promise.all([
                    api.get(`/api/notas/${hijoId}`),
                    api.get(`/api/asistencia/${hijoId}`),
                ]);
                setNotas(n.data || []);
                setAsistencia(a.data || []);
            } catch {
                notificar('error', 'No se pudieron cargar notas y asistencia.');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hijoId]);

    const irA = (key) => {
        setAviso(null);
        setSeccion(key);
    };

    const hijo = hijos.find((h) => String(h.id) === String(hijoId));

    const cursosNotas = useMemo(() => {
        const mapa = {};
        notas.forEach((n) => {
            const key = n.curso_id ?? nombreCurso(n);
            if (!mapa[key]) mapa[key] = { nombre: nombreCurso(n), periodos: {} };
            if (n.periodo != null) mapa[key].periodos[n.periodo] = Number(n.nota);
            else mapa[key].periodos['—'] = Number(n.nota);
        });
        return Object.values(mapa).map((c) => {
            const valores = Object.values(c.periodos).filter((v) => !Number.isNaN(v));
            const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
            return { ...c, promedio };
        });
    }, [notas]);

    const promedioGeneral = useMemo(() => {
        const valores = notas.map((n) => Number(n.nota)).filter((v) => !Number.isNaN(v));
        if (valores.length === 0) return null;
        return valores.reduce((a, b) => a + b, 0) / valores.length;
    }, [notas]);

    const totalAsist = asistencia.length;
    const presentes = asistencia.filter((a) => a.presente).length;
    const porcentajeAsist = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 0;

    const comunicadosNuevos = useMemo(() => {
        const hace7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const conFecha = comunicados.filter((c) => c.fecha || c.fecha_publicacion);
        if (conFecha.length === 0) return comunicados.length;
        return conFecha.filter((c) => new Date(c.fecha || c.fecha_publicacion).getTime() >= hace7).length;
    }, [comunicados]);

    const comunicadosOrdenados = useMemo(
        () =>
            [...comunicados].sort((a, b) => {
                const fa = a.fecha || a.fecha_publicacion;
                const fb = b.fecha || b.fecha_publicacion;
                if (fa && fb) return new Date(fb) - new Date(fa);
                return (b.id || 0) - (a.id || 0);
            }),
        [comunicados]
    );

    const titulo = NAV.find((n) => n.key === seccion)?.label || '';

    return (
        <DashboardShell title={titulo} nav={NAV} active={seccion} onNavigate={irA}>
            {aviso && (
                <div className={`scs-alert ${aviso.tipo === 'error' ? 'scs-alert-error' : 'scs-alert-ok'}`}>
                    {aviso.msg}
                </div>
            )}

            {hijos.length > 1 && seccion !== 'perfil' && seccion !== 'comunicados' && (
                <label className="scs-field" style={{ maxWidth: 300 }}>
                    <span className="scs-label">Estudiante</span>
                    <select className="scs-input" value={hijoId} onChange={(e) => setHijoId(e.target.value)}>
                        {hijos.map((h) => (
                            <option key={h.id} value={h.id}>{h.nombre} {h.apellido}</option>
                        ))}
                    </select>
                </label>
            )}

            {cargando ? (
                <p className="scs-empty">Cargando información…</p>
            ) : seccion === 'perfil' ? (
                <ProfilePanel />
            ) : hijos.length === 0 ? (
                <div className="scs-card">
                    <p className="scs-empty">No hay estudiantes asociados a su cuenta. Comuníquese con la administración.</p>
                </div>
            ) : (
                <>
                    {seccion === 'inicio' && (
                        <Inicio
                            hijo={hijo}
                            promedioGeneral={promedioGeneral}
                            porcentajeAsist={porcentajeAsist}
                            cursosInscritos={cursosNotas.length}
                            comunicadosNuevos={comunicadosNuevos}
                        />
                    )}
                    {seccion === 'notas' && (
                        <Notas cursosNotas={cursosNotas} promedioGeneral={promedioGeneral} />
                    )}
                    {seccion === 'asistencia' && (
                        <Asistencia asistencia={asistencia} porcentaje={porcentajeAsist} presentes={presentes} total={totalAsist} />
                    )}
                    {seccion === 'comunicados' && <Comunicados comunicados={comunicadosOrdenados} />}
                </>
            )}
        </DashboardShell>
    );
};

/* =============================== INICIO ============================== */
const Inicio = ({ hijo, promedioGeneral, porcentajeAsist, cursosInscritos, comunicadosNuevos }) => (
    <>
        <div className="scs-welcome">
            <h2>{hijo ? `${hijo.nombre} ${hijo.apellido}` : 'Estudiante'}</h2>
            <p>Resumen del desempeño académico de su hijo(a) en Sojourn Christian School.</p>
        </div>
        <div className="scs-stats-grid">
            <Stat label="Promedio general" valor={fmt(promedioGeneral)} Icon={Award} alerta={promedioGeneral != null && Number(promedioGeneral) < 70} />
            <Stat label="Asistencia" valor={`${porcentajeAsist}%`} Icon={CalendarCheck} />
            <Stat label="Materias inscritas" valor={cursosInscritos} Icon={BookOpen} />
            <Stat label="Comunicados nuevos" valor={comunicadosNuevos} Icon={Bell} />
        </div>
    </>
);

const Stat = ({ label, valor, Icon, alerta }) => (
    <div className="scs-stat-card">
        <div className="scs-stat-head">
            <span className="scs-stat-label">{label}</span>
            <span className="scs-stat-icon"><Icon size={20} /></span>
        </div>
        <span className="scs-stat-value" style={alerta ? { color: 'var(--scs-danger)' } : undefined}>{valor}</span>
    </div>
);

/* =============================== NOTAS ============================== */
const Notas = ({ cursosNotas, promedioGeneral }) => {
    const conPromedio = cursosNotas.filter((c) => c.promedio != null);
    const chartData = {
        labels: conPromedio.map((c) => c.nombre),
        datasets: [
            {
                label: 'Promedio',
                data: conPromedio.map((c) => Number(c.promedio.toFixed(1))),
                backgroundColor: VERDE_MID,
                borderRadius: 6,
                maxBarThickness: 56,
            },
        ],
    };
    const chartOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
    };

    return (
        <>
            {conPromedio.length > 0 && (
                <div className="scs-card">
                    <div className="scs-card-head">
                        <h2 className="scs-card-title"><Award size={18} /> Progreso por materia</h2>
                    </div>
                    <div style={{ height: 260 }}>
                        <Bar data={chartData} options={chartOpts} />
                    </div>
                </div>
            )}

            <div className="scs-card">
                <div className="scs-card-head">
                    <h2 className="scs-card-title"><ClipboardList size={18} /> Calificaciones por materia</h2>
                    <span className="scs-badge scs-badge-green">Promedio general: {fmt(promedioGeneral)}</span>
                </div>
                {cursosNotas.length === 0 ? (
                    <p className="scs-empty">Aún no hay calificaciones registradas.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead>
                                <tr>
                                    <th>Materia</th>
                                    {PERIODOS.map((p) => <th key={p}>Período {p}</th>)}
                                    <th>Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cursosNotas.map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.nombre}</td>
                                        {PERIODOS.map((p) => (
                                            <td key={p}>
                                                {c.periodos[p] != null ? (
                                                    <span className={`scs-badge ${claseNota(c.periodos[p])}`}>{fmt(c.periodos[p], 0)}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--scs-muted)' }}>—</span>
                                                )}
                                            </td>
                                        ))}
                                        <td><span className={`scs-badge ${claseNota(c.promedio)}`}>{fmt(c.promedio)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

/* ============================= ASISTENCIA =========================== */
// Etiqueta y color por estado (4 posibles). El campo `estado` viene del backend;
// si un registro antiguo solo trae el booleano `presente`, se deriva.
const ESTADO_META = {
    presente: { label: 'Presente', color: VERDE, badge: 'scs-badge-green' },
    tardia: { label: 'Tardía', color: '#b8860b', badge: 'scs-badge-gray' },
    justificada: { label: 'Justificada', color: NAVY, badge: 'scs-badge-gray' },
    ausente: { label: 'Ausente', color: DANGER, badge: 'scs-badge-danger' },
};
const estadoDeRegistro = (a) => a.estado || (a.presente ? 'presente' : 'ausente');

const Asistencia = ({ asistencia, porcentaje, presentes, total }) => {
    const ordenada = [...asistencia].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const conteo = { presente: 0, tardia: 0, justificada: 0, ausente: 0 };
    asistencia.forEach((a) => { conteo[estadoDeRegistro(a)] = (conteo[estadoDeRegistro(a)] || 0) + 1; });

    const dona = {
        labels: ['Presente', 'Tardía', 'Justificada', 'Ausente'],
        datasets: [{
            data: [conteo.presente, conteo.tardia, conteo.justificada, conteo.ausente],
            backgroundColor: [VERDE, '#b8860b', NAVY, DANGER],
            borderWidth: 0,
        }],
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                <div className="scs-card">
                    <div className="scs-card-head">
                        <h2 className="scs-card-title"><CalendarCheck size={18} /> Resumen de asistencia</h2>
                    </div>
                    <div className="scs-bar">
                        <div className="scs-bar-fill" style={{ width: `${porcentaje}%`, background: porcentaje >= 80 ? VERDE : porcentaje >= 60 ? '#b8860b' : DANGER }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 14 }}>
                        <span><b style={{ color: VERDE }}>{porcentaje}%</b> de asistencia</span>
                        <span style={{ color: 'var(--scs-muted)' }}>{presentes} asistió · {total - presentes} no asistió</span>
                    </div>
                </div>

                <div className="scs-card">
                    <div className="scs-card-head">
                        <h2 className="scs-card-title"><CalendarCheck size={18} /> Distribución</h2>
                    </div>
                    {total === 0 ? (
                        <p className="scs-empty">Sin registros.</p>
                    ) : (
                        <div style={{ height: 200 }}>
                            <Doughnut data={dona} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="scs-card">
                <div className="scs-card-head">
                    <h2 className="scs-card-title"><CalendarCheck size={18} /> Historial de asistencia</h2>
                </div>
                {ordenada.length === 0 ? (
                    <p className="scs-empty">No hay registros de asistencia.</p>
                ) : (
                    <div className="scs-table-wrap">
                        <table className="scs-table">
                            <thead><tr><th>Fecha</th><th>Estado</th></tr></thead>
                            <tbody>
                                {ordenada.map((a) => {
                                    const meta = ESTADO_META[estadoDeRegistro(a)] || ESTADO_META.ausente;
                                    return (
                                        <tr key={a.id || a.fecha}>
                                            <td>{String(a.fecha).slice(0, 10)}</td>
                                            <td><span className="scs-badge" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

/* ============================ COMUNICADOS =========================== */
const Comunicados = ({ comunicados }) => (
    <div className="scs-card">
        <div className="scs-card-head">
            <h2 className="scs-card-title"><Bell size={18} /> Comunicados institucionales</h2>
        </div>
        {comunicados.length === 0 ? (
            <p className="scs-empty">No hay comunicados disponibles.</p>
        ) : (
            <div style={{ display: 'grid', gap: 12 }}>
                {comunicados.map((c) => {
                    const fecha = c.fecha || c.fecha_publicacion;
                    return (
                        <article key={c.id} style={{ padding: 16, border: '1px solid var(--scs-border)', borderLeft: '4px solid var(--scs-navy)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--scs-navy)' }}>{c.titulo}</h3>
                                {fecha && <span style={{ fontSize: 12, color: 'var(--scs-muted)', whiteSpace: 'nowrap' }}>{String(fecha).slice(0, 10)}</span>}
                            </div>
                            <p style={{ margin: '0 0 8px', color: 'var(--scs-muted)', fontSize: 14, lineHeight: 1.5 }}>{c.contenido}</p>
                            {c.imagen && <img src={c.imagen} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--scs-border)' }} />}
                        </article>
                    );
                })}
            </div>
        )}
    </div>
);

export default PadreDashboard;
