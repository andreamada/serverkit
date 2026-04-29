import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const DURATION = 5000;

const TYPE_CONFIG = {
    success: {
        Icon: CheckCircle,
        iconColor: '#22c55e',
        barColor: '#22c55e',
        borderColor: 'rgba(34,197,94,0.35)',
        bgColor: 'rgba(34,197,94,0.08)',
    },
    error: {
        Icon: XCircle,
        iconColor: '#ef4444',
        barColor: '#ef4444',
        borderColor: 'rgba(239,68,68,0.35)',
        bgColor: 'rgba(239,68,68,0.08)',
    },
    warning: {
        Icon: AlertTriangle,
        iconColor: '#f59e0b',
        barColor: '#f59e0b',
        borderColor: 'rgba(245,158,11,0.35)',
        bgColor: 'rgba(245,158,11,0.08)',
    },
    info: {
        Icon: Info,
        iconColor: 'hsl(var(--accent-primary, 224 30% 8%))',
        barColor: 'var(--accent-primary, #6366f1)',
        borderColor: 'rgba(99,102,241,0.35)',
        bgColor: 'rgba(99,102,241,0.08)',
    },
};

function ToastItem({ toast, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
    const { Icon } = cfg;

    useEffect(() => {
        const enterTimer = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(enterTimer);
    }, []);

    useEffect(() => {
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const elapsed = now - start;
            const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
            setProgress(pct);
            if (pct > 0) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '10px',
                border: `1px solid ${cfg.borderColor}`,
                background: `hsl(var(--card, 0 0% 100%))`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                pointerEvents: 'auto',
                width: '360px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0) scale(1)' : 'translateX(24px) scale(0.97)',
                transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 14px 11px' }}>
                {/* Icon */}
                <span style={{ flexShrink: 0, marginTop: '1px', color: cfg.iconColor }}>
                    <Icon size={17} strokeWidth={2.2} />
                </span>
                {/* Message */}
                <span style={{
                    flex: 1,
                    fontSize: '13px',
                    lineHeight: '1.45',
                    color: 'hsl(var(--popover-foreground))',
                    fontWeight: 450,
                }}>
                    {toast.message}
                </span>
                {/* Dismiss */}
                <button
                    onClick={() => onDismiss(toast.id)}
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                        transition: 'background 0.15s, color 0.15s',
                        marginTop: '-1px',
                        padding: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--accent))'; e.currentTarget.style.color = 'hsl(var(--popover-foreground))'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                >
                    <X size={13} strokeWidth={2.2} />
                </button>
            </div>
            {/* Progress bar */}
            <div style={{ height: '3px', background: 'hsl(var(--border))', borderRadius: '0 0 10px 10px' }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: cfg.barColor,
                    borderRadius: '0 0 10px 10px',
                    transition: 'width 0.1s linear',
                }} />
            </div>
        </div>
    );
}

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
        }}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>,
        document.body
    );
}

export default ToastContainer;
