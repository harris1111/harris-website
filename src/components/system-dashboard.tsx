"use client";

import { useState, useEffect, useRef } from "react";

/* ── Helpers ── */

const r = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rf = (min: number, max: number, dec = 1) =>
  (Math.random() * (max - min) + min).toFixed(dec);

/** Datacenter-grade metrics that update every 2s */
function useMetrics() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return {
    tick,
    cpu: { used: r(62, 89), cores: 256, model: "AMD EPYC 9654 (2x 96-core)" },
    mem: { used: r(780, 920), total: 1024 },
    disk: { used: r(42, 58), total: 96, type: "NVMe RAID-10" },
    net: { rx: rf(12, 28), tx: rf(8, 18) },
    uptime: "3y 247d 14h",
    load: [r(120, 180) / 10, r(100, 160) / 10, r(80, 140) / 10],
    pods: { running: r(340, 380), total: r(380, 395), failed: r(0, 2) },
    gpus: [
      { id: 0, name: "A100 80GB", util: r(85, 99), mem: r(68, 78), temp: r(65, 82), power: r(280, 350), workload: "LLM inference (Llama 70B)" },
      { id: 1, name: "A100 80GB", util: r(70, 95), mem: r(55, 75), temp: r(60, 78), power: r(250, 340), workload: "Embedding pipeline (BGE-M3)" },
      { id: 2, name: "H100 80GB", util: r(90, 99), mem: r(72, 79), temp: r(68, 85), power: r(350, 600), workload: "Fine-tuning (LoRA, 7B params)" },
      { id: 3, name: "H100 80GB", util: r(60, 88), mem: r(40, 65), temp: r(55, 75), power: r(280, 500), workload: "Batch inference (vision model)" },
    ],
    clusters: [
      { name: "prod-us-west", nodes: 24, pods: r(180, 220), cpu: r(65, 85), status: "healthy" },
      { name: "prod-eu-central", nodes: 16, pods: r(120, 160), cpu: r(55, 78), status: "healthy" },
      { name: "gpu-cluster", nodes: 8, pods: r(40, 65), cpu: r(80, 95), status: r(1, 20) === 1 ? "degraded" : "healthy" },
    ],
    workloads: [
      { name: "llm-serving", replicas: "8/8", cpu: `${r(40, 65)}%`, mem: `${r(120, 200)}GB`, gpu: "4x A100" },
      { name: "vector-db", replicas: "3/3", cpu: `${r(25, 45)}%`, mem: `${r(64, 96)}GB`, gpu: "-" },
      { name: "api-gateway", replicas: "12/12", cpu: `${r(15, 35)}%`, mem: `${r(8, 16)}GB`, gpu: "-" },
      { name: "monitoring", replicas: "5/5", cpu: `${r(10, 20)}%`, mem: `${r(16, 32)}GB`, gpu: "-" },
      { name: "training-job", replicas: "2/2", cpu: `${r(70, 95)}%`, mem: `${r(180, 256)}GB`, gpu: "2x H100" },
      { name: "etl-pipeline", replicas: "6/6", cpu: `${r(30, 55)}%`, mem: `${r(32, 64)}GB`, gpu: "-" },
    ],
    network: {
      reqPerSec: r(45000, 85000),
      p99: rf(2, 12),
      errors: rf(0, 0.05, 2),
      bandwidth: rf(18, 42),
    },
  };
}

/* ── Mini Sparkline Chart (CSS-only) ── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1 ${color} rounded-t opacity-80 transition-all duration-500`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** Stores history for sparkline charts */
function useHistory(value: number, maxLen = 30) {
  const ref = useRef<number[]>([]);
  ref.current = [...ref.current, value].slice(-maxLen);
  return ref.current;
}

/* ── Components ── */

function Bar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(100, Math.max(0, pct));
  const barColor = w > 90 ? "bg-term-error" : w > 75 ? "bg-term-warning" : color;
  return (
    <div className="w-full h-1.5 bg-term-selection rounded overflow-hidden">
      <div className={`h-full ${barColor} rounded transition-all duration-1000`} style={{ width: `${w}%` }} />
    </div>
  );
}

function Section({ title, children, expandable }: {
  title: string;
  children: React.ReactNode;
  expandable?: { expanded: boolean; onToggle: () => void; chart?: React.ReactNode };
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-term-warning text-[10px] tracking-wider opacity-70">{title}</div>
        {expandable && (
          <button
            onClick={expandable.onToggle}
            className="text-[9px] text-term-link hover:text-term-accent px-1"
          >
            {expandable.expanded ? "[-]" : "[+]"}
          </button>
        )}
      </div>
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1 mt-0.5">
        {children}
        {expandable?.expanded && expandable.chart && (
          <div className="mt-2 pt-2 border-t border-term-border">
            {expandable.chart}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-term-muted">{label}</span>
      <span className={valueColor || "text-term-fg"}>{value}</span>
    </div>
  );
}

/* ── Main Dashboard ── */

export function SystemDashboard() {
  const m = useMetrics();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  const cpuHistory = useHistory(m.cpu.used);
  const memHistory = useHistory((m.mem.used / m.mem.total) * 100);
  const netHistory = useHistory(m.network.reqPerSec / 1000);

  return (
    <aside className="hidden lg:flex flex-col gap-2 w-[340px] xl:w-[420px] shrink-0 p-3 border-l border-term-border overflow-y-auto text-[11px] font-mono h-dvh">
      {/* System */}
      <Section title="DATACENTER">
        <Row label="Host" value="harris-dc-01" />
        <Row label="CPU" value={m.cpu.model} />
        <Row label="RAM" value="1024 GB DDR5 ECC" />
        <Row label="Storage" value={`${m.disk.total}TB ${m.disk.type}`} />
        <Row label="Uptime" value={m.uptime} valueColor="text-term-accent" />
        <Row label="Load" value={m.load.map((l) => l.toFixed(1)).join(", ")} />
      </Section>

      {/* Resources */}
      <Section
        title="RESOURCES"
        expandable={{
          expanded: !!expanded.res,
          onToggle: () => toggle("res"),
          chart: (
            <div className="space-y-2">
              <div className="text-term-muted text-[9px]">CPU (60s)</div>
              <Sparkline data={cpuHistory} color="bg-term-accent" />
              <div className="text-term-muted text-[9px]">Memory (60s)</div>
              <Sparkline data={memHistory} color="bg-term-prompt" />
            </div>
          ),
        }}
      >
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>CPU ({m.cpu.cores} cores)</span><span className="text-term-warning">{m.cpu.used}%</span>
            </div>
            <Bar pct={m.cpu.used} color="bg-term-accent" />
          </div>
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>Memory</span><span className="text-term-warning">{m.mem.used}GB / {m.mem.total}GB</span>
            </div>
            <Bar pct={(m.mem.used / m.mem.total) * 100} color="bg-term-prompt" />
          </div>
          <div>
            <div className="flex justify-between text-term-muted mb-0.5">
              <span>Disk ({m.disk.type})</span><span className="text-term-warning">{m.disk.used}TB / {m.disk.total}TB</span>
            </div>
            <Bar pct={(m.disk.used / m.disk.total) * 100} color="bg-term-link" />
          </div>
          <div className="flex justify-between text-term-muted">
            <span>Network</span><span>RX {m.net.rx} Gbps / TX {m.net.tx} Gbps</span>
          </div>
        </div>
      </Section>

      {/* GPU Cluster */}
      <Section
        title="GPU CLUSTER (nvidia-smi)"
        expandable={{
          expanded: !!expanded.gpu,
          onToggle: () => toggle("gpu"),
          chart: (
            <div className="space-y-1.5">
              {m.gpus.map((g) => (
                <div key={g.id} className="text-[9px]">
                  <div className="text-term-muted mb-0.5">GPU {g.id}: {g.workload}</div>
                  <Sparkline
                    data={Array.from({ length: 20 }, () => r(g.util - 15, Math.min(99, g.util + 5)))}
                    color={g.util > 90 ? "bg-term-error" : "bg-term-accent"}
                  />
                </div>
              ))}
            </div>
          ),
        }}
      >
        <div className="space-y-1.5">
          {m.gpus.map((g) => (
            <div key={g.id}>
              <div className="flex justify-between text-term-muted mb-0.5">
                <span className="text-term-prompt">GPU {g.id} {g.name}</span>
                <span className="text-term-warning">{g.temp}C {g.power}W</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-term-muted text-[9px] mb-0.5">Util {g.util}%</div>
                  <Bar pct={g.util} color="bg-term-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-term-muted text-[9px] mb-0.5">VRAM {g.mem}/80GB</div>
                  <Bar pct={(g.mem / 80) * 100} color="bg-term-link" />
                </div>
              </div>
              <div className="text-[9px] text-term-muted truncate">{g.workload}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Multi-Cluster */}
      <Section title="MULTI-CLUSTER FEDERATION">
        <div className="space-y-1">
          <div className="flex gap-2 text-term-accent text-[9px]">
            <span className="w-28">CLUSTER</span>
            <span className="w-8">N</span>
            <span className="w-10">PODS</span>
            <span className="w-10">CPU</span>
            <span>STATUS</span>
          </div>
          {m.clusters.map((c) => (
            <div key={c.name} className="flex gap-2">
              <span className="w-28 text-term-prompt truncate">{c.name}</span>
              <span className="w-8 text-term-muted">{c.nodes}</span>
              <span className="w-10 text-term-warning">{c.pods}</span>
              <span className="w-10 text-term-warning">{c.cpu}%</span>
              <span className={c.status === "healthy" ? "text-term-accent" : "text-term-error"}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Workloads */}
      <Section
        title="TOP WORKLOADS"
        expandable={{
          expanded: !!expanded.work,
          onToggle: () => toggle("work"),
          chart: (
            <div className="space-y-1">
              <div className="text-term-muted text-[9px]">Requests/sec (60s)</div>
              <Sparkline data={netHistory} color="bg-term-warning" />
              <div className="flex justify-between text-[9px] text-term-muted mt-1">
                <span>p99: {m.network.p99}ms</span>
                <span>err: {m.network.errors}%</span>
                <span>{m.network.bandwidth} Gbps</span>
              </div>
            </div>
          ),
        }}
      >
        <div className="space-y-1">
          <div className="flex gap-1 text-term-accent text-[9px]">
            <span className="w-24">NAME</span>
            <span className="w-10">READY</span>
            <span className="w-10">CPU</span>
            <span className="w-12">MEM</span>
            <span>GPU</span>
          </div>
          {m.workloads.map((w) => (
            <div key={w.name} className="flex gap-1">
              <span className="w-24 text-term-prompt truncate">{w.name}</span>
              <span className="w-10 text-term-accent">{w.replicas}</span>
              <span className="w-10 text-term-warning">{w.cpu}</span>
              <span className="w-12 text-term-warning">{w.mem}</span>
              <span className={w.gpu !== "-" ? "text-term-link" : "text-term-muted"}>{w.gpu}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Network */}
      <Section title="TRAFFIC">
        <Row label="Req/s" value={m.network.reqPerSec.toLocaleString()} valueColor="text-term-accent" />
        <Row label="p99 latency" value={`${m.network.p99}ms`} />
        <Row label="Error rate" value={`${m.network.errors}%`} valueColor={parseFloat(m.network.errors) > 0.02 ? "text-term-error" : "text-term-accent"} />
        <Row label="Bandwidth" value={`${m.network.bandwidth} Gbps`} />
        <Row label="Pods" value={`${m.pods.running}/${m.pods.total} running`} valueColor="text-term-accent" />
        {m.pods.failed > 0 && <Row label="Failed" value={String(m.pods.failed)} valueColor="text-term-error" />}
      </Section>
    </aside>
  );
}
