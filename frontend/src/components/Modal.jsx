import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, footer, className = '', size = '' }) {
    const modalRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Focus trap: focus the modal when it opens
    useEffect(() => {
        if (open && modalRef.current) {
            modalRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal ${size ? `modal-${size}` : ''} ${className}`.trim()}
                onClick={e => e.stopPropagation()}
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
