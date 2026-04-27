import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';

const AgentPlugins = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const [plugins, setPlugins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [servers, setServers] = useState([]);
    const [filter, setFilter] = useState('all');

    const [newPlugin, setNewPlugin] = useState({
        name: '', display_name: '', version: '1.0.0', description: '',
        author: '', capabilities: [], permissions: [],
        max_memory_mb: 128, max_cpu_percent: 10
    });

    const loadPlugins = useCallback(async () => {
        try {
            const data = await api.getAgentPlugins();
            setPlugins(data.plugins || []);
        } catch (err) {
            toast.error('Failed to load plugins');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadPlugins();
        api.getServers().then(data => setServers(data.servers || [])).catch(() => {});
    }, [loadPlugins]);

    const handleCreate = async () => {
        try {
            await api.createAgentPlugin(newPlugin);
            toast.success('Plugin registered');
            setShowCreateModal(false);
            setNewPlugin({ name: '', display_name: '', version: '1.0.0', description: '', author: '', capabilities: [], permissions: [], max_memory_mb: 128, max_cpu_percent: 10 });
            loadPlugins();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteAgentPlugin(id);
            toast.success('Plugin deleted');
            setDeleteConfirm(null);
            loadPlugins();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleInstall = async (pluginId, serverId) => {
        try {
            await api.installAgentPlugin(pluginId, serverId);
            toast.success('Plugin installation initiated');
            setShowInstallModal(false);
            loadPlugins();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleCapability = (cap) => {
        setNewPlugin(prev => ({
            ...prev,
            capabilities: prev.capabilities.includes(cap)
                ? prev.capabilities.filter(c => c !== cap)
                : [...prev.capabilities, cap]
        }));
    };

    const togglePermission = (perm) => {
        setNewPlugin(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const filteredPlugins = filter === 'all' ? plugins
        : plugins.filter(p => p.status === filter);

    const capabilityLabels = {
        metrics: 'Custom Metrics',
        health_checks: 'Health Checks',
        commands: 'Custom Commands',
        scheduled_tasks: 'Scheduled Tasks',
        event_hooks: 'Event Hooks'
    };

    const permissionLabels = {
        filesystem: 'Filesystem',
        network: 'Network',
        docker: 'Docker',
        process: 'Process',
        system: 'System'
    };

    if (loading) return <Spinner />;

    return (
        <div className="agent-plugins-page">
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Agent Plugins</h1>
                    <p className="page-description">{plugins.length} plugin{plugins.length !== 1 ? 's' : ''} registered</p>
                </div>
                <div className="page-header-actions">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select">
                        <option value="all">All Plugins</option>
                        <option value="available">Available</option>
                        <option value="deprecated">Deprecated</option>
                    </select>
                    {user?.is_admin && (
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            Register Plugin
                        </button>
                    )}
                </div>
            </div>

            <div className="plugins-grid">
                {filteredPlugins.map(plugin => (
                    <div key={plugin.id} className="plugin-card card">
                        <div className="plugin-card__header">
                            <div className="plugin-card__info">
                                <h3>{plugin.display_name}</h3>
                                <span className="plugin-card__version">v{plugin.version}</span>
                            </div>
                            <span className={`badge badge--${plugin.status === 'available' ? 'success' : 'warning'}`}>
                                {plugin.status}
                            </span>
                        </div>
                        {plugin.description && (
                            <p className="plugin-card__desc">{plugin.description}</p>
                        )}
                        <div className="plugin-card__meta">
                            {plugin.author && <span>By {plugin.author}</span>}
                            <span>{plugin.install_count} installation{plugin.install_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="plugin-card__capabilities">
                            {(plugin.capabilities || []).map(cap => (
                                <span key={cap} className="badge badge--outline">{capabilityLabels[cap] || cap}</span>
                            ))}
                        </div>
                        <div className="plugin-card__permissions">
                            {(plugin.permissions || []).map(perm => (
                                <span key={perm} className="badge badge--subtle">{permissionLabels[perm] || perm}</span>
                            ))}
                        </div>
                        <div className="plugin-card__actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { setSelectedPlugin(plugin); setShowInstallModal(true); }}>
                                Install
                            </button>
                            {user?.is_admin && (
                                <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(plugin)}>
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filteredPlugins.length === 0 && (
                    <div className="empty-state">
                        <p>No plugins found. Register a plugin to extend agent capabilities.</p>
                    </div>
                )}
            </div>

            {/* Create Plugin Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Register Plugin</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Plugin Name (identifier)</label>
                                <input className="form-input" value={newPlugin.name} onChange={e => setNewPlugin({...newPlugin, name: e.target.value})} placeholder="my-plugin" />
                            </div>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input className="form-input" value={newPlugin.display_name} onChange={e => setNewPlugin({...newPlugin, display_name: e.target.value})} placeholder="My Plugin" />
                            </div>
                            <div className="form-group">
                                <label>Version</label>
                                <input className="form-input" value={newPlugin.version} onChange={e => setNewPlugin({...newPlugin, version: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-input" value={newPlugin.description} onChange={e => setNewPlugin({...newPlugin, description: e.target.value})} rows={3} />
                            </div>
                            <div className="form-group">
                                <label>Author</label>
                                <input className="form-input" value={newPlugin.author} onChange={e => setNewPlugin({...newPlugin, author: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Capabilities</label>
                                <div className="checkbox-group">
                                    {Object.entries(capabilityLabels).map(([key, label]) => (
                                        <label key={key} className="checkbox-label">
                                            <input type="checkbox" checked={newPlugin.capabilities.includes(key)} onChange={() => toggleCapability(key)} />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Permissions</label>
                                <div className="checkbox-group">
                                    {Object.entries(permissionLabels).map(([key, label]) => (
                                        <label key={key} className="checkbox-label">
                                            <input type="checkbox" checked={newPlugin.permissions.includes(key)} onChange={() => togglePermission(key)} />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Max Memory (MB)</label>
                                    <input className="form-input" type="number" value={newPlugin.max_memory_mb} onChange={e => setNewPlugin({...newPlugin, max_memory_mb: parseInt(e.target.value) || 128})} />
                                </div>
                                <div className="form-group">
                                    <label>Max CPU (%)</label>
                                    <input className="form-input" type="number" value={newPlugin.max_cpu_percent} onChange={e => setNewPlugin({...newPlugin, max_cpu_percent: parseInt(e.target.value) || 10})} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={!newPlugin.name || !newPlugin.display_name}>Register</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Install Plugin Modal */}
            {showInstallModal && selectedPlugin && (
                <div className="modal-overlay" onClick={() => setShowInstallModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Install {selectedPlugin.display_name}</h2>
                            <button className="modal-close" onClick={() => setShowInstallModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Select a server to install this plugin on:</p>
                            <div className="server-select-list">
                                {servers.map(server => (
                                    <div key={server.id} className="server-select-item" onClick={() => handleInstall(selectedPlugin.id, server.id)}>
                                        <span className={`status-dot status-dot--${server.status === 'online' ? 'success' : 'danger'}`} />
                                        <span>{server.name}</span>
                                        <span className="text-muted">{server.hostname}</span>
                                    </div>
                                ))}
                                {servers.length === 0 && <p className="text-muted">No servers available</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    title="Delete Plugin"
                    message={`Delete "${deleteConfirm.display_name}"? This cannot be undone.`}
                    onConfirm={() => handleDelete(deleteConfirm.id)}
                    onCancel={() => setDeleteConfirm(null)}
                    variant="danger"
                />
            )}
        </div>
    );
};

export default AgentPlugins;
