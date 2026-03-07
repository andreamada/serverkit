import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LogsTab = ({ app }) => {
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const isDockerApp = app.app_type === 'docker';
    const isPythonApp = ['flask', 'django'].includes(app.app_type);

    useEffect(() => {
        loadLogs();
    }, [app.id]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(loadLogs, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, app.id]);

    async function loadLogs() {
        try {
            let data;
            if (isDockerApp) {
                data = await api.getDockerAppLogs(app.id, 200);
            } else if (isPythonApp) {
                data = await api.getPythonAppLogs(app.id, 200);
            } else {
                data = { logs: 'Logs not available for this app type.' };
            }
            setLogs(data.logs || 'No logs available');
        } catch (err) {
            console.error('Failed to load logs:', err);
            setLogs('Failed to load logs');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="logs-tab">
            <div className="logs-header">
                <h3>Application Logs</h3>
                <div className="logs-controls">
                    {isPythonApp && <span className="hint">Gunicorn/systemd Logs</span>}
                    {isDockerApp && <span className="hint">Docker Compose Logs</span>}
                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={loadLogs}>
                        Refresh
                    </button>
                </div>
            </div>
            <pre className="log-viewer">{loading ? 'Loading...' : logs}</pre>
        </div>
    );
};

export default LogsTab;
