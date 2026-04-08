import { register } from "./registry";
import { c } from "./format-helpers";

const PROJECTS = [
  {
    name: "CI/CD Framework",
    org: "Orochi Network",
    desc: "3-tier centralized CI/CD: 26 composite actions, 12 reusable workflows, templated Dockerfile generator. Serves 17+ repos.",
    tags: ["GitHub Actions", "Docker", "CI/CD"],
  },
  {
    name: "Centralized Helm Chart System",
    org: null,
    desc: "Single Helm chart with 3-tier value hierarchy serving 32+ microservices across 4 projects. 42+ ArgoCD applications.",
    tags: ["Helm", "ArgoCD", "Kubernetes"],
  },
  {
    name: "Proxmox Datacenter",
    org: null,
    desc: "Bare-metal server with 28 VMs, K3s HA cluster, automated cloud-init templates, LUKS encryption, Proxmox Backup Server.",
    tags: ["Proxmox", "K3s", "LUKS"],
  },
  {
    name: "Monitoring Stack",
    org: null,
    desc: "Prometheus + Grafana + Loki + Alloy with custom LogQL, S3 archival, alerting. Reduced MTTR by 30%.",
    tags: ["Prometheus", "Grafana", "Loki"],
  },
  {
    name: "Wireguard VPN Network",
    org: null,
    desc: "Hub-and-spoke topology with 11 peers, subnet routing for secure cross-datacenter access.",
    tags: ["Wireguard", "Networking"],
  },
  {
    name: "Tekton Migration",
    org: "Smart Loyalty",
    desc: "Jenkins to Tekton on EKS. 30% faster builds, 25% better resource efficiency. Custom solutions for early ecosystem.",
    tags: ["Tekton", "EKS", "Jenkins"],
  },
];

register({
  name: "projects",
  description: "Display notable projects",
  usage: "projects",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        <div>{c("Notable Projects & Contributions:", "text-term-accent")}</div>
        <div>{""}</div>
        {PROJECTS.map((p, i) => (
          <div key={i} className={i > 0 ? "mt-2" : ""}>
            <div>
              {"  "}{c(p.name, "text-term-prompt")}
              {p.org && <> ({c(p.org, "text-term-warning")})</>}
            </div>
            <div className="text-term-muted">{"    "}{p.desc}</div>
            <div>
              {"    "}
              {p.tags.map((t, j) => (
                <span key={j}>{j > 0 ? " " : ""}{c(`[${t}]`, "text-term-link")}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  }),
});
