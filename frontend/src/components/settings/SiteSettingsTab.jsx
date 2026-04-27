import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SiteSettingsTab = ({ onDevModeChange }) => {
    const [settings, setSettings] = useState({
        registration_enabled: false,
        dev_mode: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await api.getSystemSettings();
            setSettings({
                registration_enabled: data.registration_enabled || false,
                dev_mode: data.dev_mode || false
            });
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleSetting(key, label) {
        setSaving(true);
        setMessage(null);

        try {
            const newValue = !settings[key];
            await api.updateSystemSetting(key, newValue);
            setSettings({ ...settings, [key]: newValue });
            setMessage({ type: 'success', text: `${label} ${newValue ? 'enabled' : 'disabled'}` });
            if (key === 'dev_mode' && onDevModeChange) {
                onDevModeChange(newValue);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update setting' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="settings-section"><p>Loading...</p></div>;
    }

    return (
        <div className="settings-section">
            <h2>Site Settings</h2>
            <p className="section-description">Configure global site settings</p>

            {message && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="settings-card">
                <h3>User Registration</h3>
                <p>Allow new users to create accounts on the login page.</p>

                <div className="form-group">
                    <label className="toggle-switch-label">
                        <span>Enable public registration</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.registration_enabled}
                                onChange={() => handleToggleSetting('registration_enabled', 'User registration')}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </label>
                    <span className="form-help">
                        When disabled, only administrators can create new user accounts.
                    </span>
                </div>
            </div>

            <div className="settings-card">
                <h3>Developer Mode</h3>
                <p>Enable developer tools and diagnostics.</p>

                <div className="form-group">
                    <label className="toggle-switch-label">
                        <span>Enable developer mode</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.dev_mode}
                                onChange={() => handleToggleSetting('dev_mode', 'Developer mode')}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </label>
                    <span className="form-help">
                        Enables the Developer tab with icon reference and diagnostic tools.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SiteSettingsTab;
