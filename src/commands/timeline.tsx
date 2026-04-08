import { register } from "./registry";
import { c } from "./format-helpers";

register({
  name: "timeline",
  description: "Display career timeline",
  usage: "timeline",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        {""}
        <div>  {c("Career Timeline", "text-term-accent")}</div>
        <div className="text-term-muted">  ═══════════════</div>
        {""}
        <div>  {c("2019", "text-term-warning")} ──── {c("B.Sc. IT @ HCMUS", "text-term-prompt")} ──────────────── {c("2023", "text-term-warning")}</div>
        <div className="text-term-muted">{"                                       │"}</div>
        <div>{"                            "}{c("Aug 2023", "text-term-warning")} {c("───┤", "text-term-muted")} {c("Smart Loyalty", "text-term-accent")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("DevOps Engineer", "text-term-prompt")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} Jenkins→Tekton, {c("AWS/EKS", "text-term-link")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("40%", "text-term-accent")} cost reduction</div>
        <div>{"                            "}{c("Aug 2024", "text-term-warning")} {c("───┤", "text-term-muted")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("Orochi Network", "text-term-accent")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("DevOps Engineer", "text-term-prompt")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("K8s", "text-term-link")}, {c("GCP", "text-term-link")}, Proxmox, {c("CI/CD", "text-term-link")}</div>
        <div>{"                                        "}{c("│", "text-term-muted")} {c("99.95%", "text-term-accent")} uptime, {c("10M", "text-term-accent")} req/day</div>
        <div>{"                            "}{c("Mar 2026", "text-term-warning")} {c("───┘", "text-term-muted")}</div>
        {""}
      </div>
    ),
  }),
});
