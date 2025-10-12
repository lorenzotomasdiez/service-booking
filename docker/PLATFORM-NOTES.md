# Platform-Specific Notes

## Overview

This guide covers platform-specific considerations for running the BarberPro Docker development environment. Each platform has unique characteristics, quirks, and optimizations that developers should be aware of to ensure the best development experience.

## Table of Contents

- [macOS](#macos)
  - [Intel Macs](#intel-macs)
  - [Apple Silicon (M1/M2/M3)](#apple-silicon-m1m2m3)
  - [Configuration](#configuration)
  - [Common Issues](#common-issues-macos)
- [Linux](#linux)
  - [User Permissions](#user-permissions)
  - [systemd Integration](#systemd-integration)
  - [SELinux](#selinux-fedorarhel)
  - [Common Issues](#common-issues-linux)
- [Windows (WSL2)](#windows-wsl2)
  - [Setup](#setup)
  - [Path Handling](#path-handling)
  - [Line Endings](#line-endings)
  - [File Permissions](#file-permissions)
  - [Common Issues](#common-issues-wsl2)
- [Platform Comparison](#platform-comparison)

---

## macOS

macOS is a popular development platform with excellent Docker Desktop support. Both Intel and Apple Silicon architectures are fully supported.

### Requirements

- **Docker Desktop for Mac** 4.0 or later (4.25+ recommended)
- **macOS** 11 (Big Sur) or later
- **RAM**: At least 8GB allocated to Docker Desktop
- **Disk Space**: 50GB minimum for images and volumes
- **Xcode Command Line Tools**: For `make` and `lsof` commands

### Installation

```bash
# Install Docker Desktop from:
# https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version

# Verify make is installed
make --version
```

### Apple Silicon (M1/M2/M3)

Apple Silicon Macs offer excellent Docker performance with native ARM64 support.

**Advantages**:
- Native ARM64 containers run faster than x86_64 emulation
- Better power efficiency
- Lower memory usage
- PostgreSQL and Redis have native arm64 images
- Most Node.js packages support ARM64

**Image Compatibility**:
- All official images (postgres, redis, nginx) have arm64 variants
- Multi-platform images automatically use the correct architecture
- Some legacy or niche images may require Rosetta 2

**If you encounter arm64 issues**:
```bash
# Force x86_64 architecture for specific service
docker run --platform linux/amd64 postgres:16-alpine

# In docker-compose.yml:
services:
  some-service:
    platform: linux/amd64
    image: legacy-image:latest
```

**Performance**: Typically 20-30% faster than Intel Macs for Docker workloads.

### Intel Macs

Intel Macs run standard x86_64 Docker images with full compatibility.

**Characteristics**:
- Complete compatibility with all Docker images
- Slightly slower than Apple Silicon
- Higher memory usage under load
- Excellent stability and maturity

**Performance**: Solid performance, especially with SSD and 16GB+ RAM.

### Configuration

**Docker Desktop Settings** (Recommended):

1. **Resources > Memory**: 8GB minimum, 12GB recommended
2. **Resources > CPUs**: 4 cores minimum, 6 recommended
3. **Resources > Disk**: 50GB minimum
4. **General > Use VirtioFS**: Enable for better file sharing performance
5. **General > Use Rosetta for x86/amd64**: Enable on Apple Silicon

**Environment Variables**:
```bash
# Add to .env if file watching doesn't work
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
```

### Common Issues (macOS)

#### File Watching Not Working

**Symptom**: Frontend hot reload doesn't work, changes aren't detected

**Solution**:
```bash
# Add to your .env file
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true

# Restart the frontend service
make restart
```

**Why**: macOS volume mounts sometimes miss file system events. Polling mode explicitly checks for changes.

#### Slow Volume Performance

**Symptom**: Docker operations are slow, especially with node_modules

**Solution 1**: Use VirtioFS (Docker Desktop 4.6+)
```bash
# Settings > General > Use VirtioFS file sharing
# Restart Docker Desktop
```

**Solution 2**: Use named volumes for node_modules
```yaml
# In docker-compose.yml
volumes:
  - ./backend:/app
  - backend_node_modules:/app/node_modules  # Named volume

volumes:
  backend_node_modules:
```

**Why**: macOS file sharing between host and container has overhead. VirtioFS and named volumes improve performance.

#### Docker Desktop Not Starting

**Symptom**: Docker Desktop crashes or hangs on startup

**Solutions**:
1. **Restart**: Quit Docker Desktop completely (Command+Q), then reopen
2. **Clear cache**: Remove `~/Library/Containers/com.docker.docker`
3. **Reset to factory defaults**: Docker Desktop > Troubleshoot > Reset to factory defaults
4. **Update**: Check for Docker Desktop updates

#### Resource Limits Exceeded

**Symptom**: "Not enough memory" or services crash

**Solution**:
```bash
# Increase Docker Desktop memory allocation
# Settings > Resources > Memory: 8GB → 12GB

# Verify with:
docker system info | grep Memory
```

#### Port Conflicts

**Symptom**: "Port 5432 is already in use"

**Solution**:
```bash
# Find what's using the port
lsof -ti:5432

# Kill the process (if safe)
kill -9 $(lsof -ti:5432)

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead
```

---

## Linux

Linux provides the best Docker performance with native container support (no VM overhead).

### Requirements

- **Docker Engine** 20.10 or later (24.0+ recommended)
- **Docker Compose** v2 (2.0+)
- **Kernel**: 4.0 or later (5.0+ recommended)
- **Distribution**: Ubuntu 22.04 LTS (recommended), Debian, Fedora, or Arch
- **Make**: GNU Make 4.0+

### Installation

#### Ubuntu/Debian

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt update
sudo apt install docker-compose-plugin

# Install make
sudo apt install make

# Verify installation
docker --version
docker compose version
make --version
```

#### Fedora/RHEL

```bash
# Install Docker
sudo dnf install docker docker-compose

# Install make
sudo dnf install make

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### User Permissions

By default, Docker requires root privileges. Add your user to the docker group:

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or use newgrp)
newgrp docker

# Verify (no sudo needed)
docker ps
docker info
```

**Security Note**: Users in the docker group have effective root access. Only add trusted users.

### systemd Integration

Docker on Linux uses systemd for service management:

```bash
# Start Docker service
sudo systemctl start docker

# Stop Docker service
sudo systemctl stop docker

# Enable Docker on boot
sudo systemctl enable docker

# Check Docker status
sudo systemctl status docker

# View Docker logs
sudo journalctl -u docker -f
```

### SELinux (Fedora/RHEL)

SELinux can interfere with Docker volume mounts. Solutions:

**Option 1**: Add `:z` flag to volume mounts (recommended)
```yaml
# In docker-compose.yml
volumes:
  - ./data:/var/lib/postgresql/data:z  # SELinux relabel for single container
  - ./shared:/shared:Z                 # SELinux relabel for sharing
```

**Option 2**: Set SELinux to permissive mode (not recommended for production)
```bash
# Temporarily set to permissive
sudo setenforce 0

# Check status
getenforce
```

### Common Issues (Linux)

#### Permission Denied

**Symptom**: `permission denied while trying to connect to Docker daemon`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login, or use:
newgrp docker

# Verify
groups | grep docker
```

#### Docker Service Not Running

**Symptom**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# Check Docker status
sudo systemctl status docker

# Start Docker if stopped
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Verify
docker info
```

#### Port Conflicts

**Symptom**: "Address already in use"

**Solution**:
```bash
# Find process using the port
sudo lsof -i :5432
# Or use ss:
sudo ss -tulpn | grep 5432

# Kill the process
sudo kill -9 <PID>
```

#### SELinux Blocks Volume Mounts

**Symptom**: `Permission denied` accessing volumes even with correct ownership

**Solution**:
```bash
# Add :z flag to volumes in docker-compose.yml
volumes:
  - ./data:/data:z

# Or check SELinux status
getenforce
# If enforcing, check logs:
sudo ausearch -m avc -ts recent
```

#### Storage Driver Issues

**Symptom**: Slow performance or errors with overlayfs2

**Solution**:
```bash
# Check current storage driver
docker info | grep "Storage Driver"

# Edit Docker daemon config
sudo nano /etc/docker/daemon.json

# Add:
{
  "storage-driver": "overlay2"
}

# Restart Docker
sudo systemctl restart docker
```

### Performance

Linux offers the best Docker performance:

- **Native execution**: No VM overhead
- **Fast volumes**: Direct file system access
- **Low memory overhead**: Containers share host kernel
- **Superior I/O**: Direct device access

**Expected Performance**:
- Cold start: 30-40 seconds
- Warm start: 6-10 seconds
- Memory overhead: Minimal (~100MB for Docker daemon)

---

## Windows (WSL2)

Windows Subsystem for Linux 2 (WSL2) provides excellent Docker support with near-native Linux performance.

### Requirements

- **Windows 10** (version 2004+) or **Windows 11**
- **WSL2** enabled and installed
- **Docker Desktop for Windows** with WSL2 backend
- **Ubuntu 22.04** WSL distribution (recommended)
- **At least 8GB system RAM** (Docker + WSL2 overhead)

### Setup

#### 1. Install WSL2

```powershell
# In PowerShell (Administrator)
wsl --install

# Or install specific distribution
wsl --install -d Ubuntu-22.04

# Verify WSL2 is default
wsl --list --verbose
```

#### 2. Install Docker Desktop

1. Download Docker Desktop for Windows from https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Open Docker Desktop Settings
4. Go to **General** → Enable "Use WSL 2 based engine"
5. Go to **Resources > WSL Integration**
6. Enable integration with your Ubuntu distribution
7. Click "Apply & Restart"

#### 3. Install Tools in WSL2

```bash
# Open Ubuntu WSL terminal
wsl -d Ubuntu-22.04

# Update packages
sudo apt update && sudo apt upgrade -y

# Install make and tools
sudo apt install make dos2unix -y

# Verify Docker access (no sudo needed)
docker --version
docker ps

# If docker not found, restart Docker Desktop
```

#### 4. Clone Project in WSL Filesystem

**CRITICAL**: Always clone projects in the WSL filesystem, NOT the Windows filesystem.

```bash
# Good - WSL filesystem (fast)
cd ~
mkdir -p projects
cd projects
git clone https://github.com/your-org/service-booking.git

# Bad - Windows filesystem (very slow!)
cd /mnt/c/Users/YourName/projects  # DON'T DO THIS
```

**Why**: File I/O across the Windows/WSL boundary is 10-50x slower.

### Path Handling

Understanding WSL2 paths is critical for performance.

**WSL Filesystem** (fast):
```bash
/home/username/projects/service-booking     # Native Linux FS
~/projects/service-booking                   # Home directory
```

**Windows Filesystem Mounted** (slow):
```bash
/mnt/c/Users/YourName/projects/service-booking  # Avoid for Docker!
/mnt/d/projects/service-booking                 # Avoid for Docker!
```

**How to Check Where You Are**:
```bash
# If path starts with /mnt/c or /mnt/d, you're in Windows FS (slow)
pwd

# Move to WSL filesystem
cd ~/projects/service-booking
```

**Accessing WSL Files from Windows**:
```
# In Windows File Explorer, type:
\\wsl$\Ubuntu-22.04\home\username\projects

# Or from command line:
explorer.exe .
```

### Line Endings

Windows uses CRLF (`\r\n`) line endings, while Linux uses LF (`\n`). This causes issues with shell scripts.

**Configure Git** (one-time setup):
```bash
# Configure git to use LF line endings
git config --global core.autocrlf input
git config --global core.eol lf

# For existing repos
cd ~/projects/service-booking
git config core.autocrlf input
```

**Fix Existing Files**:
```bash
# Install dos2unix
sudo apt install dos2unix

# Fix all shell scripts
find . -name "*.sh" -exec dos2unix {} \;

# Or fix specific script
dos2unix scripts/setup.sh
```

**Verify Line Endings**:
```bash
# Check file line endings
file scripts/setup.sh
# Should show: "ASCII text" (not "ASCII text, with CRLF line terminators")
```

### File Permissions

Shell scripts need execute permissions to run.

**Fix Permissions**:
```bash
# Make all shell scripts executable
find . -name "*.sh" -exec chmod +x {} \;

# Or fix specific scripts
chmod +x scripts/*.sh
chmod +x Makefile
```

**Check Permissions**:
```bash
ls -la scripts/
# Should show: -rwxr-xr-x (executable)
```

### Common Issues (WSL2)

#### Slow Performance

**Symptom**: Docker operations are extremely slow (minutes instead of seconds)

**Root Cause**: Project is in Windows filesystem (`/mnt/c/`)

**Solution**:
```bash
# Check current location
pwd
# If starts with /mnt/c or /mnt/d, move project!

# Move to WSL filesystem
cd ~
mkdir -p projects
cd projects

# Clone fresh or move existing
git clone <repo-url>
# Or: cp -r /mnt/c/Users/YourName/projects/service-booking .
```

**Performance Impact**:
- Windows filesystem: Cold start 3-5 minutes
- WSL filesystem: Cold start 45-60 seconds

#### Scripts Won't Execute

**Symptom**: `bash: ./scripts/setup.sh: /bin/bash^M: bad interpreter`

**Root Cause**: Windows CRLF line endings

**Solution**:
```bash
# Install dos2unix
sudo apt install dos2unix

# Fix all scripts
dos2unix scripts/*.sh

# Or fix specific script
sed -i 's/\r$//' scripts/setup.sh

# Make executable
chmod +x scripts/*.sh
```

#### Docker Command Not Found in WSL

**Symptom**: `docker: command not found` in WSL terminal

**Solution**:
1. Open Docker Desktop
2. Go to Settings > Resources > WSL Integration
3. Enable integration with your Ubuntu distribution
4. Click "Apply & Restart"
5. Restart WSL terminal: `wsl --shutdown`, then reopen

#### Permission Denied Errors

**Symptom**: `Permission denied` when running scripts

**Solution**:
```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x Makefile

# Verify
ls -la scripts/
```

#### WSL2 Memory Issues

**Symptom**: High memory usage, Windows becomes slow

**Solution**: Create `.wslconfig` file to limit WSL memory

```powershell
# In PowerShell, create file:
notepad $env:USERPROFILE\.wslconfig
```

**Add content**:
```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

**Restart WSL**:
```powershell
wsl --shutdown
# Reopen Ubuntu terminal
```

#### Docker Desktop Integration Not Working

**Symptom**: Docker commands work in PowerShell but not in WSL

**Solution**:
1. Restart Docker Desktop
2. Check Settings > General > "Use WSL 2 based engine" is enabled
3. Check Settings > Resources > WSL Integration
4. Enable for your distribution
5. Run `wsl --shutdown` and restart

### Performance

WSL2 offers near-native Linux performance when used correctly.

**With WSL Filesystem**:
- Cold start: 45-55 seconds
- Warm start: 12-16 seconds
- Memory overhead: ~1GB (WSL2 + Docker)
- Volume performance: Excellent

**With Windows Filesystem** (avoid!):
- Cold start: 3-5 minutes
- Warm start: 30-60 seconds
- Volume performance: Very poor

---

## Platform Comparison

### Performance Summary

| Metric | macOS (M1) | macOS (Intel) | Linux | WSL2 (Good) | WSL2 (Bad) |
|--------|------------|---------------|-------|-------------|------------|
| Cold Start | 40-50s | 50-60s | 30-40s | 45-55s | 3-5min |
| Warm Start | 10-14s | 12-16s | 6-10s | 12-16s | 30-60s |
| Memory Overhead | ~2GB | ~2.5GB | ~100MB | ~1GB | ~1GB |
| Volume I/O | Good | Good | Excellent | Good | Very Poor |
| CPU Efficiency | Excellent | Good | Excellent | Good | Good |

**Notes**:
- WSL2 (Good): Project in WSL filesystem (`~/projects`)
- WSL2 (Bad): Project in Windows filesystem (`/mnt/c/`)

### Feature Comparison

| Feature | macOS (M1) | macOS (Intel) | Linux | WSL2 |
|---------|------------|---------------|-------|------|
| Setup Ease | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Volume Speed | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Compatibility | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Stability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Resource Usage | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### Recommendations

**For Teams**:
- **Mixed platforms**: Ensure all workflows work on all platforms
- **CI/CD**: Use Linux for fastest pipelines
- **Documentation**: Reference this guide for platform-specific quirks

**For Individuals**:
- **Best performance**: Linux native
- **Best balance**: macOS (especially Apple Silicon)
- **Windows users**: Use WSL2 with project in WSL filesystem
- **Legacy Windows**: Upgrade to Windows 11 and WSL2

### Architecture Notes

**Multi-Architecture Support**:
- All images support both `amd64` and `arm64`
- Docker automatically selects the correct architecture
- Force specific architecture with `--platform` flag if needed

**Testing Across Platforms**:
```bash
# Test on current platform
make doctor
make up

# Check architecture
docker inspect barberpro-postgres | grep Architecture

# Force amd64 (for testing)
docker run --platform linux/amd64 postgres:16-alpine
```

---

## Getting Help

### Platform-Specific Documentation

- **macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)
- **Windows/WSL2**: [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)

### Troubleshooting

For common issues across all platforms, see:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](./README.md) - Main Docker documentation
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance baselines and optimization

### Support Channels

1. **Check diagnostics**: `make doctor`
2. **Review logs**: `make logs`
3. **Platform-specific sections**: Above in this document
4. **Team support**: Slack #barberpro-dev
5. **GitHub issues**: Include platform and `make doctor` output

---

**Last Updated**: 2025-10-12
**Applies to**: Docker Desktop 4.25+, Docker Engine 24.0+, WSL2 on Windows 10/11
