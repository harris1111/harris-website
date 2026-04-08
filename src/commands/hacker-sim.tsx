import { register } from "./registry";
import { c } from "./format-helpers";
import { HackerAnimation, type HackerLine } from "@/components/hacker-animation";
import {
  rand, pick, pickN, randIp, randMs, randHex,
  OPEN_PORTS, CLOSED_PORTS,
  reconScenarios, scanScenarios, failScenarios, successScenarios,
} from "@/data/hacker-scenarios";
import { successOutros, failOutros } from "@/data/hacker-outros";

/* ── nmap ── */

register({
  name: "nmap",
  description: "Simulate a network port scan",
  usage: "nmap <target>",
  execute: (args) => {
    const target = args[0] || "harris.cv";
    const ip = randIp();
    const ports = pickN(OPEN_PORTS, rand(3, 7)).sort((a, b) => a.port - b.port);
    const closed = pickN(CLOSED_PORTS, rand(2, 4));

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: <>Starting {c("Nmap 7.94", "text-term-prompt")} ( https://nmap.org ) at {c(new Date().toISOString(), "text-term-muted")}</>, delay: 200 },
      { text: <>Nmap scan report for {c(target, "text-term-link")} ({c(ip, "text-term-warning")})</>, delay: 600 },
      { text: <>Host is up ({c(`0.0${rand(1, 9)}${rand(0, 9)}s`, "text-term-accent")} latency).</>, delay: 300 },
      { text: <>rDNS record for {c(ip, "text-term-warning")}: {c(target, "text-term-link")}</>, delay: 200 },
      { text: <>Not shown: {c(String(985 - ports.length), "text-term-muted")} closed tcp ports</>, delay: 400 },
      { text: "", delay: 100 },
      { text: <>{c("PORT", "text-term-accent")}      {c("STATE", "text-term-accent")}    {c("SERVICE", "text-term-accent")}         {c("VERSION", "text-term-accent")}</>, delay: 150 },
    ];

    for (const p of ports) {
      lines.push({
        text: <>{c(`${p.port}/tcp`.padEnd(10), "text-term-warning")}{c("open", "text-term-accent")}     {c(p.service.padEnd(16), "text-term-prompt")}{c(p.version, "text-term-muted")}</>,
        delay: rand(60, 180),
      });
    }

    for (const p of closed.slice(0, 2)) {
      lines.push({
        text: <>{c(`${p}/tcp`.padEnd(10), "text-term-muted")}{c("closed", "text-term-error")}   {c("unknown", "text-term-muted")}</>,
        delay: rand(40, 100),
      });
    }

    lines.push(
      { text: "", delay: 200 },
      { text: <>OS detection: {c("Linux 5.15 - 6.5", "text-term-prompt")} ({c("96%", "text-term-warning")} confidence)</>, delay: 300 },
      { text: <>Network Distance: {c(String(rand(2, 15)), "text-term-warning")} hops</>, delay: 200 },
      { text: "", delay: 100 },
      { text: <>Nmap done: {c("1", "text-term-accent")} IP address ({c("1 host up", "text-term-accent")}) scanned in {c(`${rand(4, 18)}.${rand(10, 99)}`, "text-term-warning")} seconds</>, delay: 400 },
    );

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── ping ── */

register({
  name: "ping",
  description: "Simulate ICMP ping to a host",
  usage: "ping <host>",
  execute: (args) => {
    const host = args[0] || "harris.cv";
    const ip = randIp();
    const lines: HackerLine[] = [
      { text: <>{c("PING", "text-term-prompt")} {c(host, "text-term-link")} ({c(ip, "text-term-warning")}) {c("56(84)", "text-term-muted")} bytes of data.</>, delay: 200 },
    ];

    for (let i = 1; i <= 6; i++) {
      const time = randMs();
      lines.push({
        text: <>{c("64", "text-term-accent")} bytes from {c(ip, "text-term-warning")}: icmp_seq={c(String(i), "text-term-accent")} ttl={c(String(rand(50, 64)), "text-term-muted")} time={c(time, "text-term-prompt")}</>,
        delay: rand(400, 800),
      });
    }

    const loss = rand(0, 1) === 0 ? "0" : `${rand(1, 16)}`;
    const lossColor = loss === "0" ? "text-term-accent" : "text-term-error";
    lines.push(
      { text: "", delay: 200 },
      { text: <>--- {c(host, "text-term-link")} ping statistics ---</>, delay: 100, color: "text-term-accent" },
      { text: <>{c("6", "text-term-accent")} packets transmitted, {c(loss === "0" ? "6" : "5", "text-term-accent")} received, {c(`${loss}%`, lossColor)} packet loss</>, delay: 150 },
      { text: <>rtt min/avg/max/mdev = {c((Math.random() * 5 + 1).toFixed(3), "text-term-prompt")}/{c((Math.random() * 10 + 5).toFixed(3), "text-term-warning")}/{c((Math.random() * 20 + 10).toFixed(3), "text-term-error")}/{c((Math.random() * 5).toFixed(3), "text-term-muted")} ms</>, delay: 150 },
    );

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── traceroute ── */

register({
  name: "traceroute",
  description: "Simulate network route tracing",
  usage: "traceroute <host>",
  execute: (args) => {
    const host = args[0] || "harris.cv";
    const destIp = randIp();
    const hops = rand(8, 16);
    const lines: HackerLine[] = [
      { text: <>{c("traceroute", "text-term-prompt")} to {c(host, "text-term-link")} ({c(destIp, "text-term-warning")}), {c(String(hops + 2), "text-term-accent")} hops max, 60 byte packets</>, delay: 300 },
    ];

    const routers = [
      "gateway.local", "core-rtr-01.isp.net", "ae-12.cr2.sgn.as9009.net",
      "be100.edge1.hkg.level3.net", "xe-0-0-1.cr1.nrt.as2914.net",
      "lag-5.ear1.tokyo1.level3.net", "cloudflare-ic.ip4.gtt.net",
      "172.71.128.2", "104.16.45.1",
    ];

    for (let i = 1; i <= hops; i++) {
      const router = i <= routers.length ? routers[i - 1] : randIp();
      const isTimeout = rand(1, 12) === 1;
      if (isTimeout) {
        lines.push({ text: <> {c(String(i).padStart(2), "text-term-muted")}  {c("* * *", "text-term-error")}</>, delay: rand(300, 600) });
      } else {
        lines.push({
          text: <> {c(String(i).padStart(2), "text-term-muted")}  {c(router, "text-term-link")} ({c(randIp(), "text-term-warning")})  {c(randMs(), "text-term-prompt")}  {c(randMs(), "text-term-prompt")}  {c(randMs(), "text-term-prompt")}</>,
          delay: rand(200, 500),
        });
      }
    }

    lines.push({
      text: <> {c(String(hops + 1).padStart(2), "text-term-accent")}  {c(host, "text-term-link")} ({c(destIp, "text-term-warning")})  {c(randMs(), "text-term-accent")}  {c(randMs(), "text-term-accent")}  {c(randMs(), "text-term-accent")}</>,
      delay: rand(200, 400),
    });

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── ssh ── */

register({
  name: "ssh",
  description: "Simulate an SSH connection",
  usage: "ssh [user@]<host>",
  execute: (args) => {
    const target = args[0] || "root@harris.cv";
    const [user, host] = target.includes("@") ? target.split("@") : ["harris", target];
    const ip = randIp();
    const fp = randHex(43).replace(/(.{11})/g, "$1:").slice(0, -1);

    const lines: HackerLine[] = [
      { text: <>{c("OpenSSH_9.6p1", "text-term-prompt")}, {c("OpenSSL 3.2.0", "text-term-muted")} 23 Nov 2023</>, delay: 200 },
      { text: <>Connecting to {c(host, "text-term-link")} ({c(ip, "text-term-warning")}) port {c("22", "text-term-accent")}...</>, delay: 800 },
      { text: <>{c("Connection established.", "text-term-accent")}</>, delay: 600 },
      { text: <>Host key fingerprint is {c(`SHA256:${fp}`, "text-term-muted")}</>, delay: 200 },
      { text: `+---[ECDSA 256]---+`, delay: 100, color: "text-term-muted" },
      { text: `|    .o*=+.o      |`, delay: 50, color: "text-term-muted" },
      { text: `|   . o=+Bo .     |`, delay: 50, color: "text-term-muted" },
      { text: `|    .o=*=.o      |`, delay: 50, color: "text-term-muted" },
      { text: `|     .+=o+  .    |`, delay: 50, color: "text-term-muted" },
      { text: `|      .S+.oo     |`, delay: 50, color: "text-term-muted" },
      { text: `|       . +.=     |`, delay: 50, color: "text-term-muted" },
      { text: `|        o E .    |`, delay: 50, color: "text-term-muted" },
      { text: `|       . . .     |`, delay: 50, color: "text-term-muted" },
      { text: `|                 |`, delay: 50, color: "text-term-muted" },
      { text: `+----[SHA256]-----+`, delay: 100, color: "text-term-muted" },
      { text: "", delay: 300 },
      { text: <>{c("Authenticated", "text-term-accent")} to {c(host, "text-term-link")} ([{c(ip, "text-term-warning")}]:{c("22", "text-term-accent")}) using {c('"publickey"', "text-term-prompt")}.</>, delay: 500 },
      { text: <>Welcome to {c("HarrisOS 1.0.0", "text-term-prompt")} ({c("GNU/Linux 6.5.0-harris x86_64", "text-term-muted")})</>, delay: 300 },
      { text: "", delay: 100 },
      { text: <> * Documentation:  {c("https://harris.cv/docs", "text-term-link")}</>, delay: 100 },
      { text: <> * Management:     {c("https://harris.cv/admin", "text-term-link")}</>, delay: 100 },
      { text: <> * Support:        {c("minhan112001@gmail.com", "text-term-link")}</>, delay: 100 },
      { text: "", delay: 100 },
      { text: <>  {c("System load:", "text-term-prompt")}  {c(`0.${rand(1, 9)}${rand(0, 9)}`, "text-term-warning")}          {c("Processes:", "text-term-prompt")}           {c(String(rand(120, 350)), "text-term-warning")}</>, delay: 150 },
      { text: <>  {c("Memory usage:", "text-term-prompt")} {c(`${rand(20, 65)}%`, "text-term-warning")}            {c("Users logged in:", "text-term-prompt")}     {c(String(rand(1, 5)), "text-term-warning")}</>, delay: 150 },
      { text: <>  {c("Disk usage:", "text-term-prompt")}   {c(`${rand(15, 55)}%`, "text-term-warning")}            {c("IPv4 address:", "text-term-prompt")}        {c(ip, "text-term-link")}</>, delay: 150 },
      { text: <>  {c("Uptime:", "text-term-prompt")}       {c(`${rand(30, 365)} days`, "text-term-accent")}</>, delay: 150 },
      { text: "", delay: 200 },
      { text: <>Last login: {c(new Date(Date.now() - rand(3600000, 86400000)).toUTCString(), "text-term-muted")} from {c(randIp(), "text-term-warning")}</>, delay: 300 },
      { text: <>{c(user, "text-term-prompt")}@{c(host.split(".")[0], "text-term-link")}:~$ {c("Connection closed. (simulated)", "text-term-muted")}</>, delay: 800 },
    ];

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── hack ── */

register({
  name: "hack",
  description: "Simulate a full hacking sequence",
  usage: "hack <target>",
  execute: (args) => {
    const target = args[0] || "harris.cv";
    const ip = randIp();
    const isOddMinute = new Date().getMinutes() % 2 !== 0;

    const recon = pick(reconScenarios(target))();
    const scan = pick(scanScenarios(target))();

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: <>{c("[*]", "text-term-accent")} Target: {c(target, "text-term-link")} ({c(ip, "text-term-warning")})</>, delay: 300 },
      { text: <>{c("[*]", "text-term-accent")} Initializing attack framework {c(`v${rand(3, 5)}.${rand(0, 9)}.${rand(0, 9)}`, "text-term-prompt")}...</>, delay: 500 },
      { text: "", delay: 200 },
      { text: <>{c("── Phase 1: Reconnaissance ──", "text-term-warning")}</>, delay: 400 },
      ...recon,
      { text: "", delay: 200 },
      { text: <>{c("── Phase 2: Scanning ──", "text-term-warning")}</>, delay: 400 },
      ...scan,
      { text: "", delay: 200 },
      { text: <>{c("── Phase 3: Exploitation ──", "text-term-warning")}</>, delay: 400 },
    ];

    if (isOddMinute) {
      const exploit = pick(successScenarios(target))();
      const outro = pick(successOutros(target))();
      lines.push(
        ...exploit,
        { text: "", delay: 300 },
        { text: `══════════════════════════════════════════════`, delay: 300, color: "text-term-accent" },
        { text: <>{c("  ACCESS GRANTED", "text-term-accent")} — {c("root shell obtained", "text-term-prompt")}</>, delay: 400 },
        { text: `══════════════════════════════════════════════`, delay: 200, color: "text-term-accent" },
        { text: "", delay: 300 },
        ...outro,
        { text: "", delay: 0 },
      );
    } else {
      const fail = pick(failScenarios(target))();
      const outro = pick(failOutros(target))();
      lines.push(
        ...fail,
        { text: "", delay: 300 },
        { text: `══════════════════════════════════════════`, delay: 300, color: "text-term-muted" },
        { text: <>{c("  ACCESS DENIED", "text-term-error")} — {c("System is well-secured", "text-term-accent")}</>, delay: 400 },
        { text: `══════════════════════════════════════════`, delay: 200, color: "text-term-muted" },
        { text: "", delay: 300 },
        ...outro,
        { text: "", delay: 0 },
      );
    }

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── exploit ── */

register({
  name: "exploit",
  description: "Simulate running an exploit",
  usage: "exploit <target>",
  execute: (args) => {
    const target = args[0] || "harris.cv";
    const ip = randIp();
    const cve = `CVE-2024-${rand(10000, 49999)}`;

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: <>{c("msf6", "text-term-error")} &gt; use {c("exploit/multi/handler", "text-term-link")}</>, delay: 300 },
      { text: <>{c("msf6", "text-term-error")} exploit({c("handler", "text-term-prompt")}) &gt; set {c("RHOSTS", "text-term-warning")} {c(target, "text-term-link")}</>, delay: 200 },
      { text: <>{c("RHOSTS", "text-term-warning")} =&gt; {c(ip, "text-term-link")}</>, delay: 150 },
      { text: <>{c("msf6", "text-term-error")} exploit({c("handler", "text-term-prompt")}) &gt; set {c("PAYLOAD", "text-term-warning")} {c("linux/x64/meterpreter/reverse_tcp", "text-term-accent")}</>, delay: 200 },
      { text: <>{c("msf6", "text-term-error")} exploit({c("handler", "text-term-prompt")}) &gt; {c("exploit", "text-term-error")}</>, delay: 400 },
      { text: "", delay: 300 },
      { text: <>{c("[*]", "text-term-accent")} Started reverse TCP handler on {c("0.0.0.0:4444", "text-term-link")}</>, delay: 500 },
      { text: <>{c("[*]", "text-term-accent")} Attempting {c(cve, "text-term-warning")} against {c(target, "text-term-link")}...</>, delay: 600 },
      { text: <>{c("[*]", "text-term-accent")} Sending stage ({c(`${rand(200, 400)} bytes`, "text-term-warning")}) to {c(ip, "text-term-link")}...</>, delay: 800 },
      { text: <>{c("[*]", "text-term-accent")} Encoding payload with {c("x86/shikata_ga_nai", "text-term-prompt")} ({c(String(rand(3, 8)), "text-term-warning")} iterations)...</>, delay: 500 },
      { text: <>{c("[*]", "text-term-accent")} Payload delivered, waiting for callback...</>, delay: 1000 },
      { text: "", delay: 500 },
      { text: <>{c("[-]", "text-term-error")} Exploit failed: {c("Connection refused", "text-term-error")}</>, delay: 600 },
      { text: <>{c("[-]", "text-term-error")} Target's security is too strong</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} IDS/IPS alert triggered — your IP has been {c("logged", "text-term-warning")}</>, delay: 400 },
      { text: "", delay: 300 },
      { text: <>{c("[!]", "text-term-warning")} Nice try. This server is hardened by {c("harris", "text-term-prompt")}.</>, delay: 400 },
      { text: <>{c("[!]", "text-term-warning")} Maybe check {c("'projects'", "text-term-link")} or {c("'experience'", "text-term-link")} instead?</>, delay: 300 },
      { text: "", delay: 0 },
    ];

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});

/* ── decrypt ── */

register({
  name: "decrypt",
  description: "Simulate decrypting an encrypted file",
  usage: "decrypt <file>",
  execute: (args) => {
    const file = args[0] || "secret.enc";

    const hexLines: HackerLine[] = [];
    for (let i = 0; i < 6; i++) {
      const offset = (i * 16).toString(16).padStart(8, "0");
      const hex = Array.from({ length: 16 }, () => randHex(2)).join(" ");
      const ascii = Array.from({ length: 16 }, () =>
        String.fromCharCode(rand(33, 126))
      ).join("");
      hexLines.push({
        text: <>    {c(offset, "text-term-muted")}  {c(hex, "text-term-warning")}  |{c(ascii, "text-term-accent")}|</>,
        delay: rand(80, 150),
      });
    }

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: <>{c("[*]", "text-term-accent")} Loading encrypted file: {c(file, "text-term-link")}</>, delay: 300 },
      { text: <>{c("[*]", "text-term-accent")} Cipher: {c("AES-256-GCM", "text-term-prompt")}</>, delay: 200 },
      { text: <>{c("[*]", "text-term-accent")} Key derivation: {c("PBKDF2", "text-term-prompt")} ({c(String(rand(100000, 600000)), "text-term-warning")} iterations)</>, delay: 250 },
      { text: <>{c("[*]", "text-term-accent")} Attempting decryption...</>, delay: 500 },
      { text: "", delay: 300 },
      { text: <>    Analyzing entropy... {c(`${(Math.random() * 2 + 6).toFixed(4)} bits/byte`, "text-term-warning")}</>, delay: 400 },
      { text: `    Testing key space... `, delay: 300 },
      { text: <>    {c("██████████████████████████████", "text-term-accent")} {c("100%", "text-term-prompt")}</>, delay: 800 },
      { text: "", delay: 200 },
      { text: <>    {c("Hex dump:", "text-term-prompt")}</>, delay: 200 },
      ...hexLines,
      { text: "", delay: 300 },
      { text: <>{c("[+]", "text-term-accent")} Decryption {c("successful", "text-term-accent")}!</>, delay: 400 },
      { text: "", delay: 200 },
      { text: `    ┌──────────────────────────────────────┐`, delay: 100, color: "text-term-muted" },
      { text: <>    │  {c("DECRYPTED MESSAGE:", "text-term-warning")}                   │</>, delay: 100 },
      { text: `    │                                       │`, delay: 100, color: "text-term-muted" },
      { text: <>    │  {c('"Hire Harris. You won\'t regret it."', "text-term-accent")}  │</>, delay: 300 },
      { text: `    │                                       │`, delay: 100, color: "text-term-muted" },
      { text: <>    │  — {c("A satisfied employer", "text-term-prompt")}, {c("2025", "text-term-warning")}         │</>, delay: 150 },
      { text: `    └──────────────────────────────────────┘`, delay: 100, color: "text-term-muted" },
      { text: "", delay: 0 },
    ];

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});
