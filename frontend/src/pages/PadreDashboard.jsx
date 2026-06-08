import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

// Panel del padre de familia.
// Bitácora 04, obj. 4: consulta de notas, asistencia y comunicados del estudiante.
const PadreDashboard = () => {
    const [estudiantes, setEstudiantes] = useState([]);
    const [estudianteId, setEstudianteId] = useState('');
    const [notas, setNotas] = useState([]);
    const [asistencia, setAsistencia] = useState([]);
    const [comunicados, setComunicados] = useState([]);
    const [feedback, setFeedback] = useState(null);

    // Carga inicial: estudiantes (para seleccionar al hijo) y comunicados institucionales.
    useEffect(() => {
        (async () => {
            try {
                const [e, com] = await Promise.all([
                    api.get('/estudiantes'),
                    api.get('/comunicados'),
                ]);
                setEstudiantes(e.data);
                setComunicados(com.data);
                if (e.data.length > 0) setEstudianteId(String(e.data[0].id));
            } catch {
                setFeedback({ type: 'error', msg: 'No se pudo cargar la información.' });
            }
        })();
    }, []);

    // Al cambiar de estudiante, se consultan sus notas y asistencia.
    useEffect(() => {
        if (!estudianteId) return;
        (async () => {
            try {
                const [n, a] = await Promise.all([
                    api.get(`/notas/${estudianteId}`),
                    api.get(`/asistencia/${estudianteId}`),
                ]);
                setNotas(n.data);
                setAsistencia(a.data);
            } catch {
                setFeedback({ type: 'error', msg: 'No se pudieron cargar notas y asistencia.' });
            }
        })();
    }, [estudianteId]);

    const estudiante = estudiantes.find((e) => String(e.id) === String(estudianteId));

    const totalReg = asistencia.length;
    const presentes = asistencia.filter((a) => a.presente).length;
    const porcentaje = totalReg > 0 ? Math.round((presentes / totalReg) * 100) : 0;

    return (
        <DashboardLayout
            title="Panel del Padre de Familia"
            subtitle="Seguimiento académico del estudiante."
        >
            {feedback && (
                <div className={`alert alert-${feedback.type === 'error' ? 'error' : 'success'}`}>
                    {feedback.msg}
                </div>
            )}

            {/* Selección de estudiante (el backend no expone aún el vínculo padre-hijo) */}
            <div className="card">
                <div className="field" style={{ marginBottom: 0, maxWidth: 360 }}>
                    <label>Estudiante</label>
                    <select value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)}>
                        {estudiantes.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.nombre} {e.apellido}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {estudiante && (
                <>
                    {/* Perfil del estudiante */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Estudiante</div>
                            <div className="stat-value" style={{ fontSize: 22 }}>
                                {estudiante.nombre} {estudiante.apellido}
                            </div>
                        </div>
                        <div className="stat-card navy">
                            <div className="stat-label">Asistencia</div>
                            <div className="stat-value">{porcentaje}%</div>
                            <div className="attendance-bar" style={{ marginTop: 8 }}>
                                <div className="attendance-fill" style={{ width: `${porcentaje}%` }} />
                            </div>
                        </div>
                        <div className="stat-card gold">
                            <div className="stat-label">Notas registradas</div>
                            <div className="stat-value">{notas.length}</div>
                        </div>
                    </div>

                    {/* Calificaciones */}
                    <div className="card">
                        <div className="card-head">
                            <h2>Calificaciones</h2>
                        </div>
                        {notas.length === 0 ? (
                            <p className="empty">Aún no hay notas registradas.</p>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Curso</th>
                                        <th>Nota</th>
                                        <th>Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notas.map((n) => (
                                        <tr key={n.id}>
                                            <td>{n.curso_id}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        Number(n.nota) >= 70 ? 'badge-on' : 'badge-off'
                                                    }`}
                                                >
                                                    {n.nota}
                                                </span>
                                            </td>
                                            <td className="muted">{n.observacion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Historial de asistencia */}
                    <div className="card">
                        <div className="card-head">
                            <h2>Historial de asistencia</h2>
                        </div>
                        {asistencia.length === 0 ? (
                            <p className="empty">No hay registros de asistencia.</p>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asistencia.map((a) => (
                                        <tr key={a.id}>
                                            <td>{String(a.fecha).slice(0, 10)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${a.presente ? 'badge-on' : 'badge-off'}`}
                                                >
                                                    {a.presente ? 'Presente' : 'Ausente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Comunicados institucionales */}
            <div className="card">
                <div className="card-head">
                    <h2>Comunicados institucionales</h2>
                </div>
                {comunicados.length === 0 ? (
                    <p className="empty">No hay comunicados disponibles.</p>
                ) : (
                    comunicados.map((c) => (
                        <div key={c.id} className="comunicado">
                            <h3>{c.titulo}</h3>
                            <p className="muted">{c.contenido}</p>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
};

export default PadreDashboard;
