"use client";

import { useState, useEffect, useRef } from "react";

/* ── Helpers ── */

const r = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rf = (min: number, max: number, dec = 1) =>
  (Math.random() * (max - min) + min).toFixed(dec);

function useMetrics() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return {
    tick,
    hosts: [
      { name: "dc-01", cpu: r(65, 89), mem: r(780, 920), cores: 256, ram: 1024, model: "EPYC 9654 (2x96c)" },
      { name: "dc-02", cpu: r(55, 82), mem: r(700, 880), cores: 192, ram: 768, model: "EPYC 9554 (2x64c)" },
      { name: "dc-03", cpu: r(45, 75), mem: r(420, 500), cores: 128, ram: 512, model: "EPYC 9454 (2x48c)" },
    ],
    uptime: "3y 247d 14h",
    totalCores: 576,
    totalRam: 2304,
    disk: { used: r(142, 188), total: 288 },
    gpus: [
      { id: 0, name: "A100 80G", util: r(85, 99), mem: r(68, 78), temp: r(65, 82), power: r(280, 350), job: "LLM inference (Llama-70B)" },
      { id: 1, name: "A100 80G", util: r(70, 95), mem: r(55, 75), temp: r(60, 78), power: r(250, 340), job: "Embeddings (BGE-M3)" },
      { id: 2, name: "H100 80G", util: r(90, 99), mem: r(72, 79), temp: r(68, 85), power: r(350, 600), job: "LoRA fine-tune (7B)" },
      { id: 3, name: "H100 80G", util: r(60, 88), mem: r(40, 65), temp: r(55, 75), power: r(280, 500), job: "Vision batch infer" },
      { id: 4, name: "H100 80G", util: r(75, 96), mem: r(50, 70), temp: r(62, 80), power: r(300, 550), job: "RAG pipeline (32K ctx)" },
      { id: 5, name: "A100 80G", util: r(50, 80), mem: r(30, 55), temp: r(50, 70), power: r(200, 300), job: "TTS synthesis (XTTS)" },
    ],
    clusters: [
      { name: "prod-us-west", nodes: 24, pods: r(180, 220), cpu: r(65, 85), mem: r(70, 88), status: "healthy" },
      { name: "prod-eu-central", nodes: 16, pods: r(120, 160), cpu: r(55, 78), mem: r(60, 80), status: "healthy" },
      { name: "prod-ap-south", nodes: 12, pods: r(80, 120), cpu: r(50, 72), mem: r(55, 75), status: "healthy" },
      { name: "gpu-cluster", nodes: 8, pods: r(40, 65), cpu: r(80, 95), mem: r(85, 95), status: r(1, 20) === 1 ? "degraded" : "healthy" },
      { name: "staging", nodes: 6, pods: r(30, 50), cpu: r(20, 45), mem: r(30, 50), status: "healthy" },
    ],
    workloads: [
      { name: "llm-serving", rdy: "8/8", cpu: `${r(40, 65)}%`, mem: `${r(120, 200)}G`, gpu: "4xA100" },
      { name: "training-job", rdy: "2/2", cpu: `${r(70, 95)}%`, mem: `${r(180, 256)}G`, gpu: "2xH100" },
      { name: "rag-pipeline", rdy: "4/4", cpu: `${r(35, 55)}%`, mem: `${r(64, 96)}G`, gpu: "1xH100" },
      { name: "vector-db", rdy: "3/3", cpu: `${r(25, 45)}%`, mem: `${r(64, 96)}G`, gpu: "-" },
      { name: "api-gateway", rdy: "12/12", cpu: `${r(15, 35)}%`, mem: `${r(8, 16)}G`, gpu: "-" },
      { name: "monitoring", rdy: "5/5", cpu: `${r(10, 20)}%`, mem: `${r(16, 32)}G`, gpu: "-" },
      { name: "etl-pipeline", rdy: "6/6", cpu: `${r(30, 55)}%`, mem: `${r(32, 64)}G`, gpu: "-" },
      { name: "tts-service", rdy: "3/3", cpu: `${r(20, 40)}%`, mem: `${r(24, 48)}G`, gpu: "1xA100" },
    ],
    net: { reqSec: r(45000, 120000), p99: rf(2, 12), err: rf(0, 0.05, 2), bw: rf(18, 65) },
    pods: { running: r(480, 560), total: r(560, 585), failed: r(0, 3) },
  };
}

/* ── Chart Components ── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-6">
      {data.map((v, i) => (
        <div key={i} className={`w-[3px] ${color} rounded-t opacity-80 transition-all duration-500`} style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

function useHistory(value: number, maxLen = 25) {
  const ref = useRef<number[]>([]);
  ref.current = [...ref.current, value].slice(-maxLen);
  return ref.current;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(100, Math.max(0, pct));
  const c = w > 90 ? "bg-term-error" : w > 75 ? "bg-term-warning" : color;
  return (
    <div className="w-full h-1.5 bg-term-selection rounded overflow-hidden">
      <div className={`h-full ${c} rounded transition-all duration-1000`} style={{ width: `${w}%` }} />
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(100, Math.max(0, pct));
  const c = w > 90 ? "bg-term-error" : w > 75 ? "bg-term-warning" : color;
  return (
    <div className="w-12 h-1.5 bg-term-selection rounded overflow-hidden inline-block align-middle ml-1">
      <div className={`h-full ${c} rounded transition-all duration-1000`} style={{ width: `${w}%` }} />
    </div>
  );
}

/* ── Collapsed View (slim sidebar) ── */

function CollapsedView({ m, onExpand }: { m: ReturnType<typeof useMetrics>; onExpand: () => void }) {
  const avgCpu = Math.round(m.hosts.reduce((a, h) => a + h.cpu, 0) / m.hosts.length);
  const totalMemUsed = m.hosts.reduce((a, h) => a + h.mem, 0);
  const avgGpu = Math.round(m.gpus.reduce((a, g) => a + g.util, 0) / m.gpus.length);

  return (
    <aside className="hidden lg:flex flex-col gap-2 w-[200px] xl:w-[220px] shrink-0 p-3 border-l border-term-border overflow-y-auto text-xs font-mono h-dvh">
      <div className="flex items-center justify-between mb-1">
        <span className="text-term-warning text-[11px] tracking-wider opacity-70">DATACENTER</span>
        <button onClick={onExpand} className="text-[11px] text-term-link hover:text-term-accent">[expand &gt;&gt;]</button>
      </div>

      {/* Quick Stats */}
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1.5">
        <div className="flex justify-between"><span className="text-term-muted">Hosts</span><span className="text-term-accent">{m.hosts.length} HA</span></div>
        <div className="flex justify-between"><span className="text-term-muted">Uptime</span><span className="text-term-accent">{m.uptime}</span></div>
        <div className="flex justify-between"><span className="text-term-muted">Cores</span><span>{m.totalCores} vCPU</span></div>
        <div className="flex justify-between"><span className="text-term-muted">RAM</span><span>{m.totalRam} GB</span></div>
        <div>
          <div className="flex justify-between text-term-muted"><span>CPU avg</span><span className="text-term-warning">{avgCpu}%</span></div>
          <Bar pct={avgCpu} color="bg-term-accent" />
        </div>
        <div>
          <div className="flex justify-between text-term-muted"><span>MEM</span><span className="text-term-warning">{totalMemUsed}G/{m.totalRam}G</span></div>
          <Bar pct={(totalMemUsed / m.totalRam) * 100} color="bg-term-prompt" />
        </div>
      </div>

      {/* GPU Summary */}
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1">
        <div className="text-term-warning text-[11px] tracking-wider opacity-70 mb-1">GPU x{m.gpus.length}</div>
        <div className="flex justify-between text-term-muted"><span>Avg util</span><span className="text-term-warning">{avgGpu}%</span></div>
        <Bar pct={avgGpu} color="bg-term-accent" />
        {m.gpus.map((g) => (
          <div key={g.id} className="flex items-center justify-between">
            <span className="text-term-muted">{g.id}:{g.name.split(" ")[0]}</span>
            <span className="text-term-warning">{g.util}%</span>
            <MiniBar pct={g.util} color="bg-term-accent" />
          </div>
        ))}
      </div>

      {/* Clusters */}
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1">
        <div className="text-term-warning text-[11px] tracking-wider opacity-70 mb-1">CLUSTERS</div>
        {m.clusters.map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <span className="text-term-prompt truncate w-20">{c.name.replace("prod-", "")}</span>
            <span className={c.status === "healthy" ? "text-term-accent" : "text-term-error"}>{c.status === "healthy" ? "OK" : "!!"}</span>
          </div>
        ))}
      </div>

      {/* Traffic */}
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1">
        <div className="text-term-warning text-[11px] tracking-wider opacity-70 mb-1">TRAFFIC</div>
        <div className="flex justify-between"><span className="text-term-muted">req/s</span><span className="text-term-accent">{(m.net.reqSec / 1000).toFixed(0)}K</span></div>
        <div className="flex justify-between"><span className="text-term-muted">pods</span><span className="text-term-accent">{m.pods.running}/{m.pods.total}</span></div>
        {m.pods.failed > 0 && <div className="flex justify-between"><span className="text-term-muted">failed</span><span className="text-term-error">{m.pods.failed}</span></div>}
      </div>
    </aside>
  );
}

/* ── Expanded View (full datacenter) ── */

function ExpandedView({ m, onCollapse }: { m: ReturnType<typeof useMetrics>; onCollapse: () => void }) {
  const [charts, setCharts] = useState<Record<string, boolean>>({});
  const toggleChart = (key: string) => setCharts((s) => ({ ...s, [key]: !s[key] }));

  const avgCpu = Math.round(m.hosts.reduce((a, h) => a + h.cpu, 0) / m.hosts.length);
  const cpuHist = useHistory(avgCpu);
  const memHist = useHistory(m.hosts.reduce((a, h) => a + h.mem, 0) / m.totalRam * 100);
  const netHist = useHistory(m.net.reqSec / 1000);

  return (
    <aside className="hidden lg:flex flex-col gap-2 w-[55vw] xl:w-[50vw] 2xl:w-[45vw] shrink-0 p-3 border-l border-term-border overflow-y-auto text-xs font-mono h-dvh transition-all duration-300">
      <div className="flex items-center justify-between mb-1">
        <span className="text-term-warning text-[11px] tracking-wider opacity-70">DATACENTER MONITORING -- LIVE</span>
        <button onClick={onCollapse} className="text-[11px] text-term-link hover:text-term-accent">[&lt;&lt; collapse]</button>
      </div>

      {/* HA Hosts */}
      <Sec title="HA CLUSTER (3 hosts)">
        <div className="grid grid-cols-3 gap-2">
          {m.hosts.map((h) => (
            <div key={h.name} className="bg-term-selection/30 rounded p-1.5 space-y-1">
              <div className="text-term-prompt font-bold">{h.name}</div>
              <div className="text-term-muted text-[11px]">{h.model}</div>
              <div className="text-term-muted text-[11px]">{h.cores}c / {h.ram}GB</div>
              <div className="flex justify-between text-[11px]"><span className="text-term-muted">CPU</span><span className="text-term-warning">{h.cpu}%</span></div>
              <Bar pct={h.cpu} color="bg-term-accent" />
              <div className="flex justify-between text-[11px]"><span className="text-term-muted">MEM</span><span className="text-term-warning">{h.mem}G/{h.ram}G</span></div>
              <Bar pct={(h.mem / h.ram) * 100} color="bg-term-prompt" />
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-1 text-term-muted">
          <span>Total: {m.totalCores} cores, {m.totalRam}GB RAM</span>
          <span>Disk: {m.disk.used}TB/{m.disk.total}TB NVMe RAID-10</span>
          <span>Uptime: <span className="text-term-accent">{m.uptime}</span></span>
        </div>
      </Sec>

      {/* Resources Chart */}
      <Sec
        title="RESOURCES"
        expand={{ on: !!charts.res, toggle: () => toggleChart("res"), content: (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-term-muted text-[11px] mb-1">CPU avg (50s)</div>
              <Sparkline data={cpuHist} color="bg-term-accent" />
            </div>
            <div>
              <div className="text-term-muted text-[11px] mb-1">Memory (50s)</div>
              <Sparkline data={memHist} color="bg-term-prompt" />
            </div>
          </div>
        )}}
      >
        <div className="flex gap-6 text-term-muted">
          <span>Net RX <span className="text-term-warning">{rf(18, 42)} Gbps</span></span>
          <span>TX <span className="text-term-warning">{rf(12, 28)} Gbps</span></span>
          <span>Bandwidth <span className="text-term-accent">{m.net.bw} Gbps</span></span>
        </div>
      </Sec>

      {/* GPU Cluster */}
      <Sec
        title={`GPU CLUSTER (${m.gpus.length}x -- nvidia-smi)`}
        expand={{ on: !!charts.gpu, toggle: () => toggleChart("gpu"), content: (
          <div className="grid grid-cols-3 gap-2">
            {m.gpus.map((g) => (
              <div key={g.id}>
                <div className="text-term-muted text-[11px] mb-0.5">GPU{g.id} {g.job}</div>
                <Sparkline data={Array.from({ length: 20 }, () => r(Math.max(40, g.util - 20), Math.min(99, g.util + 5)))} color={g.util > 90 ? "bg-term-error" : "bg-term-accent"} />
              </div>
            ))}
          </div>
        )}}
      >
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {m.gpus.map((g) => (
            <div key={g.id} className="bg-term-selection/30 rounded p-1.5 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-term-prompt">GPU{g.id} {g.name}</span>
                <span className="text-term-warning text-[11px]">{g.temp}C {g.power}W</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[11px] text-term-muted">Util {g.util}%</div>
                  <Bar pct={g.util} color="bg-term-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-term-muted">VRAM {g.mem}/80G</div>
                  <Bar pct={(g.mem / 80) * 100} color="bg-term-link" />
                </div>
              </div>
              <div className="text-[11px] text-term-muted truncate">{g.job}</div>
            </div>
          ))}
        </div>
      </Sec>

      {/* Multi-Cluster */}
      <Sec title="MULTI-CLUSTER FEDERATION">
        <div className="space-y-1">
          <div className="flex gap-3 text-term-accent">
            <span className="w-28">CLUSTER</span>
            <span className="w-8">N</span>
            <span className="w-10">PODS</span>
            <span className="w-10">CPU</span>
            <span className="w-10">MEM</span>
            <span>STATUS</span>
          </div>
          {m.clusters.map((c) => (
            <div key={c.name} className="flex gap-3">
              <span className="w-28 text-term-prompt">{c.name}</span>
              <span className="w-8 text-term-muted">{c.nodes}</span>
              <span className="w-10 text-term-warning">{c.pods}</span>
              <span className="w-10 text-term-warning">{c.cpu}%</span>
              <span className="w-10 text-term-warning">{c.mem}%</span>
              <span className={c.status === "healthy" ? "text-term-accent" : "text-term-error"}>{c.status}</span>
            </div>
          ))}
        </div>
      </Sec>

      {/* Workloads + Traffic */}
      <div className="grid grid-cols-2 gap-2">
        <Sec
          title="TOP WORKLOADS"
          expand={{ on: !!charts.work, toggle: () => toggleChart("work"), content: (
            <div>
              <div className="text-term-muted text-[11px] mb-1">Requests/sec (50s)</div>
              <Sparkline data={netHist} color="bg-term-warning" />
            </div>
          )}}
        >
          <div className="space-y-0.5">
            <div className="flex gap-1 text-term-accent">
              <span className="w-20">NAME</span>
              <span className="w-8">RDY</span>
              <span className="w-8">CPU</span>
              <span className="w-10">MEM</span>
              <span>GPU</span>
            </div>
            {m.workloads.map((w) => (
              <div key={w.name} className="flex gap-1">
                <span className="w-20 text-term-prompt truncate">{w.name}</span>
                <span className="w-8 text-term-accent">{w.rdy}</span>
                <span className="w-8 text-term-warning">{w.cpu}</span>
                <span className="w-10 text-term-warning">{w.mem}</span>
                <span className={w.gpu !== "-" ? "text-term-link" : "text-term-muted"}>{w.gpu}</span>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="TRAFFIC">
          <div className="space-y-1">
            <Row label="Req/s" value={m.net.reqSec.toLocaleString()} vc="text-term-accent" />
            <Row label="p99" value={`${m.net.p99}ms`} />
            <Row label="Errors" value={`${m.net.err}%`} vc={parseFloat(m.net.err) > 0.02 ? "text-term-error" : "text-term-accent"} />
            <Row label="Bandwidth" value={`${m.net.bw} Gbps`} />
            <Row label="Pods" value={`${m.pods.running}/${m.pods.total}`} vc="text-term-accent" />
            {m.pods.failed > 0 && <Row label="Failed" value={String(m.pods.failed)} vc="text-term-error" />}
          </div>
        </Sec>
      </div>
    </aside>
  );
}

/* ── Shared UI ── */

function Sec({ title, children, expand }: {
  title: string;
  children: React.ReactNode;
  expand?: { on: boolean; toggle: () => void; content: React.ReactNode };
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-term-warning text-[11px] tracking-wider opacity-70">{title}</div>
        {expand && (
          <button onClick={expand.toggle} className="text-[11px] text-term-link hover:text-term-accent px-1">
            {expand.on ? "[-]" : "[+]"}
          </button>
        )}
      </div>
      <div className="bg-term-bg border border-term-border rounded p-2 space-y-1 mt-0.5">
        {children}
        {expand?.on && (
          <div className="mt-2 pt-2 border-t border-term-border">{expand.content}</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, vc }: { label: string; value: string; vc?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-term-muted">{label}</span>
      <span className={vc || "text-term-fg"}>{value}</span>
    </div>
  );
}

/* ── Main Export ── */

export function SystemDashboard() {
  const m = useMetrics();
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return <ExpandedView m={m} onCollapse={() => setExpanded(false)} />;
  }
  return <CollapsedView m={m} onExpand={() => setExpanded(true)} />;
}
