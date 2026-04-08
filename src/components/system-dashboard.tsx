"use client";

import { useState, useEffect } from "react";

/** Fake system metrics that update periodically */
function useMetrics() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const r = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  return {
    tick,
    cpu: r(5, 35),
    mem: { used: r(3, 6), total: 8 },
    disk: { used: r(12, 18), total: 30 },
    uptime: `${r(90, 365)}d ${r(0, 23)}h`,
    load: [r(1, 15) / 10, r(1, 12) / 10, r(1, 10) / 10],
    pods: { running: r(28, 42), total: r(42, 45) },
    containers: [
      { name: "harris-website", status: "Up", cpu: `${r(1, 5)}%`, mem: `${r(80, 200)}MB` },
      { name: "postgres:16", status: "Up", cpu: `${r(1, 3)}%`, mem: `${r(40, 120)}MB` },
      { name: "nginx:1.24", status: "Up", cpu: `${r(0, 2)}%`, mem: `${r(10, 30)}MB` },
    ],
    nodes: [
      { name: "control-1", status: "Ready", roles: "control-plane", ver: "v1.31.2" },
      { name: "control-2", status: "Ready", roles: "control-plane", ver: "v1.31.2" },
      { name: "worker-1", status: "Ready", roles: "worker", ver: "v1.31.2" },
      { name: "worker-2", status: "Ready", roles: "worker", ver: "v1.31.2" },
    ],
    deployments: [
      { name: "harris-cv", ready: "2/2", age: `${r(30, 180)}d` },
      { name: "blog-api", ready: "1/1", age: `${r(10, 90)}d` },
      { name: "monitoring", ready: "3/3", age: `${r(60, 200)}d` },
      { name: "ingress-nginx", ready: "2/2", age: `${r(90, 300)}d` },
    ],
  };
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full h-2 bg-term-selection rounded overflow-hidden">
      <div className={`h-full ${color} rounded transition-all duration-1000`} style={{ width: `${w}%` }} />
    </div>
  );
}

/**
 * Fake system dashboard — visible on lg: screens only.
 * Shows Linux htop-style stats, K8s cluster, Docker containers.
 */
export function SystemDashboard() {
  const m = useMetrics();

  return (
    <aside className="hidden lg:flex flex-col gap-3 w-[340px] xl:w-[400px] shrink-0 p-4 border-l border-term-border overflow-y-auto text-xs font-mono h-dvh">
      {/* System Info */}
      <Section title="SYSTEM">
        <Row label="Host" value="harris-cv" />
        <Row label="OS" value="HarrisOS 1.0 (Linux 6.5)" />
        <Row label="Uptime" value={m.uptime} />
        <Row label="Load" value={m.load.map((l) => l.toFixed(1)).join(", ")} />
      </Section>

      {/* Resource Usage */}
      <Section title="RESOURCES">
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>CPU</span><span className="text-term-warning">{m.cpu}%</span>
            </div>
            <Bar pct={m.cpu} color="bg-term-accent" />
          </div>
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>Memory</span><span className="text-term-warning">{m.mem.used}GB / {m.mem.total}GB</span>
            </div>
            <Bar pct={(m.mem.used / m.mem.total) * 100} color="bg-term-prompt" />
          </div>
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>Disk</span><span className="text-term-warning">{m.disk.used}GB / {m.disk.total}GB</span>
            </div>
            <Bar pct={(m.disk.used / m.disk.total) * 100} color="bg-term-link" />
          </div>
        </div>
      </Section>

      {/* Docker */}
      <Section title="DOCKER PS">
        <div className="space-y-1">
          <div className="flex gap-2 text-term-accent">
            <span className="w-28">CONTAINER</span>
            <span className="w-10">CPU</span>
            <span className="w-14">MEM</span>
            <span>STATUS</span>
          </div>
          {m.containers.map((c) => (
            <div key={c.name} className="flex gap-2">
              <span className="w-28 text-term-prompt truncate">{c.name}</span>
              <span className="w-10 text-term-warning">{c.cpu}</span>
              <span className="w-14 text-term-warning">{c.mem}</span>
              <span className="text-term-accent">{c.status}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* K8s Nodes */}
      <Section title="KUBECTL GET NODES">
        <div className="space-y-1">
          <div className="flex gap-2 text-term-accent">
            <span className="w-20">NAME</span>
            <span className="w-14">STATUS</span>
            <span className="w-24">ROLES</span>
            <span>VER</span>
          </div>
          {m.nodes.map((n) => (
            <div key={n.name} className="flex gap-2">
              <span className="w-20 text-term-prompt">{n.name}</span>
              <span className="w-14 text-term-accent">{n.status}</span>
              <span className="w-24 text-term-link">{n.roles}</span>
              <span className="text-term-muted">{n.ver}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* K8s Deployments */}
      <Section title="KUBECTL GET DEPLOY">
        <div className="space-y-1">
          <div className="flex gap-2 text-term-accent">
            <span className="w-28">NAME</span>
            <span className="w-12">READY</span>
            <span>AGE</span>
          </div>
          {m.deployments.map((d) => (
            <div key={d.name} className="flex gap-2">
              <span className="w-28 text-term-prompt">{d.name}</span>
              <span className="w-12 text-term-accent">{d.ready}</span>
              <span className="text-term-muted">{d.age}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Pods */}
      <Section title="CLUSTER STATUS">
        <Row label="Pods" value={`${m.pods.running}/${m.pods.total} running`} />
        <Row label="Namespaces" value="4 active" />
        <Row label="Services" value="12 ClusterIP, 2 LoadBalancer" />
        <Row label="Ingress" value="nginx-ingress (healthy)" />
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-term-warning text-[10px] tracking-wider mb-1 opacity-70">{title}</div>
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-term-muted">{label}</span>
      <span className="text-term-fg">{value}</span>
    </div>
  );
}
