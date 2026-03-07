import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getServiceType, getStatusConfig, formatRelativeTime } from '../utils/serviceTypes';

const SERVICE_TYPE_OPTIONS = ['all', 'docker', 'flask', 'django', 'php', 'static', 'wordpress'];
const STATUS_OPTIONS = ['all', 'running', 'stopped'];

const Services = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadApps();
    }, []);

    async function loadApps() {
        try {
            const data = await api.getApps();
            setApps(data.apps || []);
        } catch (err) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(e, appId, action) {
        e.stopPropagation();
        setActionLoading(`${appId}-${action}`);
        try {
            if (action === 'start') await api.startApp(appId);
            else if (action === 'stop') await api.stopApp(appId);
            else if (action === 'restart') await api.restartApp(appId);
            await loadApps();
        } catch (err) {
            toast.error(`Failed to ${action} service`);
        } finally {
            setActionLoading(null);
        }
    }

    const filteredApps = useMemo(() => {
        return apps.filter(app => {
            if (searchTerm && !app.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (typeFilter !== 'all' && app.app_type !== typeFilter) {
                return false;
            }
            if (statusFilter !== 'all' && app.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [apps, searchTerm, typeFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: apps.length,
        running: apps.filter(a => a.status === 'running').length,
        stopped: apps.filter(a => a.status !== 'running').length,
    }), [apps]);

    if (loading) {
        return <div className="loading">Loading services...</div>;
    }

    return (
        <div className="services-page">
            <div className="services-page__header">
                <div>
                    <h1>Services</h1>
                    <p className="services-page__subtitle">
                        {stats.total} services &middot; {stats.running} live
                    </p>
                </div>
                <Link to="/templates" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Service
                </Link>
            </div>

            <div className="services-page__filters">
                <div className="services-page__search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="services-page__filter-select"
                >
                    {SERVICE_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                            {opt === 'all' ? 'All Types' : getServiceType(opt).label}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="services-page__filter-select"
                >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                            {opt === 'all' ? 'All Status' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {filteredApps.length === 0 ? (
                <div className="services-page__empty">
                    <div className="services-page__empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                    </div>
                    <h3>No services found</h3>
                    <p>{searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Deploy your first service to get started'}</p>
                    {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                        <Link to="/templates" className="btn btn-primary">Create Service</Link>
                    )}
                </div>
            ) : (
                <div className="services-page__list">
                    {filteredApps.map(app => {
                        const typeInfo = getServiceType(app.app_type);
                        const statusInfo = getStatusConfig(app.status);
                        const isRunning = app.status === 'running';

                        return (
                            <div
                                key={app.id}
                                className="services-page__row"
                                onClick={() => {
                                    if (app.app_type === 'wordpress') {
                                        navigate(`/wordpress/${app.id}`);
                                    } else {
                                        navigate(`/services/${app.id}`);
                                    }
                                }}
                            >
                                <div className="services-page__row-main">
                                    <div
                                        className="services-page__type-icon"
                                        style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color }}
                                    >
                                        <ServiceTypeIcon type={app.app_type} />
                                    </div>
                                    <div className="services-page__row-info">
                                        <div className="services-page__row-name">
                                            {app.name}
                                        </div>
                                        <div className="services-page__row-meta">
                                            <span
                                                className="services-page__type-badge"
                                                style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color, borderColor: typeInfo.borderColor }}
                                            >
                                                {typeInfo.label}
                                            </span>
                                            {app.domain && (
                                                <span className="services-page__domain">{app.domain}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="services-page__row-right">
                                    <div className={`services-page__status services-page__status--${statusInfo.dotClass}`}>
                                        <span className="services-page__status-dot" />
                                        {statusInfo.label}
                                    </div>

                                    {app.deploy_repo_url && (
                                        <div className="services-page__repo-pill">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="18" cy="18" r="3"/>
                                                <circle cx="6" cy="6" r="3"/>
                                                <path d="M6 21V9a9 9 0 0 0 9 9"/>
                                            </svg>
                                            {extractRepoName(app.deploy_repo_url)}
                                        </div>
                                    )}

                                    {app.last_deploy_at && (
                                        <span className="services-page__last-deploy">
                                            {formatRelativeTime(app.last_deploy_at)}
                                        </span>
                                    )}

                                    <div className="services-page__actions" onClick={e => e.stopPropagation()}>
                                        {isRunning ? (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => handleAction(e, app.id, 'restart')}
                                                disabled={actionLoading === `${app.id}-restart`}
                                                title="Restart"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="23 4 23 10 17 10"/>
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => handleAction(e, app.id, 'start')}
                                                disabled={actionLoading === `${app.id}-start`}
                                                title="Start"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function ServiceTypeIcon({ type }) {
    switch (type) {
        case 'docker':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"/>
                </svg>
            );
        case 'flask':
        case 'django':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
            );
        case 'php':
            return <span style={{ fontSize: '12px', fontWeight: 700 }}>PHP</span>;
        case 'static':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                </svg>
            );
        case 'wordpress':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/>
                </svg>
            );
        default:
            return <span style={{ fontSize: '12px', fontWeight: 700 }}>{type?.charAt(0).toUpperCase()}</span>;
    }
}

function extractRepoName(url) {
    if (!url) return '';
    try {
        const cleaned = url.replace(/\.git$/, '');
        const parts = cleaned.split('/');
        return parts.slice(-2).join('/');
    } catch {
        return url;
    }
}

export default Services;
