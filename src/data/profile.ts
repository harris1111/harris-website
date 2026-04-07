import type { Profile } from "@/types";

export const profile: Profile = {
  name: "Nguyen Minh An",
  role: "DevOps / Cloud Engineer",
  location: "Binh Tan, Ho Chi Minh City, Vietnam",
  phone: "+84 347802611",
  email: "minhan112001@gmail.com",
  motto: "Automate everything, monitor everything, secure everything.",

  summary:
    "DevOps Engineer with 2.5+ years of experience building and operating Kubernetes infrastructure for Web3 platforms. Co-built centralized CI/CD frameworks serving 17+ repositories, managed 42+ ArgoCD applications on GKE, and supported 99.95% uptime during campaigns handling 10M daily requests. Experienced in GCP, on-premise (Proxmox), and hybrid cloud deployments.",

  skills: [
    {
      category: "CI/CD",
      technologies: [
        "GitHub Actions (reusable workflows, composite actions)",
        "Tekton",
        "GPG/SSH signing",
      ],
    },
    {
      category: "IaC & Config",
      technologies: ["Helm", "ArgoCD (GitOps)", "cloud-init", "Terraform"],
    },
    {
      category: "Containers & Orchestration",
      technologies: [
        "Docker (multi-arch)",
        "Kubernetes (GKE, K3s, EKS)",
        "Helm charts",
      ],
    },
    {
      category: "Cloud",
      technologies: [
        "GCP (GKE, Compute, VPC, Cloud NAT, LB, IAM)",
        "AWS (EKS, EC2)",
      ],
    },
    {
      category: "Observability",
      technologies: [
        "Prometheus",
        "Grafana",
        "Loki",
        "Alloy",
        "LogQL",
        "Alert Manager",
      ],
    },
    {
      category: "Security",
      technologies: [
        "Vault (envelope encryption)",
        "LUKS",
        "YubiKey SSH",
        "iptables",
        "cert-manager",
      ],
    },
    {
      category: "Networking",
      technologies: [
        "Wireguard VPN",
        "MikroTik RouterOS",
        "Traefik",
        "MetalLB",
      ],
    },
    {
      category: "Scripting",
      technologies: ["Bash", "Python", "Golang", "JavaScript"],
    },
    {
      category: "OS & Infra",
      technologies: ["Linux (Ubuntu)", "Proxmox VE", "systemd", "cloud-init"],
    },
  ],

  experience: [
    {
      company: "Orochi Network",
      slug: "orochi",
      role: "DevOps Engineer",
      period: "August 2024 – March 2026",
      location: "Ho Chi Minh City",
      bullets: [
        "CI/CD Platform Engineering: Co-built centralized 3-tier CI/CD framework (26 composite actions, 12 reusable workflows, templated Dockerfile generator) over 3 months, eliminating workflow duplication across 17+ repositories. Enforced GPG/SSH commit signing and multi-architecture Docker builds (amd64/arm64).",
        "GitOps & Kubernetes: Designed centralized Helm chart serving 32+ microservices across 4 projects with 3-tier value hierarchy. Managed 42+ ArgoCD applications on GKE clusters (100+ pods, 9 namespaces). Migrated ingress from Nginx to Traefik v3.",
        "Cloud Architecture (GCP): Contributed to multi-region GCP infrastructure (Singapore, Tokyo, UAE) with 11 custom VPCs segmented by function, 50+ firewall rules with Cloudflare-only ingress, and jump box SSH access patterns.",
        "On-premise Infrastructure: Set up Proxmox server (AMD EPYC 9654P, 192 threads, 188GB RAM) from scratch with 28 VMs, K3s HA cluster (embedded etcd, dual-NIC, flannel host-gw), cloud-init templates with LUKS encryption and YubiKey SSH auth.",
        "Observability: Built monitoring stack (Prometheus, Grafana, Loki, Alloy) with custom LogQL queries and S3 log archival (30-day retention), reducing MTTR by 30%.",
        "Networking: Designed Wireguard hub-and-spoke VPN (11 peers) with subnet routing. Configured MikroTik RB3011 with dual-WAN failover and 5 Aruba enterprise APs for office network (60+ users).",
        "High Availability: Supported 99.95% uptime during campaign launches (10M daily requests, 3,000 req/s) through log analysis, resource scaling, and incident troubleshooting.",
        "AI Developer Infrastructure: Built containerized AI development environment with 9 parallel SSH-accessible dev containers, private npm registry (Verdaccio), and Claude Code + MCP integration.",
      ],
    },
    {
      company: "Smart Loyalty",
      slug: "smart-loyalty",
      role: "DevOps Engineer",
      period: "August 2023 – August 2024",
      location: "Ho Chi Minh City",
      bullets: [
        "CI/CD Migration: Migrated 3 CI/CD pipelines from Jenkins to Tekton (cloud-native on EKS), cutting build time by 30% and improving resource efficiency by 25%.",
        "Cost Optimization: Reduced cloud costs by 40% through instance right-sizing, spot node adoption, and KEDA scale-to-zero for idle workloads.",
        "Infrastructure Management: Managed EKS cluster, MongoDB 3-node replica set, and Docker/EC2 deployments on AWS with Helm-based deployment workflows.",
      ],
    },
  ],

  education: {
    institution: "Ho Chi Minh City University of Science",
    degree: "Bachelor of Science, Information Technology",
    period: "2019 – 2023",
    gpa: "3.2",
  },

  certifications: ["Planned: CKA (Certified Kubernetes Administrator)", "Planned: CKAD (Certified Kubernetes Application Developer)"],

  languages: [
    { name: "English", score: "TOEIC L/R 920 | IELTS 6.5" },
    { name: "Vietnamese", score: "Native" },
  ],

  social: [
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/minh-an-nguyen-453b39222",
      label: "Minh An Nguyen",
    },
    {
      platform: "GitHub",
      url: "https://github.com/harris1111",
      label: "harris1111",
    },
    {
      platform: "Email",
      url: "mailto:minhan112001@gmail.com",
      label: "minhan112001@gmail.com",
    },
  ],
};
