// Migraciones idempotentes que se ejecutan al arrancar el servidor.
// Agregan columnas nuevas, actualizan el esquema de asistencia y reconcilian el
// catálogo de materias con la especificación oficial de la institución. Usa la
// conexión de producción de la app, por lo que no requiere credenciales externas.

// ---------------------------------------------------------------------------
// Especificación oficial del catálogo de materias (Noily).
// ---------------------------------------------------------------------------
// Materias en TODOS los grados de 1° a 8°: las 11 materias BASE.
// En 9°, 10° y 11°: Matemática y Ciencias son REEMPLAZADAS por Math (por
// Matemática) y por Física/Química/Biología (por Ciencias). Las demás materias
// BASE se mantienen. => 9 BASE + 4 EXTRA = 13 por grado.
const NIVELES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];
const BASE = ['Español', 'Matemática', 'Estudios Sociales', 'Educación Cívica', 'Ciencias', 'Inglés', 'Educación Física', 'Música', 'Informática', 'History', 'Bible'];
const EXTRA = ['Math', 'Física', 'Química', 'Biología']; // solo 9°, 10°, 11°
const EXTRA_NIVELES = ['9°', '10°', '11°'];
// Materias que en 9°-11° quedan reemplazadas (no deben existir en esos grados).
const REEMPLAZADAS_EN_EXTRA = new Set(['Matemática', 'Ciencias']);
const PROYECTO_FIJAS = new Set(['Bible', 'Música', 'Educación Física', 'Informática', 'History']);

// Componente de evaluación según las reglas de la institución.
//   PROYECTO: Bible, Música, Educación Física, Informática, History y
//             Educación Cívica — EXCEPTO Educación Cívica en 10° y 11° (PRUEBAS).
//   PRUEBAS:  todo lo demás.
function componente(sub, nivel) {
    if (PROYECTO_FIJAS.has(sub)) return 'PROYECTO';
    if (sub === 'Educación Cívica') return (nivel === '10°' || nivel === '11°') ? 'PRUEBAS' : 'PROYECTO';
    return 'PRUEBAS';
}

// Catálogo autoritativo esperado. Devuelve un Map key `${nombre}|${nivel}` -> componente.
function catalogoEsperado() {
    const map = new Map();
    for (const nivel of NIVELES) {
        for (const s of BASE) {
            if (EXTRA_NIVELES.includes(nivel) && REEMPLAZADAS_EN_EXTRA.has(s)) continue; // reemplazadas
            map.set(`${s}|${nivel}`, componente(s, nivel));
        }
    }
    for (const nivel of EXTRA_NIVELES) {
        for (const s of EXTRA) map.set(`${s}|${nivel}`, componente(s, nivel));
    }
    return map; // 8*11 + 3*(9+4) = 88 + 39 = 127
}

// Filas para el seed inicial (solo se usa en una base vacía).
function catalogoSeed() {
    return [...catalogoEsperado()].map(([k, comp]) => {
        const [nombre, nivel] = k.split('|');
        return [nombre, nivel, comp, 1];
    });
}

async function columnaFalta(pool, tabla, columna) {
    const [r] = await pool.query(
        'SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
        [tabla, columna]
    );
    return r[0].n === 0;
}

// Garantiza que exista un índice ÚNICO con el nombre dado. Es lo que hace que
// funcionen los "upsert" (ON DUPLICATE KEY UPDATE) de notas y asistencia: sin
// esta clave, cada registro se duplicaría en vez de actualizarse. Antes de
// crear la clave se eliminan los duplicados existentes conservando el id más
// reciente (idempotente).
async function ensureUniqueKey(pool, tabla, indexName, columnas) {
    const [existing] = await pool.query(
        'SELECT COUNT(*) n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
        [tabla, indexName]
    );
    if (existing[0].n > 0) return;

    // Deduplicar: conservar la fila de mayor id por combinación de columnas.
    const cond = columnas.map((c) => `t1.${c} = t2.${c}`).join(' AND ');
    const [del] = await pool.query(
        `DELETE t1 FROM ${tabla} t1 JOIN ${tabla} t2 ON ${cond} AND t1.id < t2.id`
    );
    if (del.affectedRows > 0) {
        console.log(`[migracion] ${tabla}: ${del.affectedRows} duplicado(s) eliminados antes de crear ${indexName}`);
    }
    await pool.query(`ALTER TABLE ${tabla} ADD UNIQUE KEY ${indexName} (${columnas.join(', ')})`);
    console.log(`[migracion] ${tabla}.${indexName} (único) creada`);
}

// ---------------------------------------------------------------------------
// Reconciliación del catálogo de materias con la especificación.
// Idempotente. Regla de seguridad: NUNCA se borra una fila que tenga referencias
// (docente asignado, matrículas, notas o asistencia); en ese caso se marca para
// revisión manual. Devuelve un resumen con el diff aplicado.
// ---------------------------------------------------------------------------
async function reconcileMaterias(pool) {
    const esperado = catalogoEsperado();

    const [rows] = await pool.query('SELECT id, nombre, nivel, componente_evaluacion, activo FROM cursos');
    const [refRows] = await pool.query(`
        SELECT c.id,
            (SELECT COUNT(*) FROM curso_docente cd    WHERE cd.curso_id = c.id) docentes,
            (SELECT COUNT(*) FROM estudiante_curso ec WHERE ec.curso_id = c.id) matriculas,
            (SELECT COUNT(*) FROM notas n             WHERE n.curso_id = c.id) notas,
            (SELECT COUNT(*) FROM asistencia a        WHERE a.curso_id = c.id) asistencia
        FROM cursos c`);
    const refs = Object.fromEntries(refRows.map((r) => [r.id, r]));
    const tieneRefs = (id) => {
        const f = refs[id];
        return f && (f.docentes + f.matriculas + f.notas + f.asistencia) > 0;
    };
    const refDetalle = (id) => {
        const f = refs[id] || {};
        return `docentes=${f.docentes || 0} matriculas=${f.matriculas || 0} notas=${f.notas || 0} asistencia=${f.asistencia || 0}`;
    };

    // Agrupar filas reales por (nombre|nivel).
    const grupos = new Map();
    for (const r of rows) {
        const k = `${r.nombre}|${r.nivel}`;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(r);
    }

    const summary = {
        before: rows.length,
        added: [], removedDuplicates: [], removedExtra: [],
        updatedEval: [], reactivated: [], flagged: [],
    };

    // 1) Resolver duplicados: dejar un "keeper" por grupo.
    const keeperPorGrupo = new Map();
    for (const [k, filas] of grupos) {
        if (filas.length === 1) {
            keeperPorGrupo.set(k, filas[0]);
            continue;
        }
        const conRefs = filas.filter((f) => tieneRefs(f.id));
        if (conRefs.length > 1) {
            // Varias copias con datos: no se puede fusionar automáticamente.
            for (const f of filas) summary.flagged.push({ id: f.id, nombre: f.nombre, nivel: f.nivel, reason: 'duplicado con referencias (revisión/fusión manual)', refs: refDetalle(f.id) });
            keeperPorGrupo.set(k, conRefs[0]);
            continue;
        }
        const keeper = conRefs[0] || filas.slice().sort((a, b) => a.id - b.id)[0];
        keeperPorGrupo.set(k, keeper);
        for (const f of filas) {
            if (f.id === keeper.id) continue;
            if (tieneRefs(f.id)) {
                summary.flagged.push({ id: f.id, nombre: f.nombre, nivel: f.nivel, reason: 'duplicado con referencias', refs: refDetalle(f.id) });
            } else {
                await pool.query('DELETE FROM cursos WHERE id = ?', [f.id]);
                summary.removedDuplicates.push({ id: f.id, nombre: f.nombre, nivel: f.nivel });
            }
        }
    }

    // 2) Filas extra (no están en la especificación): reemplazadas, heredadas, etc.
    for (const [k, keeper] of keeperPorGrupo) {
        if (esperado.has(k)) continue;
        if (tieneRefs(keeper.id)) {
            summary.flagged.push({ id: keeper.id, nombre: keeper.nombre, nivel: keeper.nivel, reason: 'fuera de la especificación pero con referencias (revisión manual)', refs: refDetalle(keeper.id) });
        } else {
            await pool.query('DELETE FROM cursos WHERE id = ?', [keeper.id]);
            summary.removedExtra.push({ id: keeper.id, nombre: keeper.nombre, nivel: keeper.nivel });
        }
    }

    // 3) Insertar faltantes y corregir evaluación/activo en las esperadas.
    for (const [k, comp] of esperado) {
        const keeper = keeperPorGrupo.get(k);
        const [nombre, nivel] = k.split('|');
        if (!keeper) {
            await pool.query(
                'INSERT INTO cursos (nombre, nivel, componente_evaluacion, activo) VALUES (?, ?, ?, 1)',
                [nombre, nivel, comp]
            );
            summary.added.push({ nombre, nivel, componente: comp });
            continue;
        }
        if (keeper.componente_evaluacion !== comp) {
            await pool.query('UPDATE cursos SET componente_evaluacion = ? WHERE id = ?', [comp, keeper.id]);
            summary.updatedEval.push({ id: keeper.id, nombre, nivel, from: keeper.componente_evaluacion, to: comp });
        }
        if (!keeper.activo) {
            await pool.query('UPDATE cursos SET activo = 1 WHERE id = ?', [keeper.id]);
            summary.reactivated.push({ id: keeper.id, nombre, nivel });
        }
    }

    const [[{ n: after }]] = await pool.query('SELECT COUNT(*) n FROM cursos');
    summary.after = after;
    return summary;
}

function logResumen(s) {
    console.log('[materias] Reconciliación del catálogo:');
    console.log(`  Total antes: ${s.before}  →  después: ${s.after}`);
    console.log(`  Agregadas: ${s.added.length}  Duplicados borrados: ${s.removedDuplicates.length}  Extra borradas: ${s.removedExtra.length}  Evaluación corregida: ${s.updatedEval.length}  Reactivadas: ${s.reactivated.length}  Marcadas p/ revisión: ${s.flagged.length}`);
    if (s.updatedEval.length) console.log('  Evaluación corregida:', s.updatedEval.map((u) => `${u.nombre} ${u.nivel} ${u.from}→${u.to}`).join('; '));
    if (s.removedExtra.length) console.log('  Extra borradas (sin refs):', s.removedExtra.map((r) => `${r.nombre} ${r.nivel}`).join('; '));
    if (s.flagged.length) {
        console.log('  ⚠ REVISIÓN MANUAL:');
        for (const f of s.flagged) console.log(`    id=${f.id} ${f.nombre} ${f.nivel} — ${f.reason} [${f.refs}]`);
    }
}

async function runMigrations(pool) {
    // Registro de migraciones aplicadas (para no repetir siembras/reconciliaciones).
    await pool.query(
        'CREATE TABLE IF NOT EXISTS migraciones (nombre VARCHAR(100) PRIMARY KEY, aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
    );

    // 1) Columnas nuevas (idempotente por information_schema).
    if (await columnaFalta(pool, 'cursos', 'nivel')) {
        await pool.query('ALTER TABLE cursos ADD COLUMN nivel VARCHAR(20) AFTER descripcion');
        console.log('[migracion] cursos.nivel agregada');
    }
    if (await columnaFalta(pool, 'cursos', 'componente_evaluacion')) {
        await pool.query("ALTER TABLE cursos ADD COLUMN componente_evaluacion ENUM('PROYECTO','PRUEBAS') DEFAULT 'PRUEBAS' AFTER nivel");
        console.log('[migracion] cursos.componente_evaluacion agregada');
    }
    if (await columnaFalta(pool, 'estudiantes', 'nivel')) {
        await pool.query('ALTER TABLE estudiantes ADD COLUMN nivel VARCHAR(20) AFTER email');
        console.log('[migracion] estudiantes.nivel agregada');
    }
    if (await columnaFalta(pool, 'estudiantes', 'padre_id')) {
        await pool.query('ALTER TABLE estudiantes ADD COLUMN padre_id INT NULL AFTER nivel');
        try {
            await pool.query('ALTER TABLE estudiantes ADD CONSTRAINT fk_est_padre FOREIGN KEY (padre_id) REFERENCES usuarios(id) ON DELETE SET NULL');
        } catch (e) {
            console.log('[migracion] estudiantes.padre_id sin FK:', e.message);
        }
        console.log('[migracion] estudiantes.padre_id agregada');
    }

    // Asistencia: modelo de 4 estados + quién registró (Bitácora 06).
    if (await columnaFalta(pool, 'asistencia', 'estado')) {
        await pool.query("ALTER TABLE asistencia ADD COLUMN estado ENUM('presente','ausente','tardia','justificada') NOT NULL DEFAULT 'presente' AFTER fecha");
        // Backfill desde el booleano existente.
        await pool.query("UPDATE asistencia SET estado = IF(presente = 1, 'presente', 'ausente')");
        console.log('[migracion] asistencia.estado agregada y poblada');
    }
    if (await columnaFalta(pool, 'asistencia', 'registrado_por')) {
        await pool.query('ALTER TABLE asistencia ADD COLUMN registrado_por INT NULL AFTER estado');
        // FK opcional; si falla (motor/datos) no bloquea el arranque.
        try {
            await pool.query('ALTER TABLE asistencia ADD CONSTRAINT fk_asis_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL');
        } catch (e) {
            console.log('[migracion] asistencia.registrado_por sin FK:', e.message);
        }
        console.log('[migracion] asistencia.registrado_por agregada');
    }

    // Notas: columnas de período (en bases creadas con el esquema antiguo faltan).
    if (await columnaFalta(pool, 'notas', 'periodo')) {
        await pool.query('ALTER TABLE notas ADD COLUMN periodo VARCHAR(10) NULL AFTER nota');
        console.log('[migracion] notas.periodo agregada');
    }
    if (await columnaFalta(pool, 'notas', 'periodo_id')) {
        await pool.query('ALTER TABLE notas ADD COLUMN periodo_id INT NULL AFTER periodo');
        console.log('[migracion] notas.periodo_id agregada');
    }

    // Claves únicas que hacen que los upsert de notas y asistencia actualicen en
    // lugar de duplicar. (En algunas bases estas claves nunca se crearon.)
    await ensureUniqueKey(pool, 'asistencia', 'uq_asistencia', ['estudiante_id', 'curso_id', 'fecha']);
    await ensureUniqueKey(pool, 'notas', 'uq_nota', ['estudiante_id', 'curso_id', 'periodo_id']);

    // Períodos académicos (en bases creadas con el esquema antiguo puede faltar).
    await pool.query(
        `CREATE TABLE IF NOT EXISTS periodos (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            codigo       VARCHAR(10) NOT NULL,
            nombre       VARCHAR(60) NOT NULL,
            fecha_inicio DATE,
            fecha_fin    DATE,
            estado       ENUM('activo','cerrado') NOT NULL DEFAULT 'activo'
        )`
    );
    const [[{ np }]] = await pool.query('SELECT COUNT(*) np FROM periodos');
    if (np === 0) {
        await pool.query(
            `INSERT INTO periodos (codigo, nombre, fecha_inicio, fecha_fin, estado) VALUES
                ('I','I Trimestre','2026-02-01','2026-04-30','activo'),
                ('II','II Trimestre','2026-05-01','2026-08-31','activo'),
                ('III','III Trimestre','2026-09-01','2026-12-15','activo')`
        );
        console.log('[migracion] períodos sembrados (3 trimestres)');
    }

    // Comunicados: imagen opcional y destinatarios específicos.
    if (await columnaFalta(pool, 'comunicados', 'imagen')) {
        await pool.query('ALTER TABLE comunicados ADD COLUMN imagen LONGTEXT NULL AFTER contenido');
        console.log('[migracion] comunicados.imagen agregada');
    }
    await pool.query(
        `CREATE TABLE IF NOT EXISTS comunicado_destinatario (
            comunicado_id INT NOT NULL,
            padre_id      INT NOT NULL,
            PRIMARY KEY (comunicado_id, padre_id),
            CONSTRAINT fk_cdest_com   FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE,
            CONSTRAINT fk_cdest_padre FOREIGN KEY (padre_id)      REFERENCES usuarios(id)     ON DELETE CASCADE
        )`
    );

    // 2) Sembrar catálogo de materias una sola vez (si aún no hay materias).
    const [applied] = await pool.query('SELECT nombre FROM migraciones WHERE nombre = ?', ['seed_catalogo_materias']);
    if (applied.length === 0) {
        const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM cursos');
        if (n === 0) {
            await pool.query('INSERT INTO cursos (nombre, nivel, componente_evaluacion, activo) VALUES ?', [catalogoSeed()]);
            console.log('[migracion] catálogo de materias sembrado (127)');
        }
        await pool.query('INSERT INTO migraciones (nombre) VALUES (?)', ['seed_catalogo_materias']);
    }

    // 3) Reconciliar el catálogo con la especificación (una sola vez, para no
    //    interferir con materias personalizadas que se creen luego).
    const [rec] = await pool.query('SELECT nombre FROM migraciones WHERE nombre = ?', ['reconcile_catalogo_materias_v1']);
    if (rec.length === 0) {
        const resumen = await reconcileMaterias(pool);
        logResumen(resumen);
        await pool.query('INSERT INTO migraciones (nombre) VALUES (?)', ['reconcile_catalogo_materias_v1']);
    }
}

module.exports = { runMigrations, reconcileMaterias, catalogoEsperado, catalogoSeed, componente };
