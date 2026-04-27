import React from 'react';

const STATUS_MAP = {
    online: { label: 'Online', className: 'status-badge--success' },
    running: { label: 'Running', className: 'status-badge--success' },
    healthy: { label: 'Healthy', className: 'status-badge--success' },
    active: { label: 'Active', className: 'status-badge--success' },
    connected: { label: 'Connected', className: 'status-badge--success' },
    offline: { label: 'Offline', className: 'status-badge--danger' },
    stopped: { label: 'Stopped', className: 'status-badge--danger' },
    error: { label: 'Error', className: 'status-badge--danger' },
    failed: { label: 'Failed', className: 'status-badge--danger' },
    disconnected: { label: 'Disconnected', className: 'status-badge--danger' },
    warning: { label: 'Warning', className: 'status-badge--warning' },
    degraded: { label: 'Degraded', className: 'status-badge--warning' },
    pending: { label: 'Pending', className: 'status-badge--info' },
    building: { label: 'Building', className: 'status-badge--info' },
    deploying: { label: 'Deploying', className: 'status-badge--info' },
    paused: { label: 'Paused', className: 'status-badge--muted' },
    unknown: { label: 'Unknown', className: 'status-badge--muted' },
};

export default function StatusBadge({ status, label, className = '' }) {
    const mapped = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.unknown;
    const displayLabel = label || mapped.label || status;

    return (
        <span className={`status-badge ${mapped.className} ${className}`.trim()}>
            <span className="status-badge__dot" />
            {displayLabel}
        </span>
    );
}
