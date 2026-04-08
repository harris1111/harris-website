---
title: "Automated VM Provisioning with Cloud-Init Templates"
date: "2025-10-25"
tags: ["cloud-init", "proxmox", "automation", "infrastructure"]
description: "How we built 6 cloud-init template variants that provision hardened VMs in under 2 minutes"
published: true
---

# Automated VM Provisioning with Cloud-Init Templates

Manually installing and configuring VMs is a waste of time. Worse, it's a source of configuration drift — every manual step is an opportunity for inconsistency. When VM number 15 has a slightly different SSH config than VM number 1 because the person who set it up forgot one hardening step, you've created a security gap that's invisible until it's exploited.

With cloud-init templates on Proxmox, we provision fully hardened VMs in under 2 minutes. Every VM is identical to its template. Every security baseline is enforced automatically. This post covers the full system: template design, variant architecture, the user-data configuration that handles everything from SSH hardening to LUKS encryption, and integration with Proxmox's API for programmatic provisioning.

## The Problem Was Manual and Invisible

Before cloud-init, our VM provisioning process looked like this:

1. Create VM in Proxmox UI (5 min)
2. Boot Ubuntu installer ISO, click through wizard (15 min)
3. SSH in, create deploy user, set up sudo (5 min)
4. Install base packages: fail2ban, ufw, unattended-upgrades (5 min)
5. Harden SSH: disable password auth, root login, set MaxAuthTries (3 min)
6. Configure UFW firewall rules (3 min)
7. Install role-specific packages (5-15 min depending on role)
8. Copy SSH keys from a wiki page (2 min)
9. Document the VM's IP and purpose somewhere (2 min)

**Total: 45-60 minutes per VM.** For 28 VMs, that's over 20 hours of manual work.

But the time wasn't even the worst part. The real problem was drift:

- VM 3 had `MaxAuthTries 5` while every other VM had `MaxAuthTries 3` — someone fat-fingered it
- VM 12 was missing fail2ban entirely — the installer forgot that step
- VM 19 had the old SSH key for a developer who left 3 months ago
- Nobody could tell which VMs were configured correctly without SSHing into each one and checking

Cloud-init solved all of this.

## Cloud-Init Architecture

Cloud-init is a standard for initializing cloud instances. It runs once on first boot, reads configuration from a datasource (in Proxmox's case, a virtual CD-ROM), and applies it. The configuration is declarative YAML — you describe the desired state, cloud-init makes it happen.

Our architecture uses a template hierarchy:

```
Golden Image (Ubuntu 22.04 LTS cloud image)
  └── Proxmox VM Template (ID 9000-9005)
       └── cloud-init user-data (YAML)
            ├── Base configuration (all VMs)
            │   ├── Deploy user creation
            │   ├── SSH key injection
            │   ├── Base package installation
            │   └── Security hardening scripts
            └── Role-specific extensions
                ├── Kernel tuning (K3s nodes)
                ├── LUKS encryption (databases)
                ├── Monitoring agents (all except gateway)
                └── VPN configuration (gateway)
```

## Building the Golden Image

The golden image is a Proxmox VM template created from Ubuntu's official cloud image. We build it once and clone it for all templates:

```bash
#!/bin/bash
# create-golden-image.sh — Run once to create the base template

VMID=9000
IMAGE_URL="https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
IMAGE_FILE="/tmp/ubuntu-22.04-cloud.img"
STORAGE="local-zfs"

# Download Ubuntu cloud image
wget -O ${IMAGE_FILE} ${IMAGE_URL}

# Create VM with no OS installed
qm create ${VMID} --name "ubuntu-2204-base" \
  --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 \
  --scsihw virtio-scsi-single

# Import the cloud image as the VM's disk
qm set ${VMID} --scsi0 ${STORAGE}:0,import-from=${IMAGE_FILE}

# Add cloud-init drive (virtual CD-ROM that cloud-init reads)
qm set ${VMID} --ide2 ${STORAGE}:cloudinit

# Set boot order: disk first
qm set ${VMID} --boot order=scsi0

# Enable QEMU guest agent (for Proxmox to query VM state)
qm set ${VMID} --agent enabled=1

# Convert to template (immutable — can only be cloned, not started)
qm template ${VMID}

echo "Golden image template created: VM ${VMID}"
```

This template is ~700MB and serves as the base for all 6 variants. Cloning is instant (ZFS clone) — Proxmox creates a copy-on-write snapshot, not a full copy.

## Template Variants

Each variant extends the base with role-specific configuration. We maintain 6 variants:

| Template | VM ID | Purpose | Key Additions |
|----------|-------|---------|---------------|
| base | 9000 | General-purpose VM | fail2ban, ufw, SSH hardening |
| k3s-node | 9001 | Kubernetes node | containerd, kernel tuning, cgroup v2 |
| dev-container | 9002 | Developer workspace | git, docker, Node/Go/Rust toolchains |
| database | 9003 | Database server | LUKS encryption, storage tuning, pg_client |
| monitor | 9004 | Monitoring agent | node-exporter, Alloy, Prometheus exporters |
| gateway | 9005 | VPN/network gateway | wireguard, iptables, IP forwarding |

## The Base User-Data (All VMs Get This)

Every VM — regardless of role — gets the base configuration. This is our security baseline:

```yaml
#cloud-config
hostname: ${HOSTNAME}
manage_etc_hosts: true
timezone: Asia/Ho_Chi_Minh

# Create the deploy user — the only user that can SSH in
users:
  - name: deploy
    groups: sudo, docker
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    lock_passwd: true  # No password login, ever
    ssh_authorized_keys:
      - ${SSH_PUBLIC_KEY}

# Update packages on first boot
package_update: true
package_upgrade: true

# Base packages for every VM
packages:
  - fail2ban
  - ufw
  - unattended-upgrades
  - apt-listchanges
  - curl
  - jq
  - htop
  - tmux
  - qemu-guest-agent

# Write configuration files
write_files:
  # SSH hardening — defense in depth
  - path: /etc/ssh/sshd_config.d/hardening.conf
    content: |
      # Disable password authentication entirely
      PasswordAuthentication no
      ChallengeResponseAuthentication no
      # No root SSH access
      PermitRootLogin no
      # Limit authentication attempts
      MaxAuthTries 3
      # Disconnect idle sessions after 5 minutes
      ClientAliveInterval 300
      ClientAliveCountMax 2
      # Only allow the deploy user
      AllowUsers deploy
      # Disable X11 and agent forwarding (attack surface reduction)
      X11Forwarding no
      AllowAgentForwarding no
    permissions: "0644"

  # fail2ban config — block brute-force SSH attempts
  - path: /etc/fail2ban/jail.local
    content: |
      [sshd]
      enabled = true
      port = ssh
      filter = sshd
      maxretry = 3
      findtime = 600
      bantime = 3600
      # Ban for 1 hour after 3 failed attempts in 10 minutes
    permissions: "0644"

  # Automatic security updates — unattended-upgrades config
  - path: /etc/apt/apt.conf.d/50unattended-upgrades
    content: |
      Unattended-Upgrade::Allowed-Origins {
        "${distro_id}:${distro_codename}-security";
        "${distro_id}ESMApps:${distro_codename}-apps-security";
      };
      Unattended-Upgrade::AutoFixInterruptedDpkg "true";
      Unattended-Upgrade::Remove-Unused-Dependencies "true";
      Unattended-Upgrade::Automatic-Reboot "false";
    permissions: "0644"

# Run commands after packages are installed
runcmd:
  # Enable and configure UFW
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp comment 'SSH'
  - ufw --force enable

  # Start services
  - systemctl enable --now fail2ban
  - systemctl enable --now qemu-guest-agent
  - systemctl restart sshd

  # Remove default ubuntu user if it exists
  - userdel -r ubuntu 2>/dev/null || true

  # Log provisioning completion
  - echo "cloud-init provisioning complete at $(date)" >> /var/log/cloud-init-done.log
```

## K3s Node Template Extension

K3s nodes need specific kernel parameters and container runtime prerequisites:

```yaml
# Appended to base user-data for k3s-node template
packages:
  - containerd
  - crictl
  - conntrack
  - socat

write_files:
  # Kernel parameters for Kubernetes networking
  - path: /etc/sysctl.d/99-k3s.conf
    content: |
      # Enable IP forwarding for pod networking
      net.ipv4.ip_forward = 1
      net.ipv6.conf.all.forwarding = 1
      # Increase connection tracking table
      net.netfilter.nf_conntrack_max = 131072
      # Bridge traffic passes through iptables
      net.bridge.bridge-nf-call-iptables = 1
      net.bridge.bridge-nf-call-ip6tables = 1
      # Increase inotify limits (many pods watching files)
      fs.inotify.max_user_instances = 512
      fs.inotify.max_user_watches = 524288
    permissions: "0644"

  # Kernel modules for networking
  - path: /etc/modules-load.d/k3s.conf
    content: |
      br_netfilter
      overlay
      ip_conntrack
    permissions: "0644"

runcmd:
  # Load kernel modules immediately
  - modprobe br_netfilter
  - modprobe overlay
  # Apply sysctl settings
  - sysctl --system
  # Enable cgroup v2 (required for K3s resource limiting)
  - |
    if ! grep -q "systemd.unified_cgroup_hierarchy=1" /proc/cmdline; then
      sed -i 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1"/' /etc/default/grub
      update-grub
    fi
  # Allow K3s API server port
  - ufw allow 6443/tcp comment 'K3s API'
  - ufw allow 10250/tcp comment 'Kubelet'
  - ufw allow 8472/udp comment 'Flannel VXLAN'
```

## Database Template: LUKS Encryption

Database VMs get a second disk that's encrypted with LUKS. The data directory (`/var/lib/postgresql` or `/var/lib/mongodb`) lives on this encrypted volume:

```yaml
# Database template extension
write_files:
  - path: /usr/local/bin/setup-encrypted-storage.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      set -euo pipefail

      DEVICE="/dev/vdb"
      MAPPER_NAME="data"
      MOUNT_POINT="/var/lib/postgresql"
      KEY_FILE="/tmp/luks.key"

      # Wait for the second disk to appear
      for i in $(seq 1 30); do
        [ -b ${DEVICE} ] && break
        sleep 1
      done

      if [ ! -b ${DEVICE} ]; then
        echo "ERROR: ${DEVICE} not found after 30 seconds"
        exit 1
      fi

      # Generate random encryption key
      dd if=/dev/urandom of=${KEY_FILE} bs=4096 count=1 2>/dev/null

      # Format with LUKS
      cryptsetup luksFormat ${DEVICE} --batch-mode --key-file ${KEY_FILE} \
        --cipher aes-xts-plain64 --key-size 256 --hash sha256

      # Open the encrypted volume
      cryptsetup luksOpen ${DEVICE} ${MAPPER_NAME} --key-file ${KEY_FILE}

      # Create filesystem with performance tuning
      mkfs.ext4 -E lazy_itable_init=0,lazy_journal_init=0 /dev/mapper/${MAPPER_NAME}

      # Mount
      mkdir -p ${MOUNT_POINT}
      mount /dev/mapper/${MAPPER_NAME} ${MOUNT_POINT}

      # Set ownership for postgres user (will be created when PostgreSQL is installed)
      chown -R 999:999 ${MOUNT_POINT}

      # CRITICAL: Destroy the key file from disk
      shred -vfz -n 5 ${KEY_FILE}
      rm -f ${KEY_FILE}

      echo "Encrypted storage configured at ${MOUNT_POINT}"

runcmd:
  - /usr/local/bin/setup-encrypted-storage.sh
  # Storage tuning for databases
  - |
    cat >> /etc/sysctl.d/99-database.conf << 'EOF'
    # Increase shared memory for PostgreSQL
    kernel.shmmax = 8589934592
    kernel.shmall = 2097152
    # Reduce swappiness — databases prefer RAM
    vm.swappiness = 10
    # Increase dirty page ratio for write-heavy workloads
    vm.dirty_ratio = 40
    vm.dirty_background_ratio = 10
    EOF
  - sysctl --system
  # Allow PostgreSQL port from K3s subnet only
  - ufw allow from 10.10.2.0/24 to any port 5432 comment 'PostgreSQL from K3s'
```

**Security note**: The LUKS key is generated on first boot, used to format and open the volume, then shredded. After reboot, the key must be provided from an external source (we use HashiCorp Vault with auto-unseal). This means a stolen disk is unreadable — the key never touches persistent storage.

## Proxmox Integration: The Provisioning Script

Putting it all together — a single script that provisions any VM type:

```bash
#!/bin/bash
# provision.sh — Full VM provisioning from template to SSH-ready
set -euo pipefail

usage() {
  echo "Usage: $0 <template> <vmid> <hostname> <ip> [disk_size_gb]"
  echo "Templates: base, k3s-node, dev-container, database, monitor, gateway"
  echo "Example: $0 k3s-node 201 worker-4 10.10.2.4 50"
  exit 1
}

[ $# -lt 4 ] && usage

TEMPLATE_NAME=$1
VMID=$2
HOSTNAME=$3
IP=$4
DISK_SIZE=${5:-30}

# Map template name to VM ID
declare -A TEMPLATE_MAP=(
  [base]=9000 [k3s-node]=9001 [dev-container]=9002
  [database]=9003 [monitor]=9004 [gateway]=9005
)
TEMPLATE_ID=${TEMPLATE_MAP[$TEMPLATE_NAME]}

# Determine gateway based on subnet
IFS='.' read -ra OCTETS <<< "$IP"
GATEWAY="${OCTETS[0]}.${OCTETS[1]}.${OCTETS[2]}.1"

echo "Provisioning ${HOSTNAME} (${TEMPLATE_NAME}) at ${IP}..."

# Clone template
qm clone ${TEMPLATE_ID} ${VMID} --name ${HOSTNAME} --full

# Configure cloud-init
qm set ${VMID} --ciuser deploy
qm set ${VMID} --sshkey /root/.ssh/authorized_keys
qm set ${VMID} --ipconfig0 ip=${IP}/24,gw=${GATEWAY}
qm set ${VMID} --nameserver 10.10.0.1
qm set ${VMID} --searchdomain internal.lab

# Resize primary disk
qm resize ${VMID} scsi0 ${DISK_SIZE}G

# Add second disk for database templates (encrypted storage)
if [ "${TEMPLATE_NAME}" = "database" ]; then
  qm set ${VMID} --scsi1 local-zfs:50
  echo "Added 50GB encrypted data disk"
fi

# Start VM
qm start ${VMID}

# Wait for SSH
echo "Waiting for SSH..."
for i in $(seq 1 60); do
  ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no deploy@${IP} "echo ready" 2>/dev/null && break
  sleep 2
done

echo ""
echo "=== VM Provisioned ==="
echo "Name:     ${HOSTNAME}"
echo "Type:     ${TEMPLATE_NAME}"
echo "VMID:     ${VMID}"
echo "IP:       ${IP}"
echo "SSH:      ssh deploy@${IP}"
echo "Disk:     ${DISK_SIZE}GB"
echo "======================"
```

Provisioning our entire K3s cluster (6 nodes):

```bash
./provision.sh k3s-node 101 control-1 10.10.1.1 30
./provision.sh k3s-node 102 control-2 10.10.1.2 30
./provision.sh k3s-node 103 control-3 10.10.1.3 30
./provision.sh k3s-node 201 worker-1  10.10.2.1 50
./provision.sh k3s-node 202 worker-2  10.10.2.2 50
./provision.sh k3s-node 203 worker-3  10.10.2.3 50
```

6 VMs, fully configured, security-hardened, ready for K3s installation — in 12 minutes total.

## Testing Templates

A broken cloud-init template is insidious — the VM boots, looks healthy in Proxmox, but the configuration didn't apply. You don't find out until you SSH in and discover fail2ban isn't installed or the firewall isn't configured.

We test templates with a validation script that runs after provisioning:

```bash
#!/bin/bash
# validate-vm.sh — Verify cloud-init applied correctly
IP=$1
CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
  local desc=$1
  local cmd=$2
  if ssh deploy@${IP} "${cmd}" &>/dev/null; then
    echo "  ✓ ${desc}"
    ((CHECKS_PASSED++))
  else
    echo "  ✗ ${desc}"
    ((CHECKS_FAILED++))
  fi
}

echo "Validating VM at ${IP}..."
check "SSH as deploy user" "whoami"
check "fail2ban running" "systemctl is-active fail2ban"
check "UFW enabled" "sudo ufw status | grep -q 'Status: active'"
check "Password auth disabled" "grep -q 'PasswordAuthentication no' /etc/ssh/sshd_config.d/hardening.conf"
check "Root login disabled" "grep -q 'PermitRootLogin no' /etc/ssh/sshd_config.d/hardening.conf"
check "qemu-guest-agent running" "systemctl is-active qemu-guest-agent"
check "unattended-upgrades installed" "dpkg -l | grep -q unattended-upgrades"

echo ""
echo "Results: ${CHECKS_PASSED} passed, ${CHECKS_FAILED} failed"
[ ${CHECKS_FAILED} -eq 0 ] && echo "VM validated successfully!" || echo "WARNING: Some checks failed!"
```

## Results

- **VM provisioning time**: 45 minutes → 2 minutes (96% reduction)
- **28 VMs** running from 6 templates, all with identical security baselines
- **Zero configuration drift** — every VM is a clone of a tested template
- **Audit trail**: cloud-init logs in `/var/log/cloud-init-output.log` document exactly what was configured
- **New team member onboarding**: provision a dev container in 2 minutes instead of a half-day setup

## Lessons Learned

**1. Template the template.** Use environment variables and parameterized scripts in cloud-init YAML so you can generate per-VM configs programmatically. Hardcoded values in user-data files mean you need a separate template for every VM — defeating the purpose.

**2. Test templates in isolation before using them.** A broken cloud-init template produces a VM that boots but isn't configured — it looks healthy in Proxmox but is missing critical security hardening. Our validation script catches these issues automatically.

**3. YubiKey SSH auth is worth the friction.** With 28 VMs all trusting the same SSH key, a compromised key means full infrastructure access. Hardware security keys (YubiKey) prevent key theft — even if an attacker compromises a developer's laptop, they can't extract the SSH key because it never leaves the YubiKey.

**4. Shred your LUKS keys.** The key file used to format an encrypted volume must never persist on disk. Generate, use, shred. If the key is on the VM's unencrypted root disk, LUKS encryption is security theater — an attacker with disk access gets both the encrypted volume and the key.

**5. Version your templates like code.** We store template user-data files in git. When we change the SSH hardening config, we can see exactly what changed, when, and why. Rolling back a bad template change is a `git revert` + template rebuild, not "which VMs did we provision since Thursday?"
