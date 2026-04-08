import { register } from "./registry";
import { HackerAnimation, type HackerLine } from "@/components/hacker-animation";

/* ── helpers ── */

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randIp() {
  return `${rand(10, 223)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
}

function randMs() {
  return `${(Math.random() * 40 + 1).toFixed(3)} ms`;
}

function randHex(len: number) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

const OPEN_PORTS = [
  { port: 22, service: "ssh", version: "OpenSSH 8.9p1" },
  { port: 80, service: "http", version: "nginx/1.24.0" },
  { port: 443, service: "https", version: "nginx/1.24.0" },
  { port: 3306, service: "mysql", version: "MySQL 8.0.35" },
  { port: 5432, service: "postgresql", version: "PostgreSQL 16.1" },
  { port: 6379, service: "redis", version: "Redis 7.2.3" },
  { port: 8080, service: "http-proxy", version: "Apache Tomcat/10.1" },
  { port: 8443, service: "https-alt", version: "Kubernetes API" },
  { port: 9090, service: "prometheus", version: "Prometheus/2.48" },
  { port: 27017, service: "mongodb", version: "MongoDB 7.0.4" },
];

const CLOSED_PORTS = [21, 23, 25, 53, 110, 139, 445, 993, 995, 3389];

/* ── nmap ── */

register({
  name: "nmap",
  description: "Simulate a network port scan",
  usage: "nmap <target>",
  execute: (args) => {
    const target = args[0] || "harris.cv";
    const ip = randIp();
    const ports = OPEN_PORTS.slice(0, rand(3, 7)).sort((a, b) => a.port - b.port);
    const closed = CLOSED_PORTS.slice(0, rand(2, 4));

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}`, delay: 200 },
      { text: `Nmap scan report for ${target} (${ip})`, delay: 600 },
      { text: `Host is up (0.0${rand(1, 9)}${rand(0, 9)}s latency).`, delay: 300 },
      { text: `rDNS record for ${ip}: ${target}`, delay: 200 },
      { text: `Not shown: ${985 - ports.length} closed tcp ports`, delay: 400 },
      { text: "", delay: 100 },
      { text: "PORT      STATE    SERVICE         VERSION", delay: 150, color: "text-term-accent" },
    ];

    for (const p of ports) {
      const portStr = `${p.port}/tcp`.padEnd(10);
      lines.push({
        text: `${portStr}open     ${p.service.padEnd(16)}${p.version}`,
        delay: rand(60, 180),
        color: "text-term-prompt",
      });
    }

    for (const p of closed.slice(0, 2)) {
      lines.push({
        text: `${`${p}/tcp`.padEnd(10)}closed   unknown`,
        delay: rand(40, 100),
        color: "text-term-muted",
      });
    }

    lines.push(
      { text: "", delay: 200 },
      { text: `OS detection: Linux 5.15 - 6.5 (96% confidence)`, delay: 300 },
      { text: `Network Distance: ${rand(2, 15)} hops`, delay: 200 },
      { text: "", delay: 100 },
      { text: `Nmap done: 1 IP address (1 host up) scanned in ${rand(4, 18)}.${rand(10, 99)} seconds`, delay: 400 },
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
      { text: `PING ${host} (${ip}) 56(84) bytes of data.`, delay: 200 },
    ];

    for (let i = 1; i <= 6; i++) {
      lines.push({
        text: `64 bytes from ${ip}: icmp_seq=${i} ttl=${rand(50, 64)} time=${randMs()}`,
        delay: rand(400, 800),
      });
    }

    const loss = rand(0, 1) === 0 ? "0" : `${rand(1, 16)}`;
    lines.push(
      { text: "", delay: 200 },
      { text: `--- ${host} ping statistics ---`, delay: 100, color: "text-term-accent" },
      { text: `6 packets transmitted, ${loss === "0" ? "6" : 6 - 1} received, ${loss}% packet loss`, delay: 150 },
      { text: `rtt min/avg/max/mdev = ${(Math.random() * 5 + 1).toFixed(3)}/${(Math.random() * 10 + 5).toFixed(3)}/${(Math.random() * 20 + 10).toFixed(3)}/${(Math.random() * 5).toFixed(3)} ms`, delay: 150 },
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
      { text: `traceroute to ${host} (${destIp}), ${hops + 2} hops max, 60 byte packets`, delay: 300 },
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
        lines.push({ text: ` ${String(i).padStart(2)}  * * *`, delay: rand(300, 600), color: "text-term-warning" });
      } else {
        lines.push({
          text: ` ${String(i).padStart(2)}  ${router} (${randIp()})  ${randMs()}  ${randMs()}  ${randMs()}`,
          delay: rand(200, 500),
        });
      }
    }

    lines.push({
      text: ` ${String(hops + 1).padStart(2)}  ${host} (${destIp})  ${randMs()}  ${randMs()}  ${randMs()}`,
      delay: rand(200, 400),
      color: "text-term-prompt",
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
    const fingerprint = `SHA256:${randHex(43).replace(/(.{11})/g, "$1:").slice(0, -1)}`;

    const lines: HackerLine[] = [
      { text: `OpenSSH_9.6p1, OpenSSL 3.2.0 23 Nov 2023`, delay: 200 },
      { text: `Connecting to ${host} (${ip}) port 22...`, delay: 800 },
      { text: `Connection established.`, delay: 600, color: "text-term-prompt" },
      { text: `Host key fingerprint is ${fingerprint}`, delay: 200 },
      { text: `+---[ECDSA 256]---+`, delay: 100 },
      { text: `|    .o*=+.o      |`, delay: 50 },
      { text: `|   . o=+Bo .     |`, delay: 50 },
      { text: `|    .o=*=.o      |`, delay: 50 },
      { text: `|     .+=o+  .    |`, delay: 50 },
      { text: `|      .S+.oo     |`, delay: 50 },
      { text: `|       . +.=     |`, delay: 50 },
      { text: `|        o E .    |`, delay: 50 },
      { text: `|       . . .     |`, delay: 50 },
      { text: `|                 |`, delay: 50 },
      { text: `+----[SHA256]-----+`, delay: 100 },
      { text: "", delay: 300 },
      { text: `Authenticated to ${host} ([${ip}]:22) using "publickey".`, delay: 500, color: "text-term-prompt" },
      { text: `Welcome to HarrisOS 1.0.0 (GNU/Linux 6.5.0-harris x86_64)`, delay: 300 },
      { text: "", delay: 100 },
      { text: ` * Documentation:  https://harris.cv/docs`, delay: 100 },
      { text: ` * Management:     https://harris.cv/admin`, delay: 100 },
      { text: ` * Support:        minhan112001@gmail.com`, delay: 100 },
      { text: "", delay: 100 },
      { text: `  System load:  0.${rand(1, 9)}${rand(0, 9)}          Processes:           ${rand(120, 350)}`, delay: 150 },
      { text: `  Memory usage: ${rand(20, 65)}%            Users logged in:     ${rand(1, 5)}`, delay: 150 },
      { text: `  Disk usage:   ${rand(15, 55)}%            IPv4 address:        ${ip}`, delay: 150 },
      { text: `  Uptime:       ${rand(30, 365)} days`, delay: 150 },
      { text: "", delay: 200 },
      { text: `Last login: ${new Date(Date.now() - rand(3600000, 86400000)).toUTCString()} from ${randIp()}`, delay: 300 },
      { text: `${user}@${host.split(".")[0]}:~$ Connection closed. (simulated)`, delay: 800, color: "text-term-muted" },
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
    // Odd minute = success, even minute = fail
    const success = new Date().getMinutes() % 2 === 1;

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: `[*] Target: ${target} (${ip})`, delay: 300, color: "text-term-accent" },
      { text: `[*] Initializing attack framework v4.2.0...`, delay: 500 },
      { text: "", delay: 200 },

      // Phase 1: Recon
      { text: `── Phase 1: Reconnaissance ──`, delay: 400, color: "text-term-warning" },
      { text: `[+] Enumerating subdomains...`, delay: 300 },
      { text: `    Found: api.${target}`, delay: 200 },
      { text: `    Found: admin.${target}`, delay: 150 },
      { text: `    Found: staging.${target}`, delay: 180 },
      { text: `    Found: cdn.${target}`, delay: 120 },
      { text: `[+] DNS records resolved (${rand(4, 8)} entries)`, delay: 300 },
      { text: `[+] Whois lookup complete`, delay: 250 },
      { text: `[+] Technology stack identified: Next.js, TypeScript, PostgreSQL`, delay: 400, color: "text-term-prompt" },
      { text: "", delay: 200 },

      // Phase 2: Scanning
      { text: `── Phase 2: Scanning ──`, delay: 400, color: "text-term-warning" },
      { text: `[+] Running SYN scan on ${rand(1000, 65535)} ports...`, delay: 600 },
      { text: `    22/tcp   open  ssh       OpenSSH 8.9`, delay: 150 },
      { text: `    80/tcp   open  http      nginx/1.24`, delay: 120 },
      { text: `    443/tcp  open  https     nginx/1.24`, delay: 130 },
      { text: `    5432/tcp open  postgresql PostgreSQL 16`, delay: 140 },
      { text: `[+] OS fingerprint: Linux 6.x (98% confidence)`, delay: 300 },
      { text: `[+] Firewall detected: iptables + cloudflare WAF`, delay: 350 },
      { text: "", delay: 200 },

      // Phase 3: Exploitation
      { text: `── Phase 3: Exploitation ──`, delay: 400, color: "text-term-warning" },
      { text: `[*] Checking CVE database... ${rand(3, 12)} potential vectors`, delay: 500 },
      { text: `[*] Testing SQL injection on /api endpoints...`, delay: 400 },
    ];

    if (success) {
      // Odd minute — hack succeeds
      lines.push(
        { text: `[+] SQLi bypass found on /api/guestbook!`, delay: 300, color: "text-term-prompt" },
        { text: `[*] Extracting database credentials...`, delay: 500 },
        { text: `[+] Got DB creds: admin:${randHex(8)}`, delay: 400, color: "text-term-prompt" },
        { text: `[*] Escalating privileges via CVE-2024-${rand(10000, 49999)}...`, delay: 600 },
        { text: `[+] Privilege escalation successful!`, delay: 500, color: "text-term-prompt" },
        { text: `[*] Spawning reverse shell on ${randIp()}:4444...`, delay: 700 },
        { text: `[+] Connection established!`, delay: 500, color: "text-term-prompt" },
        { text: "", delay: 300 },
        { text: `══════════════════════════════════════════════`, delay: 300, color: "text-term-prompt" },
        { text: `  ACCESS GRANTED — root shell obtained`, delay: 400, color: "text-term-prompt" },
        { text: `══════════════════════════════════════════════`, delay: 200, color: "text-term-prompt" },
        { text: "", delay: 200 },
        { text: `root@${target}:~# cat /etc/shadow`, delay: 500 },
        { text: `root:$6$${randHex(16)}:19741:0:99999:7:::`, delay: 200 },
        { text: `harris:$6$${randHex(16)}:19741:0:99999:7:::`, delay: 200 },
        { text: "", delay: 300 },
        { text: `root@${target}:~# cat /root/secret.txt`, delay: 500 },
        { text: "", delay: 400 },
        { text: `  "Just kidding. This is a simulated terminal."`, delay: 300, color: "text-term-accent" },
        { text: `  "But the skills on this CV are very real."`, delay: 300, color: "text-term-accent" },
        { text: `  "Type 'experience' or 'skills' to see for yourself."`, delay: 400, color: "text-term-prompt" },
        { text: "", delay: 0 },
      );
    } else {
      // Even minute — hack fails
      lines.push(
        { text: `[-] WAF blocked SQLi attempts`, delay: 300, color: "text-term-error" },
        { text: `[*] Testing XSS on input fields...`, delay: 400 },
        { text: `[-] CSP headers prevent XSS`, delay: 300, color: "text-term-error" },
        { text: `[*] Attempting SSH brute-force...`, delay: 500 },
        { text: `[-] Fail2ban detected, IP banned after 3 attempts`, delay: 400, color: "text-term-error" },
        { text: `[*] Trying directory traversal...`, delay: 400 },
        { text: `[-] Path sanitization in place`, delay: 300, color: "text-term-error" },
        { text: "", delay: 300 },
        { text: `══════════════════════════════════════════`, delay: 300, color: "text-term-accent" },
        { text: `  ACCESS DENIED — System is well-secured`, delay: 400, color: "text-term-error" },
        { text: `══════════════════════════════════════════`, delay: 200, color: "text-term-accent" },
        { text: "", delay: 200 },
        { text: `[!] This system is maintained by a DevOps engineer`, delay: 300 },
        { text: `[!] who actually knows what they're doing.`, delay: 300 },
        { text: `[!] Try 'sudo hire-me' instead ;)`, delay: 400, color: "text-term-prompt" },
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
    const cve = `CVE-${2024}-${rand(10000, 49999)}`;

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: `msf6 > use exploit/multi/handler`, delay: 300 },
      { text: `msf6 exploit(handler) > set RHOSTS ${target}`, delay: 200 },
      { text: `RHOSTS => ${ip}`, delay: 150 },
      { text: `msf6 exploit(handler) > set PAYLOAD linux/x64/meterpreter/reverse_tcp`, delay: 200 },
      { text: `msf6 exploit(handler) > exploit`, delay: 400 },
      { text: "", delay: 300 },
      { text: `[*] Started reverse TCP handler on 0.0.0.0:4444`, delay: 500 },
      { text: `[*] Attempting ${cve} against ${target}...`, delay: 600 },
      { text: `[*] Sending stage (${rand(200, 400)} bytes) to ${ip}...`, delay: 800 },
      { text: `[*] Encoding payload with x86/shikata_ga_nai (${rand(3, 8)} iterations)...`, delay: 500 },
      { text: `[*] Payload delivered, waiting for callback...`, delay: 1000 },
      { text: "", delay: 500 },
      { text: `[-] Exploit failed: Connection refused`, delay: 600, color: "text-term-error" },
      { text: `[-] Target's security is too strong`, delay: 300, color: "text-term-error" },
      { text: `[-] IDS/IPS alert triggered — your IP has been logged`, delay: 400, color: "text-term-error" },
      { text: "", delay: 300 },
      { text: `[!] Nice try. This server is hardened by harris.`, delay: 400, color: "text-term-prompt" },
      { text: `[!] Maybe check 'projects' or 'experience' instead?`, delay: 300, color: "text-term-prompt" },
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

    const hexBlocks: string[] = [];
    for (let i = 0; i < 6; i++) {
      const offset = (i * 16).toString(16).padStart(8, "0");
      const hex = Array.from({ length: 16 }, () => randHex(2)).join(" ");
      const ascii = Array.from({ length: 16 }, () => {
        const c = rand(33, 126);
        return String.fromCharCode(c);
      }).join("");
      hexBlocks.push(`${offset}  ${hex}  |${ascii}|`);
    }

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: `[*] Loading encrypted file: ${file}`, delay: 300 },
      { text: `[*] Cipher: AES-256-GCM`, delay: 200 },
      { text: `[*] Key derivation: PBKDF2 (${rand(100000, 600000)} iterations)`, delay: 250 },
      { text: `[*] Attempting decryption...`, delay: 500 },
      { text: "", delay: 300 },
      { text: `    Analyzing entropy... ${(Math.random() * 2 + 6).toFixed(4)} bits/byte`, delay: 400 },
      { text: `    Testing key space... `, delay: 300 },
      { text: `    ██████████████████████████████ 100%`, delay: 800, color: "text-term-prompt" },
      { text: "", delay: 200 },
      { text: `    Hex dump:`, delay: 200, color: "text-term-accent" },
      ...hexBlocks.map((block) => ({ text: `    ${block}`, delay: rand(80, 150) })),
      { text: "", delay: 300 },
      { text: `[+] Decryption successful!`, delay: 400, color: "text-term-prompt" },
      { text: "", delay: 200 },
      { text: `    ┌──────────────────────────────────────┐`, delay: 100 },
      { text: `    │  DECRYPTED MESSAGE:                   │`, delay: 100 },
      { text: `    │                                       │`, delay: 100 },
      { text: `    │  "Hire Harris. You won't regret it."  │`, delay: 300, color: "text-term-prompt" },
      { text: `    │                                       │`, delay: 100 },
      { text: `    │  — A satisfied employer, 2025         │`, delay: 150 },
      { text: `    └──────────────────────────────────────┘`, delay: 100 },
      { text: "", delay: 0 },
    ];

    return { type: "jsx", content: <HackerAnimation lines={lines} /> };
  },
});
