import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Portal del Padre de Familia — Sojourn Christian School.
// Bitácora 07: consulta (solo lectura) del rendimiento académico del hijo:
// resumen general, calificaciones por curso y período, historial de asistencia
// y comunicados institucionales. Barra lateral fija. Todo en un solo archivo.
// Cada petición usa la instancia de axios (services/api) que adjunta el token
// JWT del usuario en el header Authorization: Bearer <token>.

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

const PERIODOS = ['I', 'II', 'III'];

const SECCIONES = [
    { key: 'inicio', label: 'Inicio', icon: '🏠' },
    { key: 'notas', label: 'Notas', icon: '📝' },
    { key: 'asistencia', label: 'Asistencia', icon: '📅' },
    { key: 'comunicados', label: 'Comunicados', icon: '📢' },
];

const nombreCurso = (n) =>
    n.curso_nombre || n.curso || (n.curso_id != null ? `Curso ${n.curso_id}` : 'Curso');

/* ============================== COMPONENTE RAÍZ ============================== */
const PadreDashboard = () => {
    const { user, logout } = useAuth();
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

    // Carga inicial: hijos del padre logueado (padre_id) y comunicados.
    useEffect(() => {
        (async () => {
            setCargando(true);
            try {
                const [e, com] = await Promise.all([
                    api.get('/api/estudiantes'),
                    api.get('/api/comunicados'),
                ]);
                const lista = e.data || [];
                // Filtrar los estudiantes cuyo padre_id coincide con el usuario.
                // Si el backend ya filtra por el token, se respeta la lista recibida.
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

    // Al cambiar de hijo, se consultan sus notas y asistencia.
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

    /* ----------------------------- Cálculos ----------------------------- */
    // Notas agrupadas por curso → { nombre, periodos: { I, II, III }, promedio }.
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
            const promedio =
                valores.length > 0
                    ? valores.reduce((a, b) => a + b, 0) / valores.length
                    : null;
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

    // "Comunicados nuevos": publicados en los últimos 7 días (si traen fecha).
    const comunicadosNuevos = useMemo(() => {
        const hace7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const conFecha = comunicados.filter((c) => c.fecha);
        if (conFecha.length === 0) return comunicados.length;
        return conFecha.filter((c) => new Date(c.fecha).getTime() >= hace7).length;
    }, [comunicados]);

    const comunicadosOrdenados = useMemo(
        () =>
            [...comunicados].sort((a, b) => {
                if (a.fecha && b.fecha) return new Date(b.fecha) - new Date(a.fecha);
                return (b.id || 0) - (a.id || 0);
            }),
        [comunicados]
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
                            <div style={S.userName}>{user?.nombre || 'Padre/Madre'}</div>
                            <div style={S.userRole}>{user?.rol || 'padre'}</div>
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
                    {/* Selector de hijo (solo si hay más de uno) */}
                    {hijos.length > 1 ? (
                        <select
                            style={{ ...S.input, maxWidth: 240 }}
                            value={hijoId}
                            onChange={(e) => setHijoId(e.target.value)}
                        >
                            {hijos.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.nombre} {h.apellido}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span style={S.fecha}>
                            {new Date().toLocaleDateString('es-CR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    )}
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

                <section>
                    {cargando ? (
                        <p style={S.vacio}>Cargando información…</p>
                    ) : hijos.length === 0 ? (
                        <div style={S.panel}>
                            <p style={S.vacio}>
                                No hay estudiantes asociados a su cuenta. Comuníquese con la
                                administración de la institución.
                            </p>
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
                                <Asistencia
                                    asistencia={asistencia}
                                    porcentaje={porcentajeAsist}
                                    presentes={presentes}
                                    total={totalAsist}
                                />
                            )}
                            {seccion === 'comunicados' && (
                                <Comunicados comunicados={comunicadosOrdenados} />
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

/* =============================== Color de nota ============================== */
const colorNota = (n) =>
    n == null ? S.notaNeutra : Number(n) >= 70 ? S.notaBuena : S.notaMala;

const fmt = (n, dec = 1) => (n == null ? '—' : Number(n).toFixed(dec));

/* =============================== SECCIÓN: INICIO ============================== */
const Inicio = ({ hijo, promedioGeneral, porcentajeAsist, cursosInscritos, comunicadosNuevos }) => (
    <>
        <div style={S.bienvenida}>
            <h2 style={S.bienvenidaTitulo}>
                {hijo ? `${hijo.nombre} ${hijo.apellido}` : 'Estudiante'}
            </h2>
            <p style={S.bienvenidaTexto}>
                Resumen del desempeño académico de su hijo(a) en Sojourn Christian School.
            </p>
        </div>

        <div style={S.cardsGrid}>
            <div style={S.statCard}>
                <span style={S.statIcon}>🎯</span>
                <span style={{ ...S.statValor, ...(promedioGeneral != null && Number(promedioGeneral) < 70 ? { color: C.error } : null) }}>
                    {fmt(promedioGeneral)}
                </span>
                <span style={S.statLabel}>Promedio general</span>
            </div>
            <div style={S.statCard}>
                <span style={S.statIcon}>📅</span>
                <span style={S.statValor}>{porcentajeAsist}%</span>
                <span style={S.statLabel}>Asistencia</span>
            </div>
            <div style={S.statCard}>
                <span style={S.statIcon}>📚</span>
                <span style={S.statValor}>{cursosInscritos}</span>
                <span style={S.statLabel}>Cursos inscritos</span>
            </div>
            <div style={S.statCard}>
                <span style={S.statIcon}>📢</span>
                <span style={S.statValor}>{comunicadosNuevos}</span>
                <span style={S.statLabel}>Comunicados nuevos</span>
            </div>
        </div>
    </>
);

/* =============================== SECCIÓN: NOTAS ============================== */
const Notas = ({ cursosNotas, promedioGeneral }) => (
    <div style={S.panel}>
        <div style={S.panelHead}>
            <h2 style={S.panelTitulo}>Calificaciones por curso</h2>
            <span style={S.badgeRol}>Promedio general: {fmt(promedioGeneral)}</span>
        </div>

        {cursosNotas.length === 0 ? (
            <p style={S.vacio}>Aún no hay calificaciones registradas.</p>
        ) : (
            <Tabla columnas={['Curso', ...PERIODOS.map((p) => `Período ${p}`), 'Promedio']}>
                {cursosNotas.map((c, i) => (
                    <tr key={i}>
                        <td style={S.td}>{c.nombre}</td>
                        {PERIODOS.map((p) => (
                            <td key={p} style={S.td}>
                                {c.periodos[p] != null ? (
                                    <span style={{ ...S.notaBadge, ...colorNota(c.periodos[p]) }}>
                                        {fmt(c.periodos[p], 0)}
                                    </span>
                                ) : (
                                    <span style={{ color: C.textoSuave }}>—</span>
                                )}
                            </td>
                        ))}
                        <td style={S.td}>
                            <span style={{ ...S.notaBadge, ...colorNota(c.promedio) }}>
                                {fmt(c.promedio)}
                            </span>
                        </td>
                    </tr>
                ))}
            </Tabla>
        )}
    </div>
);

/* ============================= SECCIÓN: ASISTENCIA =========================== */
const Asistencia = ({ asistencia, porcentaje, presentes, total }) => {
    const ausentes = total - presentes;
    // Ordenar por fecha descendente para el historial.
    const ordenada = [...asistencia].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <>
            <div style={S.panel}>
                <div style={S.panelHead}>
                    <h2 style={S.panelTitulo}>Resumen de asistencia</h2>
                    <span style={S.badgeRol}>
                        {presentes}/{total} días presentes
                    </span>
                </div>
                <div style={S.barraWrap}>
                    <div
                        style={{
                            ...S.barraFill,
                            width: `${porcentaje}%`,
                            background: porcentaje >= 80 ? C.verdeMedio : porcentaje >= 60 ? '#d97706' : C.error,
                        }}
                    />
                </div>
                <div style={S.barraLeyenda}>
                    <span><b style={{ color: C.verdeMedio }}>{porcentaje}%</b> de asistencia</span>
                    <span style={{ color: C.textoSuave }}>
                        {presentes} presentes · {ausentes} ausentes
                    </span>
                </div>

                {/* Tira visual de los últimos registros */}
                {ordenada.length > 0 && (
                    <div style={S.tira}>
                        {ordenada.slice(0, 30).reverse().map((a) => (
                            <span
                                key={a.id || a.fecha}
                                title={`${String(a.fecha).slice(0, 10)} — ${a.presente ? 'Presente' : 'Ausente'}`}
                                style={{
                                    ...S.tiraDia,
                                    background: a.presente ? C.verdeMedio : C.error,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div style={S.panel}>
                <div style={S.panelHead}>
                    <h2 style={S.panelTitulo}>Historial de asistencia</h2>
                </div>
                {ordenada.length === 0 ? (
                    <p style={S.vacio}>No hay registros de asistencia.</p>
                ) : (
                    <Tabla columnas={['Fecha', 'Estado']}>
                        {ordenada.map((a) => (
                            <tr key={a.id || a.fecha}>
                                <td style={S.td}>{String(a.fecha).slice(0, 10)}</td>
                                <td style={S.td}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                            style={{
                                                ...S.punto,
                                                background: a.presente ? C.verdeMedio : C.error,
                                            }}
                                        />
                                        <span style={a.presente ? { color: C.ok } : { color: C.error }}>
                                            {a.presente ? 'Presente' : 'Ausente'}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </div>
        </>
    );
};

/* ============================ SECCIÓN: COMUNICADOS =========================== */
const Comunicados = ({ comunicados }) => (
    <div style={S.panel}>
        <div style={S.panelHead}>
            <h2 style={S.panelTitulo}>Comunicados institucionales</h2>
        </div>
        {comunicados.length === 0 ? (
            <p style={S.vacio}>No hay comunicados disponibles.</p>
        ) : (
            <div style={{ display: 'grid', gap: 12 }}>
                {comunicados.map((c) => (
                    <article key={c.id} style={S.comunicado}>
                        <div style={S.comunicadoHead}>
                            <h3 style={S.comunicadoTitulo}>{c.titulo}</h3>
                            {c.fecha && (
                                <span style={S.comunicadoFecha}>{String(c.fecha).slice(0, 10)}</span>
                            )}
                        </div>
                        <p style={S.comunicadoTexto}>{c.contenido}</p>
                    </article>
                ))}
            </div>
        )}
    </div>
);

/* ============================ COMPONENTES AUXILIARES ========================= */
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
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 8,
    },
    titulo: { fontSize: 26, fontWeight: 700, color: C.verdeOscuro, margin: 0 },
    fecha: { color: C.textoSuave, fontSize: 14, textTransform: 'capitalize' },

    aviso: { padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: 14, fontWeight: 500 },
    avisoOk: { background: C.okBg, color: C.ok, border: `1px solid ${C.ok}33` },
    avisoError: { background: C.errorBg, color: C.error, border: `1px solid ${C.error}33` },

    /* Bienvenida */
    bienvenida: {
        background: `linear-gradient(120deg, ${C.verdeOscuro}, ${C.verdeMedio})`,
        color: C.blanco,
        borderRadius: 14,
        padding: '24px 26px',
        marginBottom: 18,
    },
    bienvenidaTitulo: { margin: '0 0 6px', fontSize: 22 },
    bienvenidaTexto: { margin: 0, fontSize: 15, color: C.verdeClaro, lineHeight: 1.5 },

    /* Tarjetas */
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
        marginBottom: 18,
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
        padding: '4px 12px',
        borderRadius: 999,
        background: C.verdeClaro,
        color: C.verdeMedio,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
    },

    /* Notas */
    notaBadge: {
        display: 'inline-block',
        minWidth: 38,
        textAlign: 'center',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
    },
    notaBuena: { background: C.okBg, color: C.ok },
    notaMala: { background: C.errorBg, color: C.error },
    notaNeutra: { background: C.fondo, color: C.textoSuave },

    /* Asistencia */
    barraWrap: {
        height: 14,
        borderRadius: 999,
        background: C.fondo,
        overflow: 'hidden',
        border: `1px solid ${C.borde}`,
    },
    barraFill: { height: '100%', borderRadius: 999, transition: 'width .3s' },
    barraLeyenda: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 14,
    },
    tira: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 16 },
    tiraDia: { width: 16, height: 16, borderRadius: 4 },
    punto: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },

    /* Comunicados */
    comunicado: {
        padding: 16,
        border: `1px solid ${C.borde}`,
        borderLeft: `4px solid ${C.navy}`,
        borderRadius: 12,
        background: C.blanco,
    },
    comunicadoHead: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 6,
    },
    comunicadoTitulo: { margin: 0, fontSize: 16, color: C.navy },
    comunicadoTexto: { margin: 0, color: C.textoSuave, fontSize: 14, lineHeight: 1.5 },
    comunicadoFecha: { fontSize: 12, color: C.textoSuave, whiteSpace: 'nowrap' },

    /* Vacío */
    vacio: { color: C.textoSuave, padding: '24px 4px', textAlign: 'center', fontSize: 14 },

    /* Inputs */
    input: {
        padding: '10px 12px',
        borderRadius: 9,
        border: `1px solid ${C.borde}`,
        font: 'inherit',
        fontSize: 14,
        boxSizing: 'border-box',
        background: C.blanco,
        color: C.texto,
    },
};

export default PadreDashboard;
