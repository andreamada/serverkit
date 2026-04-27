import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../Modal';

const SSHKeysTab = () => {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const toast = useToast();

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        setLoading(true);
        try {
            const data = await api.getSSHKeys();
            setKeys(data.keys || []);
        } catch (error) {
            console.error('Failed to load SSH keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddKey = async () => {
        if (!newKey.trim()) return;
        setActionLoading(true);
        try {
            await api.addSSHKey(newKey);
            toast.success('SSH key added successfully');
            setShowAddModal(false);
            setNewKey('');
            await loadKeys();
        } catch (error) {
            toast.error(`Failed to add key: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveKey = async (keyId, comment) => {
        setConfirmDialog({
            title: 'Remove SSH Key',
            message: `Are you sure you want to remove the SSH key${comment ? ` "${comment}"` : ''}? This may lock you out if it's your only key.`,
            confirmText: 'Remove',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.removeSSHKey(keyId);
                    toast.success('SSH key removed');
                    await loadKeys();
                } catch (error) {
                    toast.error(`Failed to remove key: ${error.message}`);
                }
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    return (
        <div className="ssh-keys-tab">
            <div className="card">
                <div className="card-header">
                    <h3>SSH Authorized Keys</h3>
                    <div className="card-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => setShowAddModal(true)}>
                            Add Key
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={loadKeys}>
                            Refresh
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="loading-sm">Loading...</div>
                    ) : keys.length === 0 ? (
                        <div className="empty-state-sm">
                            <p>No SSH keys configured for root user.</p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                Add SSH Key
                            </button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Fingerprint</th>
                                    <th>Comment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((key) => (
                                    <tr key={key.id}>
                                        <td><code>{key.type}</code></td>
                                        <td><code className="fingerprint">{key.fingerprint}</code></td>
                                        <td>{key.comment || '-'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleRemoveKey(key.id, key.comment)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add SSH Public Key" size="lg">
                            <div className="form-group">
                                <label>Public Key</label>
                                <textarea
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="ssh-rsa AAAA... user@host or ssh-ed25519 AAAA... user@host"
                                    rows={4}
                                />
                                <p className="help-text">Paste your SSH public key (typically from ~/.ssh/id_rsa.pub or ~/.ssh/id_ed25519.pub)</p>
                            </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddKey} disabled={actionLoading || !newKey.trim()}>
                                {actionLoading ? 'Adding...' : 'Add Key'}
                            </button>
                        </div>
            </Modal>

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

export default SSHKeysTab;
