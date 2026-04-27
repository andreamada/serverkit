import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDeployments } from '../../hooks/useDeployments';
import { getDeployStatus, formatRelativeTime, formatDuration } from '../../utils/serviceTypes';

const OverviewTab = ({ app, deployConfig }) => {
    const [metrics, setMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const { deployments, loading: deploymentsLoading } = useDeployments(app.id);

    const isDocker = app.app_type === 'docker';
    const isPython = ['flask', 'django'].includes(app.app_type);

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 10000);
        return () => clearInterval(interval);
    }, [app.id]);

    async function loadMetrics() {
        try {
            if (isDocker) {
                const data = await api.getContainers(true);
                const appContainers = (data.containers || []).filter(c =>
                    c.Names?.some(n => n.includes(app.name)) ||
                    c.Labels?.['com.docker.compose.project'] === app.name
                );
                if (appContainers.length > 0) {
                    const containerStats = await api.getContainerStats(appContainers[0].Id);
                    setMetrics({
                        cpu: parseFloat(containerStats.cpu_percent || containerStats.CPUPerc || 0),
                        memory: parseFloat(containerStats.memory_percent || containerStats.MemPerc || 0),
                        memUsage: containerStats.memory_usage || containerStats.MemUsage || 'N/A',
                        netIO: containerStats.net_io || containerStats.NetIO || 'N/A',
                        pids: containerStats.pids || containerStats.PIDs || 'N/A',
                    });
                }
            } else if (isPython) {
                const data = await api.getPythonAppStatus(app.id);
                setMetrics({
                    active: data.active,
                    pid: data.pid,
                    memory: data.memory,
                    uptime: data.uptime,
                    workers: data.workers,
                });
            }
        } catch (err) {
            console.error('Failed to load metrics:', err);
        } finally {
            setMetricsLoading(false);
        }
    }

    const successfulDeploys = deployments.filter(d => d.status === 'success');
    const failedDeploys = deployments.filter(d => d.status === 'failed');

    function getBarColor(percent) {
        if (percent > 80) return 'var(--danger, #ef4444)';
        if (percent > 60) return 'var(--warning, #f59e0b)';
        return 'var(--success, #10b981)';
    }

    return (
        <div className="overview-tab">
            {/* Quick Stats Row */}
            <div className="overview-tab__stats-row">
                <div className="overview-tab__stat-card">
                    <div className="overview-tab__stat-icon overview-tab__stat-icon--status">
                        <span className={`overview-tab__pulse overview-tab__pulse--${app.isRunning ? 'live' : 'stopped'}`} />
                    </div>
                    <div className="overview-tab__stat-info">
                        <span className="overview-tab__stat-value">{app.isRunning ? 'Live' : 'Stopped'}</span>
                        <span className="overview-tab__stat-label">Status</span>
                    </div>
                </div>

                <div className="overview-tab__stat-card">
                    <div className="overview-tab__stat-icon overview-tab__stat-icon--deploys">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                    </div>
                    <div className="overview-tab__stat-info">
                        <span className="overview-tab__stat-value">{deployments.length}</span>
                        <span className="overview-tab__stat-label">Total Deploys</span>
                    </div>
                </div>

                <div className="overview-tab__stat-card">
                    <div className="overview-tab__stat-icon overview-tab__stat-icon--success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div className="overview-tab__stat-info">
                        <span className="overview-tab__stat-value">{successfulDeploys.length}</span>
                        <span className="overview-tab__stat-label">Successful</span>
                    </div>
                </div>

                <div className="overview-tab__stat-card">
                    <div className="overview-tab__stat-icon overview-tab__stat-icon--failed">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                    <div className="overview-tab__stat-info">
                        <span className="overview-tab__stat-value">{failedDeploys.length}</span>
                        <span className="overview-tab__stat-label">Failed</span>
                    </div>
                </div>
            </div>

            <div className="overview-tab__grid">
                {/* Service Info Card */}
                <div className="overview-tab__card">
                    <h3 className="overview-tab__card-title">Service Info</h3>
                    <div className="overview-tab__info-list">
                        <div className="overview-tab__info-row">
                            <span className="overview-tab__info-label">Type</span>
                            <span
                                className="overview-tab__info-badge"
                                style={{ backgroundColor: app.typeInfo.bgColor, color: app.typeInfo.color, borderColor: app.typeInfo.borderColor }}
                            >
                                {app.typeInfo.label}
                            </span>
                        </div>
                        {app.domain && (
                            <div className="overview-tab__info-row">
                                <span className="overview-tab__info-label">Domain</span>
                                <a
                                    href={`https://${app.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="overview-tab__info-link"
                                >
                                    {app.domain}
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/>
                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                </a>
                            </div>
                        )}
                        {app.port && (
                            <div className="overview-tab__info-row">
                                <span className="overview-tab__info-label">Port</span>
                                <span className="overview-tab__info-value mono">{app.port}</span>
                            </div>
                        )}
                        <div className="overview-tab__info-row">
                            <span className="overview-tab__info-label">Created</span>
                            <span className="overview-tab__info-value">
                                {new Date(app.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </span>
                        </div>
                        {deployConfig && (
                            <div className="overview-tab__info-row">
                                <span className="overview-tab__info-label">Repository</span>
                                <span className="overview-tab__info-value mono">
                                    {extractRepoDisplay(deployConfig.repo_url)}
                                    <span className="overview-tab__branch">{deployConfig.branch || 'main'}</span>
                                </span>
                            </div>
                        )}
                        {app.environment_type && app.environment_type !== 'standalone' && (
                            <div className="overview-tab__info-row">
                                <span className="overview-tab__info-label">Environment</span>
                                <span className={`overview-tab__env-badge overview-tab__env-badge--${app.environment_type}`}>
                                    {app.environment_type}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resource Usage Card */}
                <div className="overview-tab__card">
                    <h3 className="overview-tab__card-title">Resource Usage</h3>
                    {metricsLoading ? (
                        <div className="overview-tab__loading">Loading metrics...</div>
                    ) : isDocker && metrics ? (
                        <div className="overview-tab__metrics">
                            <div className="overview-tab__metric">
                                <div className="overview-tab__metric-header">
                                    <span>CPU</span>
                                    <span className="overview-tab__metric-value">{metrics.cpu.toFixed(1)}%</span>
                                </div>
                                <div className="overview-tab__metric-bar">
                                    <div
                                        className="overview-tab__metric-bar-fill"
                                        style={{ width: `${Math.min(metrics.cpu, 100)}%`, backgroundColor: getBarColor(metrics.cpu) }}
                                    />
                                </div>
                            </div>
                            <div className="overview-tab__metric">
                                <div className="overview-tab__metric-header">
                                    <span>Memory</span>
                                    <span className="overview-tab__metric-value">{metrics.memory.toFixed(1)}%</span>
                                </div>
                                <div className="overview-tab__metric-bar">
                                    <div
                                        className="overview-tab__metric-bar-fill"
                                        style={{ width: `${Math.min(metrics.memory, 100)}%`, backgroundColor: getBarColor(metrics.memory) }}
                                    />
                                </div>
                                <span className="overview-tab__metric-detail">{metrics.memUsage}</span>
                            </div>
                            <div className="overview-tab__metric-row">
                                <div className="overview-tab__metric-item">
                                    <span className="overview-tab__metric-item-label">Network I/O</span>
                                    <span className="overview-tab__metric-item-value">{metrics.netIO}</span>
                                </div>
                                <div className="overview-tab__metric-item">
                                    <span className="overview-tab__metric-item-label">Processes</span>
                                    <span className="overview-tab__metric-item-value">{metrics.pids}</span>
                                </div>
                            </div>
                        </div>
                    ) : isPython && metrics ? (
                        <div className="overview-tab__metrics">
                            <div className="overview-tab__metric-row">
                                <div className="overview-tab__metric-item">
                                    <span className="overview-tab__metric-item-label">Status</span>
                                    <span className="overview-tab__metric-item-value">
                                        {metrics.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {metrics.pid && (
                                    <div className="overview-tab__metric-item">
                                        <span className="overview-tab__metric-item-label">PID</span>
                                        <span className="overview-tab__metric-item-value mono">{metrics.pid}</span>
                                    </div>
                                )}
                            </div>
                            {metrics.memory && (
                                <div className="overview-tab__metric-row">
                                    <div className="overview-tab__metric-item">
                                        <span className="overview-tab__metric-item-label">Memory</span>
                                        <span className="overview-tab__metric-item-value">{metrics.memory}</span>
                                    </div>
                                    {metrics.workers && (
                                        <div className="overview-tab__metric-item">
                                            <span className="overview-tab__metric-item-label">Workers</span>
                                            <span className="overview-tab__metric-item-value">{metrics.workers}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {metrics.uptime && (
                                <div className="overview-tab__metric-row">
                                    <div className="overview-tab__metric-item">
                                        <span className="overview-tab__metric-item-label">Uptime</span>
                                        <span className="overview-tab__metric-item-value">{metrics.uptime}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overview-tab__no-metrics">
                            <p>{app.isRunning ? 'No metrics available for this service type.' : 'Start the service to view metrics.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Deployments */}
            <div className="overview-tab__card overview-tab__card--full">
                <div className="overview-tab__card-header-row">
                    <h3 className="overview-tab__card-title">Recent Deployments</h3>
                    {deployments.length > 3 && (
                        <span className="overview-tab__see-all">
                            {deployments.length} total
                        </span>
                    )}
                </div>
                {deploymentsLoading ? (
                    <div className="overview-tab__loading">Loading...</div>
                ) : deployments.length === 0 ? (
                    <div className="overview-tab__no-deploys">
                        <p>No deployments yet. Deploy your service to see history here.</p>
                    </div>
                ) : (
                    <div className="overview-tab__deploy-list">
                        {deployments.slice(0, 5).map((deploy, idx) => {
                            const statusInfo = getDeployStatus(deploy.status);
                            const isLatest = idx === 0 && deploy.status === 'success';
                            return (
                                <div key={deploy.id} className="overview-tab__deploy-row">
                                    <div
                                        className="overview-tab__deploy-dot"
                                        style={{ backgroundColor: statusInfo.color }}
                                    />
                                    <div className="overview-tab__deploy-info">
                                        <span className="overview-tab__deploy-message">
                                            {deploy.commitMessage || deploy.version || `Deployment #${deployments.length - idx}`}
                                        </span>
                                        <span className="overview-tab__deploy-meta">
                                            {deploy.commitSha && (
                                                <span className="overview-tab__deploy-sha">{deploy.commitSha.substring(0, 7)}</span>
                                            )}
                                            {deploy.branch && <span>{deploy.branch}</span>}
                                            {deploy.duration && <span>{formatDuration(deploy.duration)}</span>}
                                            <span>{formatRelativeTime(deploy.timestamp)}</span>
                                        </span>
                                    </div>
                                    <span
                                        className="overview-tab__deploy-badge"
                                        style={{ backgroundColor: statusInfo.color + '1a', color: statusInfo.color }}
                                    >
                                        {isLatest ? 'Live' : statusInfo.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

function extractRepoDisplay(url) {
    if (!url) return '';
    try {
        const cleaned = url.replace(/\.git$/, '');
        const parts = cleaned.split('/');
        return parts.slice(-2).join('/');
    } catch {
        return url;
    }
}

export default OverviewTab;
