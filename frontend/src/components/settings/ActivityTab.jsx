import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ActivityTab = () => {
    const [summary, setSummary] = useState(null);
    const [feed, setFeed] = useState([]);
    const [feedPagination, setFeedPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedLoading, setFeedLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ user_id: '', action: '', page: 1 });
    const [actions, setActions] = useState([]);

    useEffect(() => {
        loadSummary();
        loadUsers();
        loadActions();
    }, []);

    useEffect(() => {
        loadFeed();
    }, [filters]);

    async function loadSummary() {
        try {
            const data = await api.getActivitySummary();
            setSummary(data);
        } catch {
            // Silently handle
        } finally {
            setLoading(false);
        }
    }

    async function loadFeed() {
        try {
            setFeedLoading(true);
            const params = { per_page: 20 };
            if (filters.page) params.page = filters.page;
            if (filters.user_id) params.user_id = filters.user_id;
            if (filters.action) params.action = filters.action;
            const data = await api.getActivityFeed(params);
            setFeed(data.logs || []);
            setFeedPagination(data.pagination);
        } catch {
            // Silently handle
        } finally {
            setFeedLoading(false);
        }
    }

    async function loadUsers() {
        try {
            const data = await api.getUsers();
            setUsers(data.users || []);
        } catch {
            // Silently handle
        }
    }

    async function loadActions() {
        try {
            const data = await api.getAuditLogActions();
            setActions(data.actions || []);
        } catch {
            // Silently handle
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function getActionClass(action) {
        if (action?.includes('delete') || action?.includes('revoke')) return 'action-danger';
        if (action?.includes('failed') || action?.includes('disable')) return 'action-warning';
        if (action?.includes('create') || action?.includes('login') || action?.includes('accept')) return 'action-success';
        return 'action-info';
    }

    if (loading) {
        return <div className="activity-tab"><div className="loading-state">Loading activity...</div></div>;
    }

    const maxCount = summary?.top_users?.length
        ? Math.max(...summary.top_users.map(u => u.action_count))
        : 1;

    return (
        <div className="activity-tab">
            <div className="tab-header">
                <div className="tab-header-content">
                    <h3>Activity Dashboard</h3>
                    <p>Monitor team activity and recent actions</p>
                </div>
            </div>

            {summary && (
                <>
                    <div className="activity-summary">
                        <div className="activity-stat-card">
                            <span className="stat-number">{summary.active_users_today}</span>
                            <span className="stat-label">Active Users Today</span>
                        </div>
                        <div className="activity-stat-card">
                            <span className="stat-number">{summary.actions_this_week}</span>
                            <span className="stat-label">Actions This Week</span>
                        </div>
                        <div className="activity-stat-card">
                            <span className="stat-number">{summary.total_users}</span>
                            <span className="stat-label">Total Users</span>
                        </div>
                    </div>

                    {summary.top_users && summary.top_users.length > 0 && (
                        <div className="most-active-users">
                            <h4>Most Active Users (This Week)</h4>
                            {summary.top_users.map((u, i) => (
                                <div key={u.user_id} className="active-user-item">
                                    <span className="active-user-rank">{i + 1}</span>
                                    <span className="active-user-name">{u.username}</span>
                                    <div className="active-user-bar-wrapper">
                                        <div
                                            className="active-user-bar"
                                            style={{ width: `${(u.action_count / maxCount) * 100}%` }}
                                        />
                                    </div>
                                    <span className="active-user-count">{u.action_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <div className="activity-feed-section">
                <h4>Activity Feed</h4>
                <div className="filters-bar">
                    <div className="filter-group">
                        <label>User</label>
                        <select value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value, page: 1 }))}>
                            <option value="">All users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Action</label>
                        <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}>
                            <option value="">All actions</option>
                            {actions.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {feedLoading ? (
                    <div className="loading-state">Loading...</div>
                ) : feed.length === 0 ? (
                    <div className="empty-state">No activity found</div>
                ) : (
                    <div className="audit-log-list">
                        {feed.map(entry => (
                            <div key={entry.id} className={`log-entry ${getActionClass(entry.action)}`}>
                                <div className="log-content">
                                    <div className="log-header">
                                        <span className="log-action">{entry.action}</span>
                                        {entry.username && <span className="log-user">by {entry.username}</span>}
                                    </div>
                                    <div className="log-meta">
                                        <span>{formatDate(entry.created_at)}</span>
                                        {entry.ip_address && <span className="log-ip">{entry.ip_address}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {feedPagination && feedPagination.pages > 1 && (
                    <div className="pagination">
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={!feedPagination.has_prev}
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {feedPagination.page} of {feedPagination.pages}
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={!feedPagination.has_next}
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;
