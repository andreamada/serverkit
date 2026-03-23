// Sidebar navigation items definition
// Each item has: id, label, route, category, icon (SVG paths), and optional sub-items
// The 'dashboard' item is always visible and cannot be hidden

export const SIDEBAR_CATEGORIES = ['overview', 'infrastructure', 'operations', 'system'];

export const CATEGORY_LABELS = {
    overview: 'Overview',
    infrastructure: 'Infrastructure',
    operations: 'Operations',
    system: 'System'
};

export const SIDEBAR_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        route: '/',
        category: 'overview',
        alwaysVisible: true,
        end: true,
        icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
    },
    {
        id: 'servers',
        label: 'Servers',
        route: '/servers',
        category: 'infrastructure',
        icon: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'
    },
    {
        id: 'fleet',
        label: 'Agent Fleet',
        route: '/fleet',
        category: 'infrastructure',
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
        id: 'fleet-monitor',
        label: 'Fleet Monitor',
        route: '/fleet-monitor',
        category: 'infrastructure',
        icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
    },
    {
        id: 'domains',
        label: 'Domains & Sites',
        route: '/domains',
        category: 'infrastructure',
        icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
    },
    {
        id: 'services',
        label: 'Services',
        route: '/services',
        category: 'infrastructure',
        icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
    },
    {
        id: 'wordpress',
        label: 'WordPress',
        route: '/wordpress',
        category: 'infrastructure',
        icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M3.5 9h17M3.5 15h17"/>',
        subItems: [
            {
                id: 'wp-pipeline',
                label: 'Pipeline',
                route: '/wordpress/projects',
                requiresCondition: 'wpInstalled',
                icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
            }
        ]
    },
    {
        id: 'templates',
        label: 'Templates',
        route: '/templates',
        category: 'infrastructure',
        icon: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'
    },
    {
        id: 'workflow',
        label: 'Workflow Builder',
        route: '/workflow',
        category: 'infrastructure',
        icon: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51l-6.82 3.98"/>'
    },
    {
        id: 'databases',
        label: 'Databases',
        route: '/databases',
        category: 'infrastructure',
        icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'
    },
    {
        id: 'ssl',
        label: 'SSL Certificates',
        route: '/ssl',
        category: 'infrastructure',
        icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
    },
    {
        id: 'docker',
        label: 'Docker',
        route: '/docker',
        category: 'infrastructure',
        icon: '<rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><rect x="2" y="14" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/>'
    },
    {
        id: 'git',
        label: 'Git',
        route: '/git',
        category: 'infrastructure',
        icon: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'
    },
    {
        id: 'files',
        label: 'File Manager',
        route: '/files',
        category: 'operations',
        icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
    },
    {
        id: 'ftp',
        label: 'FTP Server',
        route: '/ftp',
        category: 'operations',
        icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
    },
    {
        id: 'monitoring',
        label: 'Monitoring',
        route: '/monitoring',
        category: 'operations',
        icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
    },
    {
        id: 'backups',
        label: 'Backups',
        route: '/backups',
        category: 'operations',
        icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
    },
    {
        id: 'cron',
        label: 'Cron Jobs',
        route: '/cron',
        category: 'operations',
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
    },
    {
        id: 'security',
        label: 'Security',
        route: '/security',
        category: 'operations',
        icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4m0 4h.01"/>'
    },
    {
        id: 'email',
        label: 'Email Server',
        route: '/email',
        category: 'operations',
        icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'
    },
    {
        id: 'terminal',
        label: 'Terminal / Logs',
        route: '/terminal',
        category: 'system',
        icon: '<path d="M4 17l6-6-6-6M12 19h8"/>'
    },
    {
        id: 'downloads',
        label: 'Downloads',
        route: '/downloads',
        category: 'system',
        icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
    }
];

// Preset profiles define which items are hidden
export const SIDEBAR_PRESETS = {
    full: {
        label: 'Full',
        description: 'All sidebar items visible',
        hiddenItems: []
    },
    web: {
        label: 'Web Hosting',
        description: 'Domains, SSL, databases, and web essentials',
        hiddenItems: ['docker', 'git', 'email', 'workflow']
    },
    email: {
        label: 'Email Admin',
        description: 'Email server, security, DNS, and monitoring',
        hiddenItems: ['docker', 'git', 'wordpress', 'templates', 'workflow', 'ftp']
    },
    devops: {
        label: 'Docker / DevOps',
        description: 'Docker, Git, monitoring, and CI/CD tools',
        hiddenItems: ['wordpress', 'templates', 'email', 'ftp', 'ssl']
    },
    minimal: {
        label: 'Minimal',
        description: 'Just the essentials — dashboard, servers, terminal',
        hiddenItems: ['wordpress', 'templates', 'workflow', 'ftp', 'email', 'git', 'docker', 'ssl', 'cron', 'downloads']
    }
};

// Get visible items based on config
export function getVisibleItems(sidebarConfig) {
    const { preset = 'full', hiddenItems = [] } = sidebarConfig || {};

    // For custom preset, use hiddenItems directly
    // For named presets, use the preset's hiddenItems
    const hidden = preset === 'custom'
        ? hiddenItems
        : (SIDEBAR_PRESETS[preset]?.hiddenItems || []);

    return SIDEBAR_ITEMS.filter(item =>
        item.alwaysVisible || !hidden.includes(item.id)
    );
}
