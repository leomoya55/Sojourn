import React from 'react';
import { X } from 'lucide-react';

// Contenedor modal genérico reutilizable (Bitácora 05).
// Header navy, cierre con la X y clic fuera para cerrar.
const Modal = ({ titulo, onClose, children, maxWidth }) => (
    <div className="scs-overlay" onClick={onClose}>
        <div
            className="scs-modal"
            style={maxWidth ? { maxWidth } : undefined}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="scs-modal-head">
                <h2>{titulo}</h2>
                <button className="scs-modal-close" onClick={onClose} aria-label="Cerrar">
                    <X size={20} />
                </button>
            </div>
            <div className="scs-modal-body">{children}</div>
        </div>
    </div>
);

export default Modal;
