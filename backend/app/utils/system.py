"""Centralized system utilities for subprocess handling.

Provides consistent privilege escalation, distro detection, package management,
and systemd service control so individual services don't need to reinvent these.
"""

import os
import shutil
import subprocess
from typing import List, Optional, Union


def run_privileged(cmd: Union[List[str], str], **kwargs) -> subprocess.CompletedProcess:
    """Run a command with sudo if the current process is not root.

    Prepends ``sudo`` when ``os.geteuid() != 0`` and the command does not
    already start with ``sudo``.  Defaults to ``capture_output=True, text=True``
    but callers can override any kwarg.

    Returns the raw ``CompletedProcess`` so services keep their existing
    error-handling patterns.
    """
    if isinstance(cmd, str):
        # Shell-mode — caller is responsible for quoting
        needs_sudo = os.geteuid() != 0 and not cmd.lstrip().startswith('sudo ')
        if needs_sudo:
            cmd = f'sudo {cmd}'
    else:
        cmd = list(cmd)
        needs_sudo = os.geteuid() != 0 and cmd[0] != 'sudo'
        if needs_sudo:
            cmd = ['sudo'] + cmd

    kwargs.setdefault('capture_output', True)
    kwargs.setdefault('text', True)
    return subprocess.run(cmd, **kwargs)


def is_command_available(cmd: str) -> bool:
    """Check whether *cmd* is available on the system.

    Uses ``shutil.which`` first, then falls back to checking common sbin/local
    paths that may not be on the current ``$PATH``.
    """
    if shutil.which(cmd):
        return True

    for directory in ('/usr/bin', '/usr/sbin', '/usr/local/bin', '/usr/local/sbin'):
        if os.path.exists(os.path.join(directory, cmd)):
            return True

    return False


class PackageManager:
    """Cross-distro package management helpers.

    Detects ``apt``, ``dnf``, or ``yum`` once and caches the result.
    """

    _detected: Optional[str] = None
    _detection_done: bool = False

    @classmethod
    def detect(cls) -> Optional[str]:
        """Return ``'apt'``, ``'dnf'``, ``'yum'``, or ``None``."""
        if cls._detection_done:
            return cls._detected

        for manager in ('apt', 'dnf', 'yum'):
            if shutil.which(manager):
                cls._detected = manager
                cls._detection_done = True
                return cls._detected

        cls._detection_done = True
        return cls._detected

    @classmethod
    def is_available(cls) -> bool:
        """Return ``True`` if any supported package manager was found."""
        return cls.detect() is not None

    @classmethod
    def is_installed(cls, package: str) -> bool:
        """Check whether *package* is installed (cross-distro).

        Uses ``dpkg -s`` on apt systems and ``rpm -q`` on dnf/yum systems.
        Catches ``FileNotFoundError`` so it works on any distro.
        """
        manager = cls.detect()

        if manager == 'apt':
            try:
                result = subprocess.run(
                    ['dpkg', '-s', package],
                    capture_output=True, text=True,
                )
                return (
                    result.returncode == 0
                    and 'Status: install ok installed' in result.stdout
                )
            except FileNotFoundError:
                return False

        if manager in ('dnf', 'yum'):
            try:
                result = subprocess.run(
                    ['rpm', '-q', package],
                    capture_output=True, text=True,
                )
                return result.returncode == 0
            except FileNotFoundError:
                return False

        return False

    @classmethod
    def install(cls, packages: Union[str, List[str]], timeout: int = 300) -> subprocess.CompletedProcess:
        """Install one or more packages (cross-distro).

        Raises ``RuntimeError`` when no supported package manager is found.
        """
        manager = cls.detect()
        if manager is None:
            raise RuntimeError('No supported package manager found (apt/dnf/yum)')

        if isinstance(packages, str):
            packages = [packages]

        cmd = [manager, 'install', '-y'] + packages
        return run_privileged(cmd, timeout=timeout)

    @classmethod
    def reset_cache(cls) -> None:
        """Reset the cached detection (useful in tests)."""
        cls._detected = None
        cls._detection_done = False


class ServiceControl:
    """Thin wrappers around ``systemctl`` that use :func:`run_privileged`."""

    @staticmethod
    def start(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'start', service], **kwargs)

    @staticmethod
    def stop(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'stop', service], **kwargs)

    @staticmethod
    def restart(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'restart', service], **kwargs)

    @staticmethod
    def reload(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'reload', service], **kwargs)

    @staticmethod
    def enable(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'enable', service], **kwargs)

    @staticmethod
    def disable(service: str, **kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'disable', service], **kwargs)

    @staticmethod
    def daemon_reload(**kwargs) -> subprocess.CompletedProcess:
        return run_privileged(['systemctl', 'daemon-reload'], **kwargs)

    @staticmethod
    def is_active(service: str) -> bool:
        """Return ``True`` when the service is active.  No sudo needed."""
        try:
            result = subprocess.run(
                ['systemctl', 'is-active', service],
                capture_output=True, text=True,
            )
            return result.stdout.strip() == 'active'
        except FileNotFoundError:
            return False

    @staticmethod
    def is_enabled(service: str) -> bool:
        """Return ``True`` when the service is enabled.  No sudo needed."""
        try:
            result = subprocess.run(
                ['systemctl', 'is-enabled', service],
                capture_output=True, text=True,
            )
            return result.stdout.strip() == 'enabled'
        except FileNotFoundError:
            return False
