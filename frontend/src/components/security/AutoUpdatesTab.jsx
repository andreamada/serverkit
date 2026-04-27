import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AutoUpdatesTab = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await api.getAutoUpdatesStatus();
            setStatus(data);
        } catch (error) {
            console.error('Failed to load auto-updates status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async () => {
        setActionLoading(true);
        try {
            await api.installAutoUpdates();
            toast.success('Auto-updates package installed');
            await loadStatus();
        } catch (error) {
            toast.error(`Failed to install: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEnable = async () => {
        setActionLoading(true);
        try {
            await api.enableAutoUpdates();
            toast.success('Automatic updates enabled');
            await loadStatus();
        } catch (error) {
            toast.error(`Failed to enable: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisable = async () => {
        setActionLoading(true);
        try {
            await api.disableAutoUpdates();
            toast.success('Automatic updates disabled');
            await loadStatus();
        } catch (error) {
            toast.error(`Failed to disable: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-sm">Loading auto-updates status...</div>;
    }

    if (!status?.supported) {
        return (
            <div className="auto-updates-tab">
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h3>Not Supported</h3>
                    <p>Automatic security updates are not supported on this system.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auto-updates-tab">
            <div className="card">
                <div className="card-header">
                    <h3>Automatic Security Updates</h3>
                    <button className="btn btn-sm btn-secondary" onClick={loadStatus}>Refresh</button>
                </div>
                <div className="card-body">
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Package</span>
                            <span className="info-value">{status.package}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Installed</span>
                            <span className={`badge ${status.installed ? 'badge-success' : 'badge-warning'}`}>
                                {status.installed ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Status</span>
                            <span className={`badge ${status.enabled ? 'badge-success' : 'badge-secondary'}`}>
                                {status.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    <div className="auto-updates-actions" style={{ marginTop: '1.5rem' }}>
                        {!status.installed ? (
                            <button className="btn btn-primary" onClick={handleInstall} disabled={actionLoading}>
                                {actionLoading ? 'Installing...' : 'Install Auto-Updates'}
                            </button>
                        ) : status.enabled ? (
                            <button className="btn btn-warning" onClick={handleDisable} disabled={actionLoading}>
                                {actionLoading ? 'Disabling...' : 'Disable Auto-Updates'}
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={handleEnable} disabled={actionLoading}>
                                {actionLoading ? 'Enabling...' : 'Enable Auto-Updates'}
                            </button>
                        )}
                    </div>

                    <div className="help-text" style={{ marginTop: '1.5rem' }}>
                        <p>
                            <strong>What are automatic security updates?</strong><br/>
                            When enabled, your server will automatically download and install security updates,
                            helping protect against known vulnerabilities without manual intervention.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoUpdatesTab;
