#!/usr/bin/env bash
set -Eeuo pipefail

########################################
# ServerKit Uninstaller
########################################

INSTALL_DIR="/opt/serverkit"
DATA_DIR="/var/lib/serverkit"
LOG_DIR="/var/log/serverkit"
LOG_FILE="/var/log/serverkit-uninstall.log"

mkdir -p /var/log
exec > >(tee -a "$LOG_FILE") 2>&1

########################################
# Colors
########################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

########################################
# UI helpers
########################################

print_header() {
    echo -e "${BLUE}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ServerKit Uninstaller"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}! $1${NC}"; }
print_info() { echo -e "${BLUE}→ $1${NC}"; }

########################################
# Root check
########################################

if [[ $EUID -ne 0 ]]; then
    print_error "Please run as root (sudo)"
    exit 1
fi

print_header

########################################
# Confirm uninstall
########################################

echo
read -p "Remove ServerKit completely? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    print_warning "Uninstall cancelled"
    exit 0
fi

########################################
# Stop services
########################################

print_info "Stopping ServerKit service"

systemctl stop serverkit 2>/dev/null || true
systemctl disable serverkit 2>/dev/null || true

print_success "Backend service stopped"

########################################
# Stop containers
########################################

print_info "Stopping Docker containers"

if command -v docker &>/dev/null && [ -d "$INSTALL_DIR" ]; then
    docker compose --project-directory "$INSTALL_DIR" down --remove-orphans 2>/dev/null || true
else
    print_warning "Docker or install directory not found, skipping container cleanup"
fi

print_success "Containers removed"

########################################
# Remove systemd service
########################################

print_info "Removing systemd service"

rm -f /etc/systemd/system/serverkit.service

systemctl daemon-reload

print_success "Systemd service removed"

########################################
# Remove nginx config
########################################

print_info "Removing nginx configuration"

rm -f /etc/nginx/sites-enabled/serverkit.conf 2>/dev/null || true
rm -f /etc/nginx/sites-available/serverkit.conf 2>/dev/null || true

systemctl reload nginx 2>/dev/null || true

print_success "Nginx config removed"

########################################
# Remove files
########################################

print_info "Removing installation files"

rm -rf "$INSTALL_DIR"

print_success "Installation directory removed"

########################################
# Remove data
########################################

print_info "Removing data directory"

rm -rf "$DATA_DIR"
rm -rf /etc/serverkit
rm -rf /var/serverkit

print_success "Data directories removed"

########################################
# Remove logs
########################################

print_info "Removing logs"

rm -rf "$LOG_DIR"

print_success "Log directory removed"

########################################
# Remove CLI
########################################

print_info "Removing CLI command"

rm -f /usr/local/bin/serverkit

print_success "CLI removed"

########################################
# Track uninstall
########################################

curl -s "https://serverkit.ai/track/uninstall" >/dev/null 2>&1 || true

########################################
# Finish
########################################

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ServerKit removed successfully${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo
echo "Uninstall log:"
echo "$LOG_FILE"
echo
