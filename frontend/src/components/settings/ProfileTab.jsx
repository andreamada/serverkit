import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import SSOProviderIcon from '../SSOProviderIcon';

const LinkedAccounts = () => {
    const { ssoProviders } = useAuth();
    const [identities, setIdentities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlinking, setUnlinking] = useState(null);
    const [linkingProvider, setLinkingProvider] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadIdentities();
    }, []);

    async function loadIdentities() {
        try {
            const data = await api.getSSOIdentities();
            setIdentities(data.identities || []);
        } catch (err) {
            // SSO may not be configured; silently handle
        } finally {
            setLoading(false);
        }
    }

    async function handleUnlink(provider) {
        setUnlinking(provider);
        setError('');
        try {
            await api.unlinkSSOProvider(provider);
            await loadIdentities();
        } catch (err) {
            setError(err.message);
        } finally {
            setUnlinking(null);
        }
    }

    async function handleLink(provider) {
        setLinkingProvider(provider);
        setError('');
        try {
            const redirectUri = `${window.location.origin}/login/callback/${provider}`;
            const { auth_url } = await api.startSSOAuth(provider, redirectUri);
            window.location.href = auth_url;
        } catch (err) {
            setError(err.message);
            setLinkingProvider(null);
        }
    }

    // Only show if SSO is configured
    if (loading || (!ssoProviders?.length && !identities.length)) {
        return null;
    }

    const linkedProviderIds = identities.map(i => i.provider);
    const availableToLink = (ssoProviders || []).filter(p => !linkedProviderIds.includes(p.id));

    return (
        <div className="settings-card">
            <h3>Linked Accounts</h3>
            <p className="text-secondary">Connect external identity providers to your account</p>

            {error && <div className="alert alert-danger">{error}</div>}

            {identities.length > 0 && (
                <div className="linked-accounts-list">
                    {identities.map(identity => (
                        <div key={identity.id} className="linked-account">
                            <div className="linked-account__info">
                                <SSOProviderIcon provider={identity.provider} />
                                <div>
                                    <span className="linked-account__provider">{identity.provider}</span>
                                    <span className="linked-account__email">{identity.provider_email}</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleUnlink(identity.provider)}
                                disabled={unlinking === identity.provider}
                            >
                                {unlinking === identity.provider ? 'Unlinking...' : 'Unlink'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {availableToLink.length > 0 && (
                <div className="linked-accounts-available">
                    {availableToLink.map(p => (
                        <button
                            key={p.id}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleLink(p.id)}
                            disabled={linkingProvider === p.id}
                        >
                            <SSOProviderIcon provider={p.id} />
                            {linkingProvider === p.id ? 'Redirecting...' : `Link ${p.name}`}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProfileTab = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || ''
            });
        }
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateUser(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Profile Settings</h2>
                <p>Update your personal information</p>
            </div>

            {message && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Role</label>
                    <input type="text" value={user?.role || 'user'} disabled className="input-disabled" />
                    <span className="form-help">Contact an administrator to change your role</span>
                </div>

                <div className="form-group">
                    <label>Member Since</label>
                    <input
                        type="text"
                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        disabled
                        className="input-disabled"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <LinkedAccounts />
        </div>
    );
};

export default ProfileTab;
