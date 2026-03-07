import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const GitConnectModal = ({ appId, deployConfig, onClose, onSaved }) => {
    const toast = useToast();
    const [saving, setSaving] = useState(false);
    const [repoUrl, setRepoUrl] = useState(deployConfig?.repo_url || '');
    const [branch, setBranch] = useState(deployConfig?.branch || 'main');
    const [autoDeploy, setAutoDeploy] = useState(deployConfig?.auto_deploy ?? true);
    const [preDeployScript, setPreDeployScript] = useState(deployConfig?.pre_deploy_script || '');
    const [postDeployScript, setPostDeployScript] = useState(deployConfig?.post_deploy_script || '');

    function detectProvider(url) {
        if (url.includes('github.com')) return 'GitHub';
        if (url.includes('gitlab.com')) return 'GitLab';
        if (url.includes('bitbucket.org')) return 'Bitbucket';
        return null;
    }

    const provider = detectProvider(repoUrl);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!repoUrl.trim()) return;

        setSaving(true);
        try {
            await api.configureDeployment(
                appId,
                repoUrl.trim(),
                branch || 'main',
                autoDeploy,
                preDeployScript || null,
                postDeployScript || null
            );

            if (autoDeploy && !deployConfig) {
                try {
                    await api.createWebhook({
                        deploy_on_push: true,
                        app_id: appId,
                        repo_url: repoUrl.trim(),
                        branch: branch || 'main',
                    });
                } catch {
                    // Webhook creation is best-effort
                }
            }

            toast.success('Repository connected');
            onSaved();
        } catch (err) {
            toast.error('Failed to save deployment configuration');
        } finally {
            setSaving(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm('Disconnect this repository? Auto-deploy will stop.')) return;

        setSaving(true);
        try {
            await api.removeDeployment(appId);
            toast.success('Repository disconnected');
            onSaved();
        } catch (err) {
            toast.error('Failed to disconnect repository');
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{deployConfig ? 'Edit Repository' : 'Connect Repository'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form className="git-connect-modal__form" onSubmit={handleSubmit}>
                    <div className="git-connect-modal__field">
                        <label>Repository URL</label>
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            required
                        />
                        {provider && (
                            <span className="settings-hint" style={{ marginTop: '4px', display: 'block' }}>
                                Detected: {provider}
                            </span>
                        )}
                    </div>

                    <div className="git-connect-modal__field">
                        <label>Branch</label>
                        <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="main"
                        />
                    </div>

                    <div className="git-connect-modal__toggle">
                        <div className="git-connect-modal__toggle-label">
                            Auto-deploy on push
                            <span>Automatically deploy when new commits are pushed to the branch.</span>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={autoDeploy}
                                onChange={(e) => setAutoDeploy(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="git-connect-modal__field">
                        <label>Pre-deploy Script (optional)</label>
                        <textarea
                            value={preDeployScript}
                            onChange={(e) => setPreDeployScript(e.target.value)}
                            placeholder="Commands to run before deployment..."
                        />
                    </div>

                    <div className="git-connect-modal__field">
                        <label>Post-deploy Script (optional)</label>
                        <textarea
                            value={postDeployScript}
                            onChange={(e) => setPostDeployScript(e.target.value)}
                            placeholder="Commands to run after deployment..."
                        />
                    </div>

                    <div className="git-connect-modal__actions">
                        {deployConfig && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDisconnect}
                                disabled={saving}
                                style={{ marginRight: 'auto' }}
                            >
                                Disconnect
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : deployConfig ? 'Save Changes' : 'Connect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GitConnectModal;
