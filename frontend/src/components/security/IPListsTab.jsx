import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

const IPListsTab = () => {
    const [lists, setLists] = useState({ allowlist: [], blocklist: [] });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(null);
    const [newIP, setNewIP] = useState('');
    const [newComment, setNewComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const toast = useToast();

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        setLoading(true);
        try {
            const data = await api.getIPLists();
            setLists({
                allowlist: data.allowlist || [],
                blocklist: data.blocklist || []
            });
        } catch (error) {
            console.error('Failed to load IP lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newIP.trim()) return;
        setActionLoading(true);
        try {
            await api.addToIPList(newIP, showAddModal, newComment);
            toast.success(`IP added to ${showAddModal}`);
            setShowAddModal(null);
            setNewIP('');
            setNewComment('');
            await loadLists();
        } catch (error) {
            toast.error(`Failed to add IP: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (ip, listType) => {
        setConfirmDialog({
            title: `Remove from ${listType}`,
            message: `Are you sure you want to remove ${ip} from the ${listType}?`,
            confirmText: 'Remove',
            variant: 'warning',
            onConfirm: async () => {
                try {
                    await api.removeFromIPList(ip, listType);
                    toast.success(`IP removed from ${listType}`);
                    await loadLists();
                } catch (error) {
                    toast.error(`Failed to remove IP: ${error.message}`);
                }
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const renderList = (title, listType, items, badgeClass) => (
        <div className="card">
            <div className="card-header">
                <h3>{title}</h3>
                <button className="btn btn-sm btn-primary" onClick={() => setShowAddModal(listType)}>
                    Add IP
                </button>
            </div>
            <div className="card-body">
                {items.length === 0 ? (
                    <p className="text-muted">No IPs in {listType}.</p>
                ) : (
                    <div className="ip-list">
                        {items.map((item, index) => (
                            <div key={index} className="ip-list-item">
                                <div className="ip-info">
                                    <code className={badgeClass}>{item.ip}</code>
                                    {item.comment && <span className="ip-comment">{item.comment}</span>}
                                    <span className="ip-date">{new Date(item.added_at).toLocaleDateString()}</span>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRemove(item.ip, listType)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return <div className="loading-sm">Loading IP lists...</div>;
    }

    return (
        <div className="ip-lists-tab">
            <div className="ip-lists-grid">
                {renderList('Allowlist', 'allowlist', lists.allowlist, 'ip-allowed')}
                {renderList('Blocklist', 'blocklist', lists.blocklist, 'ip-blocked')}
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add to {showAddModal}</h2>
                            <button className="btn btn-icon" onClick={() => setShowAddModal(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>IP Address or CIDR</label>
                                <input
                                    type="text"
                                    value={newIP}
                                    onChange={(e) => setNewIP(e.target.value)}
                                    placeholder="192.168.1.100 or 10.0.0.0/24"
                                />
                            </div>
                            <div className="form-group">
                                <label>Comment (optional)</label>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Office IP, VPN, etc."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdd} disabled={actionLoading || !newIP.trim()}>
                                {actionLoading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.confirmText}
                    variant={confirmDialog.variant}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}
        </div>
    );
};

export default IPListsTab;
