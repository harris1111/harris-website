---
title: "Automated VM Provisioning with Cloud-Init Templates"
date: "2025-10-25"
tags: ["cloud-init", "proxmox", "automation", "infrastructure"]
description: "How we built 6 cloud-init template variants that provision hardened VMs in under 2 minutes"
published: true
---

# Automated VM Provisioning with Cloud-Init Templates

Manually installing and configuring VMs is a waste of time. With cloud-init templates on Proxmox, we provision fully hardened VMs in under 2 minutes.

## The Problem

- Creating a new VM took 30-45 minutes of manual setup
- Each VM had slightly different configurations (drift)
- Security hardening was inconsistent
- No audit trail of what was configured

## Cloud-Init Architecture

```
Base Template (Ubuntu 22.04)
├── cloud-init user-data (YAML)
├── SSH key injection
├── Package installation
└── Post-install scripts
    ├── Security hardening
    ├── Monitoring agent
    └── Role-specific setup
```

## Template Variants

| Template | Base Packages | Extra |
|----------|--------------|-------|
| base | fail2ban, ufw, unattended-upgrades | SSH hardening |
| k3s-node | base + containerd, crictl | Kernel tuning, sysctl |
| dev-container | base + git, docker, build-essential | SSH key injection, dev tools |
| database | base + postgresql-client | LUKS encryption, storage tuning |
| monitor | base + node-exporter, promtail | Prometheus exporters |
| gateway | base + wireguard, iptables | VPN config, NAT rules |

## User-Data Example

```yaml
#cloud-config
hostname: ${HOSTNAME}
manage_etc_hosts: true

users:
  - name: deploy
    groups: sudo, docker
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ${SSH_PUBLIC_KEY}

package_update: true
packages:
  - fail2ban
  - ufw
  - unattended-upgrades
  - curl
  - jq

write_files:
  - path: /etc/ssh/sshd_config.d/hardening.conf
    content: |
      PasswordAuthentication no
      PermitRootLogin no
      MaxAuthTries 3
      ClientAliveInterval 300

runcmd:
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw --force enable
  - systemctl restart sshd
```

## Proxmox Integration

Creating a VM from template:

```bash
# Clone template
qm clone 9000 ${VMID} --name ${HOSTNAME} --full

# Set cloud-init parameters
qm set ${VMID} --ciuser deploy
qm set ${VMID} --sshkey ~/.ssh/authorized_keys
qm set ${VMID} --ipconfig0 ip=${IP}/24,gw=${GATEWAY}
qm set ${VMID} --nameserver 10.10.0.1

# Start
qm start ${VMID}
```

## LUKS Encryption for Database VMs

Database VMs get full-disk encryption:

```bash
# In cloud-init runcmd
- cryptsetup luksFormat /dev/vdb --batch-mode --key-file /tmp/luks.key
- cryptsetup luksOpen /dev/vdb data --key-file /tmp/luks.key
- mkfs.ext4 /dev/mapper/data
- mount /dev/mapper/data /var/lib/postgresql
- shred -u /tmp/luks.key  # Remove key from disk
```

## Results

- VM provisioning: **45 minutes → 2 minutes**
- 28 VMs running from 6 templates
- Zero configuration drift
- Every VM has identical security baseline

## Lessons

1. **Template the template.** Use environment variables in cloud-init YAML so you can generate per-VM configs programmatically.
2. **Test templates in isolation.** A broken cloud-init means a VM that boots but isn't configured — hard to debug.
3. **YubiKey SSH auth is worth the friction.** One compromised SSH key could access all VMs. Hardware keys prevent that.
