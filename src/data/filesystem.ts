import type { FSNode } from "@/types";
import { profile } from "./profile";

/** Format experience entry as text */
function formatExperience(slug: string): string {
  const exp = profile.experience.find((e) => e.slug === slug);
  if (!exp) return "Not found";
  const bullets = exp.bullets.map((b) => `  • ${b}`).join("\n");
  return `${exp.company} — ${exp.role}\n${exp.period} | ${exp.location}\n\n${bullets}`;
}

/** Format skills for a category */
function formatSkillCategory(category: string): string {
  const skill = profile.skills.find(
    (s) => s.category.toLowerCase() === category.toLowerCase()
  );
  if (!skill) return "Not found";
  return `${skill.category}\n\n${skill.technologies.map((t) => `  • ${t}`).join("\n")}`;
}

/** The virtual filesystem tree */
export const fsRoot: FSNode = {
  name: "~",
  type: "directory",
  children: [
    {
      name: "about.txt",
      type: "file",
      content: () =>
        `${profile.name}\n${profile.role}\n${profile.location}\n\n${profile.summary}\n\n"${profile.motto}"`,
    },
    {
      name: "contact.txt",
      type: "file",
      content: () =>
        [
          `Phone      ${profile.phone}`,
          `Email      ${profile.email}`,
          `LinkedIn   ${profile.social.find((s) => s.platform === "LinkedIn")?.url}`,
          `GitHub     ${profile.social.find((s) => s.platform === "GitHub")?.url}`,
          `Location   ${profile.location}`,
        ].join("\n"),
    },
    {
      name: "experience",
      type: "directory",
      children: profile.experience.map((exp) => ({
        name: `${exp.slug}.txt`,
        type: "file" as const,
        content: () => formatExperience(exp.slug),
      })),
    },
    {
      name: "skills",
      type: "directory",
      children: profile.skills.map((s) => ({
        name: `${s.category.toLowerCase().replace(/[&\s]+/g, "-")}.txt`,
        type: "file" as const,
        content: () => formatSkillCategory(s.category),
      })),
    },
    {
      name: "education.txt",
      type: "file",
      content: () => {
        const edu = profile.education;
        return `${edu.institution}\n${edu.degree}\n${edu.period} | GPA: ${edu.gpa}`;
      },
    },
    {
      name: "certifications.txt",
      type: "file",
      content: () => profile.certifications.map((c) => `• ${c}`).join("\n"),
    },
    {
      name: "projects",
      type: "directory",
      children: [
        {
          name: "cicd-platform.txt",
          type: "file",
          content: () =>
            "CI/CD Framework (Orochi Network)\n\n3-tier centralized CI/CD: 26 composite actions, 12 reusable\nworkflows, templated Dockerfile generator. Serves 17+ repos.",
        },
        {
          name: "gitops-helm.txt",
          type: "file",
          content: () =>
            "Centralized Helm Chart System\n\nSingle Helm chart with 3-tier value hierarchy serving 32+\nmicroservices across 4 projects. 42+ ArgoCD applications.",
        },
        {
          name: "proxmox-datacenter.txt",
          type: "file",
          content: () =>
            "Proxmox Datacenter\n\nBare-metal server with 28 VMs, K3s HA cluster, automated\ncloud-init templates, LUKS encryption, Proxmox Backup Server.",
        },
        {
          name: "monitoring-stack.txt",
          type: "file",
          content: () =>
            "Monitoring Stack\n\nPrometheus + Grafana + Loki + Alloy with custom LogQL,\nS3 archival, alerting. Reduced MTTR by 30%.",
        },
      ],
    },
    {
      name: "social.txt",
      type: "file",
      content: () =>
        profile.social
          .map((s) => `${s.platform.padEnd(12)} ${s.url}`)
          .join("\n"),
    },
    {
      name: "blog",
      type: "directory",
      children: [], // Populated by Phase 6
    },
  ],
};

/* === Path Resolution === */

/** Normalize a path string: resolve ~, .., ., double slashes */
function normalizePath(cwd: string, path: string): string[] {
  let parts: string[];

  if (path.startsWith("~") || path.startsWith("/")) {
    // Absolute path from root
    parts = path.replace(/^~\/?/, "").split("/");
  } else {
    // Relative path from cwd
    const cwdParts = cwd.replace(/^~\/?/, "").split("/");
    parts = [...cwdParts, ...path.split("/")];
  }

  // Resolve . and ..
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      resolved.pop(); // Can't go above root
    } else {
      resolved.push(part);
    }
  }
  return resolved;
}

/** Walk the tree to find a node at the given path parts */
function walkTree(parts: string[]): FSNode | null {
  let current: FSNode = fsRoot;

  for (const part of parts) {
    if (current.type !== "directory" || !current.children) return null;
    const child = current.children.find((c) => c.name === part);
    if (!child) return null;
    current = child;
  }

  return current;
}

/** Resolve a path string to an FSNode */
export function resolvePath(cwd: string, path: string): FSNode | null {
  const parts = normalizePath(cwd, path);
  if (parts.length === 0) return fsRoot;
  return walkTree(parts);
}

/** Get the string path for a resolved path */
export function toPathString(cwd: string, path: string): string {
  const parts = normalizePath(cwd, path);
  return parts.length === 0 ? "~" : `~/${parts.join("/")}`;
}

/** Get tab completions for a partial path */
export function getPathCompletions(
  cwd: string,
  partial: string
): string[] {
  // Split into directory part and name part
  const lastSlash = partial.lastIndexOf("/");
  let dirPath: string;
  let prefix: string;

  if (lastSlash === -1) {
    dirPath = cwd;
    prefix = partial;
  } else {
    dirPath = partial.slice(0, lastSlash) || (partial.startsWith("~") ? "~" : cwd);
    prefix = partial.slice(lastSlash + 1);
  }

  const dir = resolvePath(cwd, dirPath);
  if (!dir || dir.type !== "directory" || !dir.children) return [];

  const matches = dir.children
    .filter((c) => c.name.toLowerCase().startsWith(prefix.toLowerCase()))
    .map((c) => {
      const basePath = lastSlash === -1 ? "" : partial.slice(0, lastSlash + 1);
      const suffix = c.type === "directory" ? "/" : "";
      return `${basePath}${c.name}${suffix}`;
    });

  return matches;
}

/** Render tree with box-drawing characters */
export function renderTree(
  node: FSNode,
  prefix: string = "",
  isLast: boolean = true,
  depth: number = 0,
  maxDepth: number = 3
): string[] {
  const lines: string[] = [];
  const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
  const name =
    node.type === "directory" && depth > 0 ? `${node.name}/` : node.name;

  if (depth === 0) {
    lines.push(name + "/");
  } else {
    lines.push(`${prefix}${connector}${name}`);
  }

  if (
    node.type === "directory" &&
    node.children &&
    depth < maxDepth
  ) {
    const children = node.children;
    const childPrefix =
      depth === 0 ? "" : `${prefix}${isLast ? "    " : "│   "}`;
    children.forEach((child, i) => {
      const childIsLast = i === children.length - 1;
      lines.push(
        ...renderTree(child, childPrefix, childIsLast, depth + 1, maxDepth)
      );
    });
  }

  return lines;
}
