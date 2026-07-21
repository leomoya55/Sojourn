import React from 'react';

// Input reutilizable con label y mensaje de error (Bitácora 05).
// Soporta input, select y textarea mediante la prop `as`.
const FormInput = ({ label, error, as = 'input', children, ...props }) => {
    const cls = `scs-input ${error ? 'error' : ''}`;
    return (
        <label className="scs-field">
            {label && <span className="scs-label">{label}</span>}
            {as === 'select' ? (
                <select className={cls} {...props}>
                    {children}
                </select>
            ) : as === 'textarea' ? (
                <textarea className={cls} {...props} />
            ) : (
                <input className={cls} {...props} />
            )}
            {error && <span className="scs-field-msg">{error}</span>}
        </label>
    );
};

export default FormInput;
