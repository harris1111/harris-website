import { register } from "./registry";

register({
  name: "timeline",
  description: "Display career timeline",
  usage: "timeline",
  execute: () => ({
    type: "text",
    content: [
      "",
      "  Career Timeline",
      "  ═══════════════",
      "",
      "  2019 ──── B.Sc. IT @ HCMUS ──────────────── 2023",
      "                                       │",
      "                            Aug 2023 ───┤ Smart Loyalty",
      "                                        │ DevOps Engineer",
      "                                        │ Jenkins→Tekton, AWS/EKS",
      "                                        │ 40% cost reduction",
      "                            Aug 2024 ───┤",
      "                                        │ Orochi Network",
      "                                        │ DevOps Engineer",
      "                                        │ K8s, GCP, Proxmox, CI/CD",
      "                                        │ 99.95% uptime, 10M req/day",
      "                            Mar 2026 ───┘",
      "",
    ].join("\n"),
  }),
});
