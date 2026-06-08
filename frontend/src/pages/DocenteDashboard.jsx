import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

// Panel del docente.
// Bitácora 04, obj. 3: cursos asignados, ingreso de notas y registro de asistencia.
const DocenteDashboard = () => {
    const [tab, setTab] = useState('notas');
    const [cursos, setCursos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [c, e] = await Promise.all([
                    api.get('/cursos'),
                    api.get('/estudiantes'),
                ]);
                setCursos(c.data);
                setEstudiantes(e.data);
            } catch {
                setFeedback({ type: 'error', msg: 'No se pudieron cargar cursos y estudiantes.' });
            }
        })();
    }, []);

    return (
        <DashboardLayout
            title="Panel del Docente"
            subtitle="Ingreso de notas y registro de asistencia por curso."
        >
            {feedback && (
                <div className={`alert alert-${feedback.type === 'error' ? 'error' : 'success'}`}>
                    {feedback.msg}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Cursos asignados</div>
                    <div className="stat-value">{cursos.length}</div>
                </div>
                <div className="stat-card navy">
                    <div className="stat-label">Estudiantes</div>
                    <div className="stat-value">{estudiantes.length}</div>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${tab === 'notas' ? 'active' : ''}`}
                    onClick={() => setTab('notas')}
                >
                    Ingreso de notas
                </button>
                <button
                    className={`tab ${tab === 'asistencia' ? 'active' : ''}`}
                    onClick={() => setTab('asistencia')}
                >
                    Asistencia
                </button>
            </div>

            {tab === 'notas' && (
                <NotasForm cursos={cursos} estudiantes={estudiantes} setFeedback={setFeedback} />
            )}
            {tab === 'asistencia' && (
                <AsistenciaForm
                    cursos={cursos}
                    estudiantes={estudiantes}
                    setFeedback={setFeedback}
                />
            )}
        </DashboardLayout>
    );
};

/* ---------------- Ingreso de notas ---------------- */
const NotasForm = ({ cursos, estudiantes, setFeedback }) => {
    const [form, setForm] = useState({
        estudiante_id: '',
        curso_id: '',
        nota: '',
        observacion: '',
    });
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (ev) => {
        ev.preventDefault();
        if (!form.estudiante_id || !form.curso_id || form.nota === '') {
            setFeedback({ type: 'error', msg: 'Estudiante, curso y nota son obligatorios.' });
            return;
        }
        try {
            await api.post('/notas', {
                estudiante_id: Number(form.estudiante_id),
                curso_id: Number(form.curso_id),
                nota: Number(form.nota),
                observacion: form.observacion,
            });
            setFeedback({ type: 'ok', msg: 'Nota registrada correctamente.' });
            setForm({ estudiante_id: '', curso_id: '', nota: '', observacion: '' });
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo registrar la nota.' });
        }
    };

    return (
        <div className="card">
            <div className="card-head">
                <h2>Registrar nota</h2>
            </div>
            <form onSubmit={submit}>
                <div className="row">
                    <div className="field">
                        <label>Estudiante</label>
                        <select value={form.estudiante_id} onChange={set('estudiante_id')}>
                            <option value="">Seleccione…</option>
                            {estudiantes.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.nombre} {e.apellido}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Curso</label>
                        <select value={form.curso_id} onChange={set('curso_id')}>
                            <option value="">Seleccione…</option>
                            {cursos.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Nota (0–100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.nota}
                            onChange={set('nota')}
                        />
                    </div>
                </div>
                <div className="field">
                    <label>Observación / período</label>
                    <textarea
                        rows="2"
                        value={form.observacion}
                        onChange={set('observacion')}
                        placeholder="Ej.: I Trimestre — buen desempeño"
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Guardar nota
                </button>
            </form>
        </div>
    );
};

/* ---------------- Registro de asistencia ---------------- */
const AsistenciaForm = ({ cursos, estudiantes, setFeedback }) => {
    const [cursoId, setCursoId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [presentes, setPresentes] = useState({});
    const [saving, setSaving] = useState(false);

    const togglePresente = (id) =>
        setPresentes((p) => ({ ...p, [id]: !(id in p ? p[id] : true) }));

    const estaPresente = (id) => (id in presentes ? presentes[id] : true);

    const guardar = async () => {
        if (!cursoId) {
            setFeedback({ type: 'error', msg: 'Seleccione un curso.' });
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                estudiantes.map((e) =>
                    api.post('/asistencia', {
                        estudiante_id: e.id,
                        curso_id: Number(cursoId),
                        fecha,
                        presente: estaPresente(e.id) ? 1 : 0,
                    })
                )
            );
            setFeedback({ type: 'ok', msg: 'Asistencia registrada correctamente.' });
        } catch {
            setFeedback({ type: 'error', msg: 'No se pudo registrar la asistencia.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card">
            <div className="card-head">
                <h2>Registro de asistencia</h2>
            </div>
            <div className="row" style={{ marginBottom: 18 }}>
                <div className="field">
                    <label>Curso</label>
                    <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                        <option value="">Seleccione…</option>
                        {cursos.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
            </div>

            {estudiantes.length === 0 ? (
                <p className="empty">No hay estudiantes registrados.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            <th>Presente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estudiantes.map((e) => (
                            <tr key={e.id}>
                                <td>
                                    {e.nombre} {e.apellido}
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        style={{ width: 'auto' }}
                                        checked={estaPresente(e.id)}
                                        onChange={() => togglePresente(e.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button
                className="btn btn-primary"
                style={{ marginTop: 18 }}
                onClick={guardar}
                disabled={saving}
            >
                {saving ? 'Guardando…' : 'Guardar asistencia'}
            </button>
        </div>
    );
};

export default DocenteDashboard;
