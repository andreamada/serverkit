import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTabParam from '../hooks/useTabParam';
import api from '../services/api';
import {
    OverviewTab,
    FirewallTab,
    Fail2banTab,
    SSHKeysTab,
    IPListsTab,
    ScannerTab,
    QuarantineTab,
    IntegrityTab,
    AuditTab,
    VulnerabilityTab,
    AutoUpdatesTab,
    EventsTab,
    SecurityConfigTab,
} from '../components/security';

const VALID_TABS = ['overview', 'firewall', 'fail2ban', 'ssh-keys', 'ip-lists', 'scanner', 'quarantine', 'integrity', 'audit', 'vulnerability', 'updates', 'events', 'settings'];

const Security = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useTabParam('/security', VALID_TABS);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, []);

    async function loadStatus() {
        try {
            const data = await api.getSecurityStatus();
            setStatus(data);
        } catch (err) {
            console.error('Failed to load security status:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="page"><div className="loading">Loading security status...</div></div>;
    }

    return (
        <div className="page security-page">
            <div className="page-header">
                <div>
                    <h1>Security</h1>
                    <p className="page-subtitle">Firewall, malware scanning, file integrity, and security alerts</p>
                </div>
            </div>

            <div className="tabs-nav tabs-nav-scrollable">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview
                </button>
                <button className={`tab-btn ${activeTab === 'firewall' ? 'active' : ''}`} onClick={() => setActiveTab('firewall')}>
                    Firewall
                </button>
                <button className={`tab-btn ${activeTab === 'fail2ban' ? 'active' : ''}`} onClick={() => setActiveTab('fail2ban')}>
                    Fail2ban
                </button>
                <button className={`tab-btn ${activeTab === 'ssh-keys' ? 'active' : ''}`} onClick={() => setActiveTab('ssh-keys')}>
                    SSH Keys
                </button>
                <button className={`tab-btn ${activeTab === 'ip-lists' ? 'active' : ''}`} onClick={() => setActiveTab('ip-lists')}>
                    IP Lists
                </button>
                <button className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
                    Malware Scanner
                </button>
                <button className={`tab-btn ${activeTab === 'quarantine' ? 'active' : ''}`} onClick={() => setActiveTab('quarantine')}>
                    Quarantine
                </button>
                <button className={`tab-btn ${activeTab === 'integrity' ? 'active' : ''}`} onClick={() => setActiveTab('integrity')}>
                    File Integrity
                </button>
                <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
                    Audit
                </button>
                <button className={`tab-btn ${activeTab === 'vulnerability' ? 'active' : ''}`} onClick={() => setActiveTab('vulnerability')}>
                    Vulnerability Scan
                </button>
                <button className={`tab-btn ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>
                    Auto Updates
                </button>
                <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                    Events
                </button>
                <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                    Settings
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && <OverviewTab status={status} onRefresh={loadStatus} />}
                {activeTab === 'firewall' && <FirewallTab />}
                {activeTab === 'fail2ban' && <Fail2banTab />}
                {activeTab === 'ssh-keys' && <SSHKeysTab />}
                {activeTab === 'ip-lists' && <IPListsTab />}
                {activeTab === 'scanner' && <ScannerTab />}
                {activeTab === 'quarantine' && <QuarantineTab />}
                {activeTab === 'integrity' && <IntegrityTab />}
                {activeTab === 'audit' && <AuditTab />}
                {activeTab === 'vulnerability' && <VulnerabilityTab />}
                {activeTab === 'updates' && <AutoUpdatesTab />}
                {activeTab === 'events' && <EventsTab />}
                {activeTab === 'settings' && <SecurityConfigTab />}
            </div>
        </div>
    );
};

export default Security;
