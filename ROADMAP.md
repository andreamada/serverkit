# ServerKit Roadmap

This document outlines the development roadmap for ServerKit. Features are organized by phases and priority.

---

## Current Version: v1.5.0 (In Development)

### Recently Completed (v1.4.0)

- **Team & Permissions** - RBAC with admin/developer/viewer roles, invitations, audit logging
- **API Enhancements** - API keys, rate limiting, webhook subscriptions, OpenAPI docs, analytics
- **SSO & OAuth Login** - Google, GitHub, OIDC, SAML with account linking
- **Database Migrations** - Flask-Migrate/Alembic with versioned schema migrations
- **Email Server Management** - Postfix, Dovecot, DKIM, SpamAssassin, Roundcube

---

## Phase 1: Core Infrastructure (Completed)

- [x] Flask backend with SQLAlchemy ORM
- [x] React frontend with Vite
- [x] JWT-based authentication
- [x] Real-time WebSocket updates
- [x] System metrics (CPU, RAM, disk, network)
- [x] Docker and Docker Compose support
- [x] SQLite/PostgreSQL database support

---

## Phase 2: Application Management (Completed)

- [x] PHP/WordPress application deployment
- [x] Python (Flask/Django) application support
- [x] Node.js application management with PM2
- [x] Docker container management
- [x] Environment variable management
- [x] Application start/stop/restart controls
- [x] Log viewing per application

---

## Phase 3: Domain & SSL Management (Completed)

- [x] Nginx virtual host management
- [x] Domain configuration interface
- [x] Let's Encrypt SSL integration
- [x] SSL certificate auto-renewal
- [x] Redirect management (HTTP → HTTPS)

---

## Phase 4: Database Management (Completed)

- [x] MySQL/MariaDB database support
- [x] PostgreSQL database support
- [x] Database creation/deletion
- [x] User management per database
- [x] Basic query interface

---

## Phase 5: File & FTP Management (Completed)

- [x] Web-based file manager
- [x] File upload/download
- [x] File editing with syntax highlighting
- [x] vsftpd FTP server integration
- [x] FTP user management

---

## Phase 6: Monitoring & Alerts (Completed)

- [x] Real-time system metrics
- [x] Server uptime tracking
- [x] Customizable alert thresholds
- [x] Discord webhook notifications
- [x] Slack webhook notifications
- [x] Telegram bot notifications
- [x] Generic webhook support
- [x] Alert history and logging

---

## Phase 7: Security Features (Completed)

- [x] Two-factor authentication (TOTP)
- [x] Backup codes for 2FA recovery
- [x] ClamAV malware scanning
- [x] Quick scan / Full scan options
- [x] File quarantine management
- [x] File integrity monitoring
- [x] Failed login detection
- [x] Security event logging

---

## Phase 8: Scheduled Tasks (Completed)

- [x] Cron job management
- [x] Visual cron expression builder
- [x] Job execution history
- [x] Enable/disable jobs

---

## Phase 9: Firewall Management (Completed - Merged into Security)

- [x] UFW firewall integration
- [x] Visual rule management
- [x] Common port presets
- [x] Rule enable/disable
- [x] Consolidated into Security page for unified security management

---

## Phase 10: Multi-Server Management (Completed)

**Priority: High**

- [x] Agent-based remote server monitoring (Go agent)
- [x] Centralized dashboard for multiple servers
- [x] Server grouping and tagging
- [x] Cross-server metrics comparison
- [x] Remote Docker management via agents
- [x] Server health overview
- [x] Agent WebSocket gateway
- [x] HMAC-SHA256 authentication
- [x] GitHub Actions for agent releases (Linux/Windows)
- [x] Installation scripts endpoint
- [x] Agent auto-update mechanism
- [x] Agent download page in UI
- [x] Container logs streaming for remote servers

---

## Phase 11: Git Deployment (Completed)

**Priority: High**

- [x] GitHub/GitLab webhook integration
- [x] Automatic deployment on push
- [x] Branch selection for deployment
- [x] Rollback to previous deployments
- [x] Deployment history and logs
- [x] Pre/post deployment scripts
- [x] Zero-downtime deployments

---

## Phase 12: Backup & Restore (Completed)

**Priority: High**

- [x] Automated database backups
- [x] File/directory backups
- [x] S3-compatible storage support
- [x] Backblaze B2 integration
- [x] Backup scheduling
- [x] One-click restore
- [x] Backup retention policies
- [x] Offsite backup verification

---

## Phase 13: Email Server Management (Completed)

**Priority: Medium**

- [x] Postfix mail server setup
- [x] Dovecot IMAP/POP3 configuration
- [x] Email account management
- [x] Spam filtering (SpamAssassin)
- [x] DKIM/SPF/DMARC configuration
- [x] Webmail interface integration
- [x] Email forwarding rules

---

## Phase 14: Team & Permissions (Completed)

**Priority: Medium**

- [x] Multi-user support
- [x] Role-based access control (RBAC)
- [x] Custom permission sets
- [x] Audit logging per user
- [x] Team invitations
- [x] Activity dashboard

---

## Phase 15: API Enhancements (Completed)

**Priority: Medium**

- [x] API key management
- [x] Rate limiting
- [x] Webhook event subscriptions
- [x] OpenAPI/Swagger documentation
- [x] API usage analytics

---

## Phase 16: Advanced Security (Completed)

**Priority: High**

- [x] Unified Security page with all security features
- [x] Firewall tab with UFW/firewalld management
- [x] Fail2ban integration
- [x] SSH key management
- [x] IP allowlist/blocklist
- [x] Brute force protection
- [x] Security audit reports
- [x] Vulnerability scanning (Lynis)
- [x] Automatic security updates (unattended-upgrades/dnf-automatic)

---

## Phase 17: SSO & OAuth Login (Completed)

**Priority: High**

- [x] Google OAuth 2.0 login
- [x] GitHub OAuth login
- [x] Generic OpenID Connect (OIDC) provider support
- [x] SAML 2.0 support for enterprise environments
- [x] Social login UI (provider buttons on login page)
- [x] Account linking (connect OAuth identity to existing local account)
- [x] Auto-provisioning of new users on first SSO login
- [x] Configurable SSO settings (enable/disable providers, client ID/secret management)
- [x] Enforce SSO-only login (disable password auth for team members)
- [x] SSO session management and token refresh

---

## Phase 18: Database Migrations & Schema Versioning (Completed)

**Priority: High**

### Backend — Migration Engine
- [x] Integrate Flask-Migrate (Alembic) for versioned schema migrations
- [x] Generate initial migration from current model state as baseline
- [x] Replace `_auto_migrate_columns()` hack with proper Alembic migrations
- [x] Store schema version in a `schema_version` table (current version, history)
- [x] API endpoints for migration status, apply, and rollback
- [x] Auto-detect pending migrations on login and flag the session
- [x] Pre-migration automatic DB backup before applying changes
- [x] Migration scripts for all existing model changes (retroactive baseline)

### CLI Fallback
- [x] CLI commands for headless/SSH scenarios (`flask db upgrade`, `flask db status`)
- [x] CLI rollback support (`flask db downgrade`)

---

# Upcoming Development

The phases below are ordered by priority. Higher phases ship first.

---

## Phase 19: New UI & Services Page (Planned)

**Priority: Critical**

Merge the `new-ui` branch — adds a full Services page with service detail views, metrics, logs, shell, settings, git connect, and package management.

- [ ] Merge `new-ui` branch into main development line
- [ ] Services list page with status indicators and quick actions
- [ ] Service detail page with tabbed interface (Metrics, Logs, Shell, Settings, Commands, Events, Packages)
- [ ] Git connect modal for linking services to repositories
- [ ] Gunicorn management tab for Python services
- [ ] Service type detection and type-specific UI (Node, Python, PHP, Docker, etc.)
- [ ] Resolve any conflicts with features added since branch diverged

---

## Phase 20: Customizable Sidebar & Dashboard Views (Planned)

**Priority: High**

Let users personalize what they see. Not everyone runs email servers or manages Docker — the sidebar should adapt to each user's needs.

- [ ] Sidebar configuration page in Settings
- [ ] Preset view profiles: **Full** (default, all modules), **Web Hosting** (apps, domains, SSL, databases, files), **Email Admin** (email, DNS, security), **Docker/DevOps** (containers, deployments, git, monitoring), **Minimal** (apps, monitoring, backups only)
- [ ] Custom view builder — toggle individual sidebar items on/off
- [ ] Per-user preference storage (saved to user profile, synced across sessions)
- [ ] Sidebar sections collapse/expand with memory
- [ ] Quick-switch between saved view profiles
- [ ] Admin can set default view for new users
- [ ] Hide empty/unconfigured modules automatically (e.g., hide Email if no email domains exist)

---

## Phase 21: Migration Wizard Frontend UI (Planned)

**Priority: High**

The backend migration engine is complete — this adds the visual upgrade experience (Matomo-style).

- [ ] Full-screen modal/wizard that appears when pending migrations are detected
- [ ] Step 1: "Update Available" — show current version vs new version, changelog summary
- [ ] Step 2: "Backup" — auto-backup the database, show progress, confirm success
- [ ] Step 3: "Apply Migrations" — run migrations with real-time progress/log output
- [ ] Step 4: "Done" — success confirmation with summary of changes applied
- [ ] Error handling: if a migration fails, show the error and offer rollback option
- [ ] Block access to the panel until migrations are applied
- [ ] Migration history page in Settings showing all past migrations and timestamps

---

## Phase 22: Container Logs & Monitoring UI (Planned)

**Priority: High**

The container logs API is already built. This phase adds the frontend and extends monitoring to per-app metrics.

- [ ] Log viewer component with terminal-style display and ANSI color support
- [ ] Real-time log streaming via WebSocket with auto-scroll (pause on user scroll)
- [ ] Log search with regex support and match highlighting
- [ ] Filter by log level (INFO, WARN, ERROR, DEBUG) and time range
- [ ] Export filtered logs to file
- [ ] Per-container resource collection (CPU %, memory, network I/O via Docker stats API)
- [ ] Per-app resource usage charts (Recharts) with time range selector (1h, 6h, 24h, 7d)
- [ ] Per-app alert rules (metric, operator, threshold, duration)
- [ ] Alert notifications via existing channels (email, Discord, Telegram) with cooldown

---

## Phase 23: Agent Fleet Management (Planned)

**Priority: High**

Level up agent management from "connect and monitor" to full fleet control.

- [ ] Agent version tracking and compatibility matrix (panel version ↔ agent version)
- [ ] Push agent upgrades from the panel (single server or fleet-wide rollout)
- [ ] Staged rollout support — upgrade agents in batches with health checks between waves
- [ ] Agent health dashboard — connection uptime, heartbeat latency, command success rate per agent
- [ ] Auto-discovery of new servers on the local network (mDNS/broadcast scan)
- [ ] Agent registration approval workflow (admin must approve before agent joins fleet)
- [ ] Bulk agent operations — restart, upgrade, rotate keys across selected servers
- [ ] Agent changelog and release notes visible in UI
- [ ] Offline agent command queue — persist commands and deliver when agent reconnects
- [ ] Command retry with configurable backoff for failed/timed-out operations
- [ ] Agent connection diagnostics — test connectivity, latency, firewall check from panel

---

## Phase 24: Cross-Server Monitoring Dashboard (Planned)

**Priority: High**

Fleet-wide visibility — see everything at a glance and catch problems early.

- [ ] Fleet overview dashboard — heatmap of all servers by CPU/memory/disk usage
- [ ] Server comparison charts — overlay metrics from multiple servers on one graph
- [ ] Per-server alert thresholds (CPU > 80% for 5 min → warning, > 95% → critical)
- [ ] Anomaly detection — automatic baseline learning, alert on deviations
- [ ] Custom metric dashboards — drag-and-drop widgets, save layouts per user
- [ ] Metric correlation view — spot relationships between metrics across servers
- [ ] Capacity forecasting — trend-based predictions (disk full in X days, memory growth rate)
- [ ] Metrics export — Prometheus endpoint (`/metrics`), CSV download, JSON API
- [ ] Grafana integration guide and pre-built dashboard templates
- [ ] Fleet-wide search — find which server is running a specific container, service, or port

---

## Phase 25: Agent Plugin System (Planned)

**Priority: High**

Make the agent extensible — let users add custom capabilities without modifying agent core. This is the foundation for future integrations (Android device farms, IoT fleets, custom hardware monitoring, etc.).

### Plugin Architecture
- [ ] Plugin specification — standard interface (init, healthcheck, metrics, commands)
- [ ] Plugin manifest format (YAML/JSON) — name, version, dependencies, capabilities, permissions
- [ ] Plugin lifecycle management — install, enable, disable, uninstall, upgrade
- [ ] Plugin isolation — each plugin runs in its own process/sandbox with resource limits
- [ ] Plugin communication — standardized IPC between plugin and agent core

### Plugin Capabilities
- [ ] Custom metrics reporters — plugins can push arbitrary metrics to the panel
- [ ] Custom health checks — plugins define checks that feed into the status system
- [ ] Custom commands — plugins register new command types the panel can invoke
- [ ] Scheduled tasks — plugins can register periodic jobs (cron-like)
- [ ] Event hooks — plugins can react to agent events (connect, disconnect, command, alert)

### Panel Integration
- [ ] Plugin management UI — install, configure, monitor plugins per server
- [ ] Plugin marketplace / registry — browse and install community plugins
- [ ] Plugin configuration editor — per-server plugin settings from the panel
- [ ] Plugin logs and diagnostics — view plugin output and errors
- [ ] Plugin metrics visualization — custom widgets for plugin-reported data

### Developer Experience
- [ ] Plugin SDK (Go module) — scaffolding, helpers, testing tools
- [ ] Plugin template repository — quickstart for new plugin development
- [ ] Local plugin development mode — hot-reload, debug logging
- [ ] Plugin documentation and API reference

---

## Phase 26: Server Templates & Config Sync (Planned)

**Priority: Medium**

Define what a server should look like, apply it, and detect when it drifts.

- [ ] Server template builder — define expected state (packages, services, firewall rules, users, files)
- [ ] Template library — save and reuse templates (e.g., "Web Server", "Database Server", "Mail Server")
- [ ] Apply template to server — install packages, configure services, set firewall rules via agent
- [ ] Config drift detection — periodic comparison of actual vs. expected state
- [ ] Drift report UI — visual diff showing what changed and when
- [ ] Auto-remediation option — automatically fix drift back to template (with approval toggle)
- [ ] Template versioning — track changes to templates over time
- [ ] Template inheritance — base template + role-specific overrides
- [ ] Bulk apply — roll out template changes across server groups
- [ ] Compliance dashboard — percentage of fleet in compliance per template

---

## Phase 27: Multi-Tenancy & Workspaces (Planned)

**Priority: Medium**

Isolate servers by team, client, or project. Essential for agencies, MSPs, and larger teams.

- [ ] Workspace model — isolated container for servers, users, and settings
- [ ] Workspace CRUD — create, rename, archive workspaces
- [ ] Server assignment — each server belongs to exactly one workspace
- [ ] User workspace membership — users can belong to multiple workspaces with different roles
- [ ] Workspace switching — quick-switch dropdown in the header
- [ ] Per-workspace settings — notification preferences, default templates, branding
- [ ] Workspace-scoped API keys — API keys restricted to a single workspace
- [ ] Cross-workspace admin view — super-admin can see all workspaces and usage
- [ ] Workspace usage quotas — limit servers, users, or API calls per workspace
- [ ] Workspace billing integration — track resource usage per workspace for invoicing

---

## Phase 28: Advanced SSL Features (Planned)

**Priority: Medium**

- [x] Certificate expiry monitoring
- [ ] Wildcard SSL certificates via DNS-01 challenge
- [ ] Multi-domain certificates (SAN)
- [ ] Custom certificate upload (key + cert + chain)
- [ ] Certificate expiry notifications (email/webhook alerts before expiration)
- [ ] SSL configuration templates (modern, intermediate, legacy compatibility)
- [ ] SSL health check dashboard (grade, cipher suites, protocol versions)

---

## Phase 29: DNS Zone Management (Planned)

**Priority: Medium**

Full DNS record management with provider API integration.

- [ ] DNS zone editor UI (A, AAAA, CNAME, MX, TXT, SRV, CAA records)
- [ ] Cloudflare API integration (list/create/update/delete records)
- [ ] Route53 API integration
- [ ] DigitalOcean DNS integration
- [ ] DNS propagation checker (query multiple nameservers)
- [ ] Auto-generate recommended records for hosted services (SPF, DKIM, DMARC, MX)
- [ ] DNS template presets (e.g., "standard web hosting", "email hosting")
- [ ] Bulk record import/export (BIND zone file format)

---

## Phase 30: Nginx Advanced Configuration (Planned)

**Priority: Medium**

Go beyond basic virtual hosts — full reverse proxy and performance configuration.

- [ ] Visual reverse proxy rule builder (upstream servers, load balancing methods)
- [ ] Load balancing configuration (round-robin, least connections, IP hash)
- [ ] Caching rules editor (proxy cache zones, TTLs, cache bypass rules)
- [ ] Rate limiting at proxy level (per-IP, per-route)
- [ ] Custom location block editor with syntax validation
- [ ] Header manipulation (add/remove/modify request/response headers)
- [ ] Nginx config syntax check before applying changes
- [ ] Config diff preview before saving
- [ ] Access/error log viewer per virtual host

---

## Phase 31: Status Page & Health Checks (Planned)

**Priority: Medium**

Public-facing status page and automated health monitoring.

- [ ] Automated health checks (HTTP, TCP, DNS, SMTP) with configurable intervals
- [ ] Public status page (standalone URL, no auth required)
- [ ] Status page customization (logo, colors, custom domain)
- [ ] Service grouping on status page (e.g., "Web Services", "Email", "APIs")
- [ ] Incident management — create, update, resolve incidents with timeline
- [ ] Uptime percentage display (24h, 7d, 30d, 90d)
- [ ] Scheduled maintenance windows with advance notifications
- [ ] Status page subscribers (email/webhook notifications on incidents)
- [ ] Historical uptime graphs
- [ ] Status badge embeds (SVG/PNG for README files)

---

## Phase 32: Server Provisioning APIs (Planned)

**Priority: Medium**

Spin up and manage cloud servers directly from the panel.

- [ ] DigitalOcean API integration (create/destroy/resize droplets)
- [ ] Hetzner Cloud API integration
- [ ] Vultr API integration
- [ ] Linode/Akamai API integration
- [ ] Server creation wizard (region, size, OS, SSH keys)
- [ ] Auto-install ServerKit agent on provisioned servers
- [ ] Server cost tracking and billing overview
- [ ] Snapshot management (create/restore/delete)
- [ ] One-click server cloning
- [ ] Destroy server with confirmation safeguards

---

## Phase 33: Performance Optimization (Planned)

**Priority: Low**

- [ ] Redis caching for frequently accessed data (metrics, server status)
- [ ] Database query optimization and slow query logging
- [ ] Background job queue (Celery or RQ) for long-running tasks
- [ ] Lazy loading for large datasets (paginated API responses)
- [ ] WebSocket connection pooling and reconnection improvements
- [ ] Frontend bundle optimization and code splitting

---

## Phase 34: Mobile App (Future)

**Priority: Low — v3.0+**

- [ ] React Native or PWA mobile application
- [ ] Push notifications for alerts and incidents
- [ ] Quick actions (restart services, view stats, acknowledge alerts)
- [ ] Biometric authentication (fingerprint/Face ID)
- [ ] Offline mode with cached server status

---

## Phase 35: Marketplace & Extensions (Future)

**Priority: Low — v3.0+**

- [ ] Plugin/extension system with API hooks
- [ ] Community marketplace for plugins
- [ ] Custom dashboard widgets
- [ ] Theme customization (colors, layout, branding)
- [ ] Extension SDK and developer documentation

---

## Version Milestones

| Version | Target Features | Status |
|---------|-----------------|--------|
| v0.9.0 | Core features, 2FA, Notifications, Security | Completed |
| v1.0.0 | Production-ready stable release, DB migrations | Completed |
| v1.1.0 | Multi-server, Git deployment | Completed |
| v1.2.0 | Backups, Advanced SSL, Advanced Security | Completed |
| v1.3.0 | Email server, API enhancements | Completed |
| v1.4.0 | Team & permissions, SSO & OAuth login | Completed |
| v1.5.0 | New UI, customizable sidebar, migration wizard UI | Current |
| v1.6.0 | Container monitoring UI, agent fleet management | Planned |
| v1.7.0 | Cross-server monitoring, agent plugin system | Planned |
| v1.8.0 | Server templates, multi-tenancy | Planned |
| v1.9.0 | Advanced SSL, DNS management, Nginx config | Planned |
| v2.0.0 | Status pages, server provisioning, performance | Planned |
| v3.0.0 | Mobile app, Marketplace | Future |

---

## Contributing

Want to help? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Priority areas for contributions:**
- Agent plugin SDK and example plugins
- Fleet management and monitoring dashboard
- DNS provider integrations (Cloudflare, Route53)
- Status page and health check system
- UI/UX improvements
- Documentation

---

## Feature Requests

Have a feature idea? Open an issue on GitHub with the `enhancement` label.

---

<p align="center">
  <strong>ServerKit Roadmap</strong><br>
  Last updated: March 2026
</p>
