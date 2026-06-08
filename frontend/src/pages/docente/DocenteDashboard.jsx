import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Panel del Docente — Sojourn Christian School.
// Bitácora 06: cursos asignados, ingreso/consulta de notas por período,
// registro de asistencia diaria y consulta de comunicados. Todo en un solo
// archivo con barra lateral fija. Cada petición usa la instancia de axios
// (services/api) que adjunta el token JWT del usuario en Authorization: Bearer.

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
    { key: 'cursos', label: 'Mis Cursos', icon: '📚' },
    { key: 'notas', label: 'Notas', icon: '📝' },
    { key: 'asistencia', label: 'Asistencia', icon: '✅' },
    { key: 'comunicados', label: 'Comunicados', icon: '📢' },
];

/* ============================== COMPONENTE RAÍZ ============================== */
const DocenteDashboard = () => {
    const { user, logout } = useAuth();
    const [seccion, setSeccion] = useState('inicio');

    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [comunicados, setComunicados] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', msg }

    const notificar = (tipo, msg) => {
        setAviso({ tipo, msg });
        window.clearTimeout(notificar._t);
        notificar._t = window.setTimeout(() => setAviso(null), 4000);
    };

    useEffect(() => {
        (async () => {
            setCargando(true);
            try {
                const [c, e, com] = await Promise.all([
                    api.get('/api/cursos'),
                    api.get('/api/estudiantes'),
                    api.get('/api/comunicados'),
                ]);
                setCursos(c.data || []);
                setEstudiantes(e.data || []);
                setComunicados(com.data || []);
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

    // Solo los cursos asignados a este docente (docente_id = id del usuario logueado).
    const misCursos = useMemo(
        () => cursos.filter((c) => Number(c.docente_id) === Number(user?.id)),
        [cursos, user]
    );

    // Relación estudiante ↔ curso. Si los datos no traen la relación, se muestran
    // todos los estudiantes como respaldo para no romper la interfaz.
    const hayRelacionCurso = useMemo(
        () =>
            estudiantes.some(
                (e) =>
                    e.curso_id != null ||
                    Array.isArray(e.cursos) ||
                    Array.isArray(e.cursos_ids)
            ),
        [estudiantes]
    );

    const estudiantesDeCurso = (cursoId) => {
        if (!cursoId) return [];
        const id = String(cursoId);
        if (!hayRelacionCurso) return estudiantes;
        return estudiantes.filter(
            (e) =>
                String(e.curso_id) === id ||
                (Array.isArray(e.cursos) &&
                    e.cursos.some((c) => String(c.id ?? c) === id)) ||
                (Array.isArray(e.cursos_ids) && e.cursos_ids.map(String).includes(id))
        );
    };

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
                            <div style={S.userName}>{user?.nombre || 'Docente'}</div>
                            <div style={S.userRole}>{user?.rol || 'docente'}</div>
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

                <section>
                    {cargando ? (
                        <p style={S.vacio}>Cargando información…</p>
                    ) : (
                        <>
                            {seccion === 'inicio' && (
                                <Inicio
                                    user={user}
                                    misCursos={misCursos}
                                    estudiantesDeCurso={estudiantesDeCurso}
                                    irA={irA}
                                />
                            )}
                            {seccion === 'cursos' && (
                                <MisCursos
                                    misCursos={misCursos}
                                    estudiantesDeCurso={estudiantesDeCurso}
                                />
                            )}
                            {seccion === 'notas' && (
                                <Notas
                                    misCursos={misCursos}
                                    estudiantesDeCurso={estudiantesDeCurso}
                                    notificar={notificar}
                                />
                            )}
                            {seccion === 'asistencia' && (
                                <Asistencia
                                    misCursos={misCursos}
                                    estudiantesDeCurso={estudiantesDeCurso}
                                    notificar={notificar}
                                />
                            )}
                            {seccion === 'comunicados' && (
                                <Comunicados comunicados={comunicados} />
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

/* =============================== SECCIÓN: INICIO ============================== */
const Inicio = ({ user, misCursos, estudiantesDeCurso, irA }) => {
    const totalEstudiantes = useMemo(() => {
        const ids = new Set();
        misCursos.forEach((c) =>
            estudiantesDeCurso(c.id).forEach((e) => ids.add(e.id))
        );
        return ids.size;
    }, [misCursos, estudiantesDeCurso]);

    return (
        <>
            <div style={S.bienvenida}>
                <h2 style={S.bienvenidaTitulo}>
                    ¡Bienvenido, {user?.nombre || 'docente'}! 👋
                </h2>
                <p style={S.bienvenidaTexto}>
                    Este es tu panel docente. Desde aquí puedes gestionar las notas y la
                    asistencia de tus cursos asignados.
                </p>
            </div>

            <div style={S.cardsGrid}>
                <button style={S.statCard} onClick={() => irA('cursos')}>
                    <span style={S.statIcon}>📚</span>
                    <span style={S.statValor}>{misCursos.length}</span>
                    <span style={S.statLabel}>Cursos asignados</span>
                </button>
                <button style={S.statCard} onClick={() => irA('cursos')}>
                    <span style={S.statIcon}>🎓</span>
                    <span style={S.statValor}>{totalEstudiantes}</span>
                    <span style={S.statLabel}>Estudiantes</span>
                </button>
            </div>

            <div style={S.panel}>
                <div style={S.panelHead}>
                    <h2 style={S.panelTitulo}>Resumen de mis cursos</h2>
                </div>
                {misCursos.length === 0 ? (
                    <p style={S.vacio}>Aún no tienes cursos asignados.</p>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {misCursos.map((c) => (
                            <div key={c.id} style={S.resumenCurso}>
                                <div>
                                    <div style={S.resumenNombre}>{c.nombre}</div>
                                    <div style={S.resumenDesc}>{c.descripcion || 'Sin descripción'}</div>
                                </div>
                                <span style={S.badgeRol}>
                                    {estudiantesDeCurso(c.id).length} estudiantes
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

/* ============================= SECCIÓN: MIS CURSOS ============================ */
const MisCursos = ({ misCursos, estudiantesDeCurso }) => {
    const [cursoSel, setCursoSel] = useState(null);

    if (misCursos.length === 0) {
        return (
            <div style={S.panel}>
                <p style={S.vacio}>Aún no tienes cursos asignados.</p>
            </div>
        );
    }

    const inscritos = cursoSel ? estudiantesDeCurso(cursoSel.id) : [];

    return (
        <div style={S.dosColumnas}>
            <div style={S.panel}>
                <div style={S.panelHead}>
                    <h2 style={S.panelTitulo}>Cursos asignados</h2>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                    {misCursos.map((c) => {
                        const activo = cursoSel?.id === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => setCursoSel(c)}
                                style={{
                                    ...S.cursoItem,
                                    ...(activo ? S.cursoItemActivo : null),
                                }}
                            >
                                <span style={S.cursoNombre}>{c.nombre}</span>
                                <span style={S.cursoFlecha}>›</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={S.panel}>
                <div style={S.panelHead}>
                    <h2 style={S.panelTitulo}>
                        {cursoSel ? `Estudiantes — ${cursoSel.nombre}` : 'Estudiantes inscritos'}
                    </h2>
                </div>
                {!cursoSel ? (
                    <p style={S.vacio}>Selecciona un curso para ver sus estudiantes.</p>
                ) : inscritos.length === 0 ? (
                    <p style={S.vacio}>Este curso no tiene estudiantes inscritos.</p>
                ) : (
                    <Tabla columnas={['#', 'Estudiante']}>
                        {inscritos.map((e, i) => (
                            <tr key={e.id}>
                                <td style={{ ...S.td, width: 40, color: C.textoSuave }}>{i + 1}</td>
                                <td style={S.td}>
                                    <div style={S.estudianteCelda}>
                                        <span style={S.miniAvatar}>
                                            {(e.nombre || '?').charAt(0).toUpperCase()}
                                        </span>
                                        {e.nombre} {e.apellido}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </div>
        </div>
    );
};

/* =============================== SECCIÓN: NOTAS ============================== */
const Notas = ({ misCursos, estudiantesDeCurso, notificar }) => {
    const [cursoId, setCursoId] = useState('');
    const [filas, setFilas] = useState({}); // { [estudianteId]: { nota, periodo } }
    const [guardando, setGuardando] = useState(false);

    const inscritos = cursoId ? estudiantesDeCurso(cursoId) : [];

    const cambiarCurso = (id) => {
        setCursoId(id);
        setFilas({});
    };

    const setFila = (estId, campo, valor) =>
        setFilas((f) => ({
            ...f,
            [estId]: { periodo: 'I', nota: '', ...f[estId], [campo]: valor },
        }));

    const guardar = async () => {
        if (!cursoId) {
            notificar('error', 'Seleccione un curso.');
            return;
        }
        // Solo se envían los estudiantes con una nota ingresada.
        const pendientes = inscritos
            .map((e) => ({ est: e, datos: filas[e.id] }))
            .filter(({ datos }) => datos && datos.nota !== '' && datos.nota != null);

        if (pendientes.length === 0) {
            notificar('error', 'Ingrese al menos una nota.');
            return;
        }
        for (const { datos } of pendientes) {
            const n = Number(datos.nota);
            if (Number.isNaN(n) || n < 0 || n > 100) {
                notificar('error', 'Las notas deben estar entre 0 y 100.');
                return;
            }
        }

        setGuardando(true);
        try {
            await Promise.all(
                pendientes.map(({ est, datos }) =>
                    api.post('/api/notas', {
                        estudiante_id: est.id,
                        curso_id: Number(cursoId),
                        nota: Number(datos.nota),
                        periodo: datos.periodo || 'I',
                    })
                )
            );
            notificar('ok', `${pendientes.length} nota(s) guardada(s) correctamente.`);
        } catch (err) {
            notificar('error', err.response?.data?.message || 'No se pudieron guardar las notas.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div style={S.panel}>
            <div style={S.panelHead}>
                <h2 style={S.panelTitulo}>Ingreso de notas</h2>
            </div>

            <Campo label="Curso">
                <select style={{ ...S.input, maxWidth: 320 }} value={cursoId} onChange={(e) => cambiarCurso(e.target.value)}>
                    <option value="">Seleccione un curso…</option>
                    {misCursos.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </Campo>

            {!cursoId ? (
                <p style={S.vacio}>Seleccione un curso para ingresar notas.</p>
            ) : inscritos.length === 0 ? (
                <p style={S.vacio}>Este curso no tiene estudiantes inscritos.</p>
            ) : (
                <>
                    <Tabla columnas={['Estudiante', 'Período', 'Nota (0–100)']}>
                        {inscritos.map((e) => (
                            <tr key={e.id}>
                                <td style={S.td}>{e.nombre} {e.apellido}</td>
                                <td style={S.td}>
                                    <select
                                        style={{ ...S.input, maxWidth: 110 }}
                                        value={filas[e.id]?.periodo || 'I'}
                                        onChange={(ev) => setFila(e.id, 'periodo', ev.target.value)}
                                    >
                                        {PERIODOS.map((p) => (
                                            <option key={p} value={p}>
                                                Período {p}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td style={S.td}>
                                    <input
                                        style={{ ...S.input, maxWidth: 120 }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="—"
                                        value={filas[e.id]?.nota ?? ''}
                                        onChange={(ev) => setFila(e.id, 'nota', ev.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                    <div style={{ marginTop: 18 }}>
                        <button
                            style={{ ...S.btn, ...S.btnPrimario }}
                            onClick={guardar}
                            disabled={guardando}
                        >
                            {guardando ? 'Guardando…' : 'Guardar notas'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ============================= SECCIÓN: ASISTENCIA =========================== */
const Asistencia = ({ misCursos, estudiantesDeCurso, notificar }) => {
    const [cursoId, setCursoId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [presentes, setPresentes] = useState({}); // { [estudianteId]: boolean }
    const [guardando, setGuardando] = useState(false);

    const inscritos = cursoId ? estudiantesDeCurso(cursoId) : [];

    const estaPresente = (id) => (id in presentes ? presentes[id] : true);
    const toggle = (id) => setPresentes((p) => ({ ...p, [id]: !estaPresente(id) }));

    const cambiarCurso = (id) => {
        setCursoId(id);
        setPresentes({});
    };

    const guardar = async () => {
        if (!cursoId) {
            notificar('error', 'Seleccione un curso.');
            return;
        }
        if (inscritos.length === 0) {
            notificar('error', 'Este curso no tiene estudiantes inscritos.');
            return;
        }
        setGuardando(true);
        try {
            await Promise.all(
                inscritos.map((e) =>
                    api.post('/api/asistencia', {
                        estudiante_id: e.id,
                        curso_id: Number(cursoId),
                        fecha,
                        presente: estaPresente(e.id),
                    })
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
        <div style={S.panel}>
            <div style={S.panelHead}>
                <h2 style={S.panelTitulo}>Registro de asistencia</h2>
            </div>

            <div style={S.formRow}>
                <Campo label="Curso">
                    <select style={S.input} value={cursoId} onChange={(e) => cambiarCurso(e.target.value)}>
                        <option value="">Seleccione un curso…</option>
                        {misCursos.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </Campo>
                <Campo label="Fecha">
                    <input
                        style={S.input}
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                </Campo>
            </div>

            {!cursoId ? (
                <p style={S.vacio}>Seleccione un curso para registrar la asistencia.</p>
            ) : inscritos.length === 0 ? (
                <p style={S.vacio}>Este curso no tiene estudiantes inscritos.</p>
            ) : (
                <>
                    <Tabla columnas={['Estudiante', 'Asistencia']}>
                        {inscritos.map((e) => {
                            const presente = estaPresente(e.id);
                            return (
                                <tr key={e.id}>
                                    <td style={S.td}>{e.nombre} {e.apellido}</td>
                                    <td style={S.td}>
                                        <button
                                            onClick={() => toggle(e.id)}
                                            style={{
                                                ...S.toggle,
                                                ...(presente ? S.togglePresente : S.toggleAusente),
                                            }}
                                        >
                                            {presente ? '● Presente' : '○ Ausente'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </Tabla>
                    <div style={{ marginTop: 18 }}>
                        <button
                            style={{ ...S.btn, ...S.btnPrimario }}
                            onClick={guardar}
                            disabled={guardando}
                        >
                            {guardando ? 'Guardando…' : 'Guardar registro'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ============================ SECCIÓN: COMUNICADOS =========================== */
const Comunicados = ({ comunicados }) => (
    <div style={S.panel}>
        <div style={S.panelHead}>
            <h2 style={S.panelTitulo}>Comunicados institucionales</h2>
        </div>
        {comunicados.length === 0 ? (
            <p style={S.vacio}>No hay comunicados publicados.</p>
        ) : (
            <div style={{ display: 'grid', gap: 12 }}>
                {comunicados.map((c) => (
                    <article key={c.id} style={S.comunicado}>
                        <h3 style={S.comunicadoTitulo}>{c.titulo}</h3>
                        <p style={S.comunicadoTexto}>{c.contenido}</p>
                        {c.fecha && (
                            <span style={S.comunicadoFecha}>
                                {String(c.fecha).slice(0, 10)}
                            </span>
                        )}
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

const Campo = ({ label, children }) => (
    <label style={S.campo}>
        <span style={S.campoLabel}>{label}</span>
        {children}
    </label>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 18,
        marginBottom: 18,
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

    /* Resumen cursos (inicio) */
    resumenCurso: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        border: `1px solid ${C.borde}`,
        borderRadius: 10,
        background: C.fondo,
    },
    resumenNombre: { fontWeight: 600, fontSize: 15, color: C.texto },
    resumenDesc: { fontSize: 13, color: C.textoSuave },

    /* Mis cursos (dos columnas) */
    dosColumnas: {
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 320px) 1fr',
        gap: 18,
        alignItems: 'start',
    },
    cursoItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        borderRadius: 10,
        border: `1px solid ${C.borde}`,
        background: C.blanco,
        font: 'inherit',
        fontSize: 15,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
    },
    cursoItemActivo: {
        background: C.verdeClaro,
        borderColor: C.verdeMedio,
        fontWeight: 600,
    },
    cursoNombre: { color: C.texto },
    cursoFlecha: { color: C.verdeMedio, fontSize: 20, fontWeight: 700 },
    estudianteCelda: { display: 'flex', alignItems: 'center', gap: 10 },
    miniAvatar: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: C.verdeClaro,
        color: C.verdeMedio,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
    },

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

    /* Toggle asistencia */
    toggle: {
        padding: '7px 16px',
        borderRadius: 999,
        border: 'none',
        font: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        minWidth: 110,
    },
    togglePresente: { background: C.okBg, color: C.ok },
    toggleAusente: { background: C.errorBg, color: C.error },

    /* Comunicados */
    comunicado: {
        padding: 16,
        border: `1px solid ${C.borde}`,
        borderLeft: `4px solid ${C.navy}`,
        borderRadius: 12,
        background: C.blanco,
    },
    comunicadoTitulo: { margin: '0 0 6px', fontSize: 16, color: C.navy },
    comunicadoTexto: { margin: 0, color: C.textoSuave, fontSize: 14, lineHeight: 1.5 },
    comunicadoFecha: {
        display: 'inline-block',
        marginTop: 8,
        fontSize: 12,
        color: C.textoSuave,
    },

    /* Vacío */
    vacio: { color: C.textoSuave, padding: '24px 4px', textAlign: 'center', fontSize: 14 },

    /* Botones */
    btn: {
        padding: '10px 18px',
        borderRadius: 9,
        border: 'none',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    btnPrimario: { background: C.verdeMedio, color: C.blanco },

    /* Formularios */
    formRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
    campo: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flex: 1, minWidth: 180 },
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

export default DocenteDashboard;
