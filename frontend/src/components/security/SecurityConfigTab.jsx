import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SecurityConfigTab = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        try {
            const data = await api.getSecurityConfig();
            setConfig(data);
        } catch (err) {
            console.error('Failed to load security config:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        try {
            await api.updateSecurityConfig(config);
            setMessage({ type: 'success', text: 'Settings saved' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    }

    function updateConfig(section, key, value) {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    }

    if (loading) {
        return <div className="loading-sm">Loading settings...</div>;
    }

    return (
        <div className="settings-tab">
            {message && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3>ClamAV Settings</h3>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Enable ClamAV scanning</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.clamav?.enabled || false}
                                    onChange={(e) => updateConfig('clamav', 'enabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Scan files on upload</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.clamav?.scan_on_upload || false}
                                    onChange={(e) => updateConfig('clamav', 'scan_on_upload', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Quarantine Path</label>
                        <input
                            type="text"
                            value={config?.clamav?.quarantine_path || '/var/quarantine'}
                            onChange={(e) => updateConfig('clamav', 'quarantine_path', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>File Integrity Settings</h3>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Enable file integrity monitoring</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.file_integrity?.enabled || false}
                                    onChange={(e) => updateConfig('file_integrity', 'enabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Alert on file changes</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.file_integrity?.alert_on_change || false}
                                    onChange={(e) => updateConfig('file_integrity', 'alert_on_change', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Notification Settings</h3>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Notify on malware detection</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.notifications?.on_malware_found || false}
                                    onChange={(e) => updateConfig('notifications', 'on_malware_found', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Notify on integrity changes</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.notifications?.on_integrity_change || false}
                                    onChange={(e) => updateConfig('notifications', 'on_integrity_change', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="toggle-switch-label">
                            <span>Notify on suspicious activity</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={config?.notifications?.on_suspicious_activity || false}
                                    onChange={(e) => updateConfig('notifications', 'on_suspicious_activity', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </label>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default SecurityConfigTab;
