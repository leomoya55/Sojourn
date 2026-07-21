import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Tabla reutilizable con paginación básica (Bitácora 05).
// Props:
//   columns   — array de encabezados (strings)
//   rows      — array de datos
//   renderRow — (fila, indice) => <tr>...</tr>
//   pageSize  — filas por página (por defecto 8)
//   emptyText — texto cuando no hay datos
const Table = ({ columns, rows, renderRow, pageSize = 8, emptyText = 'No hay registros.' }) => {
    const [page, setPage] = useState(0);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

    // Si cambia el conjunto de datos y la página queda fuera de rango, se corrige.
    useEffect(() => {
        if (page > totalPages - 1) setPage(0);
    }, [rows, totalPages, page]);

    const slice = rows.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <>
            <div className="scs-table-wrap">
                <table className="scs-table">
                    <thead>
                        <tr>
                            {columns.map((c) => (
                                <th key={c}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <p className="scs-empty" style={{ padding: '20px 0' }}>{emptyText}</p>
                                </td>
                            </tr>
                        ) : (
                            slice.map((fila, i) => renderRow(fila, page * pageSize + i))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 10,
                        marginTop: 14,
                        fontSize: 13,
                        color: 'var(--scs-muted)',
                    }}
                >
                    <span>Página {page + 1} de {totalPages}</span>
                    <button
                        className="scs-icon-btn"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        className="scs-icon-btn"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </>
    );
};

export default Table;
