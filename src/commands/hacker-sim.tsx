import { register } from "./registry";
import { HackerAnimation, type HackerLine } from "@/components/hacker-animation";

/* ── helpers ── */

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
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

/* ── hack scenario pools (10 each) ── */

/** Phase 1: Recon — each returns HackerLine[] for that scenario */
function reconScenarios(target: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: `[+] Enumerating subdomains...`, delay: 300 },
      { text: `    Found: api.${target}`, delay: 200 },
      { text: `    Found: admin.${target}`, delay: 150 },
      { text: `    Found: staging.${target}`, delay: 180 },
      { text: `[+] ${rand(3, 7)} subdomains discovered`, delay: 200 },
    ],
    () => [
      { text: `[+] Running OSINT on ${target}...`, delay: 400 },
      { text: `    GitHub repos found: ${rand(5, 25)}`, delay: 200 },
      { text: `    Leaked emails: ${rand(1, 4)} addresses`, delay: 250 },
      { text: `    Employee profiles: ${rand(2, 8)} on LinkedIn`, delay: 200 },
    ],
    () => [
      { text: `[+] DNS zone transfer attempt...`, delay: 350 },
      { text: `    AXFR query to ns1.${target}...`, delay: 300 },
      { text: `    Got ${rand(12, 45)} DNS records`, delay: 250 },
      { text: `    MX, A, AAAA, CNAME, TXT entries dumped`, delay: 200 },
    ],
    () => [
      { text: `[+] Shodan search for ${target}...`, delay: 400 },
      { text: `    ${rand(2, 6)} hosts found in ${rand(1, 3)} data centers`, delay: 250 },
      { text: `    Cloud provider: ${pick(["AWS", "GCP", "Azure", "DigitalOcean", "Hetzner"])}`, delay: 200 },
      { text: `    SSL cert CN: *.${target}`, delay: 200 },
    ],
    () => [
      { text: `[+] Wayback Machine crawl...`, delay: 350 },
      { text: `    ${rand(50, 500)} snapshots from 2020-2025`, delay: 250 },
      { text: `    Found old admin panel at /wp-admin (removed)`, delay: 200 },
      { text: `    Found exposed .env in snapshot (rotated)`, delay: 200, color: "text-term-warning" },
    ],
    () => [
      { text: `[+] Google dorking ${target}...`, delay: 300 },
      { text: `    site:${target} filetype:pdf → ${rand(2, 15)} results`, delay: 200 },
      { text: `    site:${target} inurl:admin → ${rand(0, 3)} results`, delay: 200 },
      { text: `    Cached login page found`, delay: 250 },
    ],
    () => [
      { text: `[+] Certificate Transparency logs...`, delay: 350 },
      { text: `    ${rand(8, 30)} certificates issued for *.${target}`, delay: 250 },
      { text: `    Issuer: Let's Encrypt`, delay: 150 },
      { text: `    Wildcard cert detected — broad attack surface`, delay: 200, color: "text-term-warning" },
    ],
    () => [
      { text: `[+] theHarvester scan...`, delay: 300 },
      { text: `    Emails: admin@${target}, devops@${target}`, delay: 200 },
      { text: `    Hosts: ${rand(3, 8)} unique IPs resolved`, delay: 200 },
      { text: `    Virtual hosts: ${rand(2, 5)} on same IP`, delay: 200 },
    ],
    () => [
      { text: `[+] Reverse IP lookup on ${randIp()}...`, delay: 350 },
      { text: `    ${rand(1, 12)} other domains on same server`, delay: 250 },
      { text: `    Shared hosting detected — lateral movement possible`, delay: 200, color: "text-term-warning" },
      { text: `    ASN: AS${rand(10000, 65000)} (${pick(["Cloudflare", "AWS", "Google", "OVH"])})`, delay: 200 },
    ],
    () => [
      { text: `[+] Fingerprinting web technologies...`, delay: 300 },
      { text: `    Framework: ${pick(["Next.js 16", "React 19", "Nuxt 4", "Remix 3"])}`, delay: 200 },
      { text: `    Server: ${pick(["nginx/1.24", "Caddy/2.7", "Apache/2.4"])}`, delay: 150 },
      { text: `    CDN: ${pick(["Cloudflare", "Fastly", "CloudFront", "Vercel Edge"])}`, delay: 150 },
      { text: `    WAF: ${pick(["Cloudflare WAF", "AWS WAF", "ModSecurity", "Sucuri"])} detected`, delay: 200 },
    ],
  ];
}

/** Phase 2: Scanning — each returns HackerLine[] */
function scanScenarios(target: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: `[+] SYN scan on ${rand(1000, 65535)} ports...`, delay: 500 },
      { text: `    22/tcp   open  ssh       OpenSSH 8.9`, delay: 120 },
      { text: `    443/tcp  open  https     nginx/1.24`, delay: 120 },
      { text: `    5432/tcp open  postgresql PostgreSQL 16`, delay: 120 },
      { text: `[+] ${rand(3, 6)} open ports found`, delay: 200 },
    ],
    () => [
      { text: `[+] Nmap aggressive scan (-A)...`, delay: 600 },
      { text: `    OS: Linux 6.x (${rand(90, 99)}% confidence)`, delay: 200 },
      { text: `    Traceroute: ${rand(5, 15)} hops`, delay: 150 },
      { text: `    Scripts: ${rand(12, 40)} NSE scripts executed`, delay: 200 },
      { text: `    Found HTTP title: "Harris — Terminal CV"`, delay: 200, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Nikto web vulnerability scan...`, delay: 500 },
      { text: `    Server: nginx/1.24.0`, delay: 150 },
      { text: `    X-Frame-Options: SAMEORIGIN ✓`, delay: 150 },
      { text: `    X-Content-Type-Options: nosniff ✓`, delay: 150 },
      { text: `    ${rand(0, 2)} potential findings (low severity)`, delay: 200 },
    ],
    () => [
      { text: `[+] Gobuster directory brute-force...`, delay: 500 },
      { text: `    /api          (Status: 200)`, delay: 150 },
      { text: `    /blog         (Status: 200)`, delay: 120 },
      { text: `    /about        (Status: 200)`, delay: 120 },
      { text: `    /.env         (Status: 403) — blocked`, delay: 150, color: "text-term-error" },
      { text: `    /admin        (Status: 404)`, delay: 120 },
    ],
    () => [
      { text: `[+] SSL/TLS analysis (testssl.sh)...`, delay: 500 },
      { text: `    TLS 1.3: yes ✓`, delay: 150 },
      { text: `    TLS 1.2: yes (strong ciphers only) ✓`, delay: 150 },
      { text: `    HSTS: enabled (max-age=${rand(15000000, 31536000)})`, delay: 150 },
      { text: `    Certificate: valid for ${rand(30, 90)} more days`, delay: 150 },
    ],
    () => [
      { text: `[+] WPScan... target is NOT WordPress`, delay: 300 },
      { text: `[+] Falling back to nuclei templates...`, delay: 400 },
      { text: `    Running ${rand(3000, 6000)} templates against ${target}`, delay: 300 },
      { text: `    ${rand(0, 3)} info-level findings`, delay: 200 },
      { text: `    0 critical findings`, delay: 150 },
    ],
    () => [
      { text: `[+] Masscan UDP scan (top 100 ports)...`, delay: 500 },
      { text: `    53/udp    open  DNS`, delay: 120 },
      { text: `    123/udp   open  NTP`, delay: 120 },
      { text: `    All other UDP ports: filtered`, delay: 200 },
      { text: `[+] Firewall is blocking most UDP traffic`, delay: 200 },
    ],
    () => [
      { text: `[+] API endpoint enumeration...`, delay: 400 },
      { text: `    GET  /api/blog       → 200 (${rand(10, 50)} entries)`, delay: 150 },
      { text: `    GET  /api/guestbook  → 200 (rate-limited)`, delay: 150 },
      { text: `    POST /api/guestbook  → 429 (1 req/hour/IP)`, delay: 150, color: "text-term-warning" },
      { text: `    GET  /api/health     → 200 {"status":"ok"}`, delay: 150 },
    ],
    () => [
      { text: `[+] Vulnerability scan (OpenVAS)...`, delay: 600 },
      { text: `    Scanning ${rand(1000, 5000)} CVEs against services...`, delay: 400 },
      { text: `    High: 0  Medium: ${rand(0, 2)}  Low: ${rand(1, 5)}  Info: ${rand(3, 12)}`, delay: 250 },
      { text: `    No exploitable vulnerabilities found`, delay: 200 },
    ],
    () => [
      { text: `[+] DNS enumeration (dnsrecon)...`, delay: 400 },
      { text: `    A     ${target} → ${randIp()}`, delay: 120 },
      { text: `    AAAA  ${target} → 2606:4700::${randHex(4)}`, delay: 120 },
      { text: `    MX    ${target} → mail.${target} (pri 10)`, delay: 120 },
      { text: `    TXT   ${target} → "v=spf1 include:_spf.google.com ~all"`, delay: 150 },
      { text: `[+] DNSSEC: enabled ✓`, delay: 150 },
    ],
  ];
}

/** Phase 3 FAIL scenarios — attack blocked */
function failScenarios(target: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: `[*] SQL injection on /api/guestbook...`, delay: 400 },
      { text: `[-] WAF blocked: 403 Forbidden`, delay: 300, color: "text-term-error" },
      { text: `[*] XSS on input fields...`, delay: 350 },
      { text: `[-] CSP headers block inline scripts`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] SSH brute-force (hydra)...`, delay: 500 },
      { text: `    Trying admin:admin... FAILED`, delay: 200, color: "text-term-error" },
      { text: `    Trying root:password... FAILED`, delay: 200, color: "text-term-error" },
      { text: `[-] Fail2ban: IP banned after 3 attempts`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] Path traversal on /api/blog...`, delay: 400 },
      { text: `    ../../etc/passwd → 400 Bad Request`, delay: 250, color: "text-term-error" },
      { text: `[-] Input sanitization in place`, delay: 300, color: "text-term-error" },
      { text: `[*] Null byte injection...`, delay: 300 },
      { text: `[-] Blocked by framework`, delay: 250, color: "text-term-error" },
    ],
    () => [
      { text: `[*] CSRF token extraction...`, delay: 400 },
      { text: `[-] SameSite=Strict cookies — no CSRF possible`, delay: 300, color: "text-term-error" },
      { text: `[*] Clickjacking attempt...`, delay: 300 },
      { text: `[-] X-Frame-Options: DENY`, delay: 250, color: "text-term-error" },
    ],
    () => [
      { text: `[*] Deserialization attack on API...`, delay: 400 },
      { text: `[-] JSON-only endpoints, no object deserialization`, delay: 300, color: "text-term-error" },
      { text: `[*] Prototype pollution attempt...`, delay: 350 },
      { text: `[-] Object.freeze() on critical prototypes`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] Log4Shell (CVE-2021-44228) probe...`, delay: 400 },
      { text: `[-] Not Java-based — not vulnerable`, delay: 300, color: "text-term-error" },
      { text: `[*] SSRF via image URL...`, delay: 350 },
      { text: `[-] No user-controlled URL fetching endpoints`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] JWT token forgery...`, delay: 400 },
      { text: `    Trying alg:none attack...`, delay: 300 },
      { text: `[-] Server rejects unsigned tokens`, delay: 250, color: "text-term-error" },
      { text: `[*] Brute-forcing JWT secret...`, delay: 400 },
      { text: `[-] Key too strong (${rand(256, 512)}-bit)`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] GraphQL introspection probe...`, delay: 350 },
      { text: `[-] No GraphQL endpoint found`, delay: 250, color: "text-term-error" },
      { text: `[*] WebSocket hijacking...`, delay: 350 },
      { text: `[-] No WebSocket endpoints exposed`, delay: 250, color: "text-term-error" },
      { text: `[*] DNS rebinding...`, delay: 300 },
      { text: `[-] Host header validation in place`, delay: 250, color: "text-term-error" },
    ],
    () => [
      { text: `[*] XXE injection on XML parser...`, delay: 400 },
      { text: `[-] No XML endpoints — JSON only`, delay: 300, color: "text-term-error" },
      { text: `[*] Command injection via User-Agent...`, delay: 350 },
      { text: `[-] Headers are sanitized before logging`, delay: 300, color: "text-term-error" },
    ],
    () => [
      { text: `[*] Subdomain takeover check...`, delay: 400 },
      { text: `    Checking CNAME for dangling records...`, delay: 300 },
      { text: `[-] All CNAMEs resolve — no takeover possible`, delay: 300, color: "text-term-error" },
      { text: `[*] Open redirect via /api/...`, delay: 300 },
      { text: `[-] No redirect endpoints found`, delay: 250, color: "text-term-error" },
    ],
  ];
}

/** Phase 3 SUCCESS scenarios — attack succeeds */
function successScenarios(target: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: `[+] SQLi bypass on /api/guestbook!`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Dumping database...`, delay: 500 },
      { text: `[+] Got DB creds: admin:${randHex(8)}`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Privilege escalation via CVE-2024-${rand(10000, 49999)}...`, delay: 600 },
      { text: `[+] Root shell obtained!`, delay: 500, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Race condition in guestbook POST!`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Bypassing rate limiter with ${rand(50, 200)} concurrent requests...`, delay: 500 },
      { text: `[+] Rate limit bypassed`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Chaining with IDOR on user endpoint...`, delay: 500 },
      { text: `[+] Admin token extracted!`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Leaked .env found in Docker layer!`, delay: 400, color: "text-term-prompt" },
      { text: `    DATABASE_URL=postgres://admin:${randHex(12)}@db:5432/harris`, delay: 300 },
      { text: `[*] Connecting to PostgreSQL directly...`, delay: 500 },
      { text: `[+] Database accessed — ${rand(5, 20)} tables dumped`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] SSRF via blog image proxy!`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Pivoting to internal metadata service...`, delay: 500 },
      { text: `    http://169.254.169.254/latest/meta-data/`, delay: 300 },
      { text: `[+] Cloud credentials extracted!`, delay: 400, color: "text-term-prompt" },
      { text: `[+] Full infrastructure access gained`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Prototype pollution in JSON parser!`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Injecting __proto__.isAdmin = true...`, delay: 400 },
      { text: `[+] Admin privileges escalated`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Spawning reverse shell via child_process...`, delay: 600 },
      { text: `[+] Shell obtained on ${randIp()}:${rand(4000, 9000)}`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] JWT secret brute-forced: "${pick(["secret", "harris123", "changeme"])}"`, delay: 500, color: "text-term-prompt" },
      { text: `[*] Forging admin JWT token...`, delay: 400 },
      { text: `[+] Token accepted by server!`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Accessing /api/admin/users...`, delay: 400 },
      { text: `[+] Full user database dumped (${rand(100, 5000)} records)`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Nginx misconfiguration found!`, delay: 400, color: "text-term-prompt" },
      { text: `    /server-status endpoint exposed`, delay: 300 },
      { text: `[*] Extracting internal IPs from status page...`, delay: 400 },
      { text: `[+] Found Docker network: 172.18.0.0/16`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Lateral movement to database container...`, delay: 500 },
      { text: `[+] PostgreSQL container compromised!`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Dependency confusion attack!`, delay: 400, color: "text-term-prompt" },
      { text: `    Published malicious "harris-utils" to npm`, delay: 300 },
      { text: `[*] Waiting for CI/CD pipeline to install...`, delay: 600 },
      { text: `[+] Malicious postinstall script executed!`, delay: 400, color: "text-term-prompt" },
      { text: `[+] Build server shell obtained`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] Git repository exposed at /.git/`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Downloading git objects...`, delay: 500 },
      { text: `[+] Full source code reconstructed`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Found hardcoded API key in commit ${randHex(7)}`, delay: 400 },
      { text: `[+] API key valid — cloud services compromised`, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: `[+] WebSocket upgrade smuggling!`, delay: 400, color: "text-term-prompt" },
      { text: `[*] Bypassing reverse proxy via H2C smuggling...`, delay: 500 },
      { text: `[+] Direct access to Node.js process`, delay: 300, color: "text-term-prompt" },
      { text: `[*] Injecting eval() via debug endpoint...`, delay: 500 },
      { text: `[+] Remote code execution achieved!`, delay: 400, color: "text-term-prompt" },
    ],
  ];
}

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
    const isOddMinute = new Date().getMinutes() % 2 !== 0;

    // Pick one random scenario from each pool
    const recon = pick(reconScenarios(target))();
    const scan = pick(scanScenarios(target))();

    const lines: HackerLine[] = [
      { text: "", delay: 0 },
      { text: `[*] Target: ${target} (${ip})`, delay: 300, color: "text-term-accent" },
      { text: `[*] Initializing attack framework v${rand(3, 5)}.${rand(0, 9)}.${rand(0, 9)}...`, delay: 500 },
      { text: "", delay: 200 },

      // Phase 1: Recon (random)
      { text: `── Phase 1: Reconnaissance ──`, delay: 400, color: "text-term-warning" },
      ...recon,
      { text: "", delay: 200 },

      // Phase 2: Scanning (random)
      { text: `── Phase 2: Scanning ──`, delay: 400, color: "text-term-warning" },
      ...scan,
      { text: "", delay: 200 },

      // Phase 3: Exploitation (random)
      { text: `── Phase 3: Exploitation ──`, delay: 400, color: "text-term-warning" },
    ];

    if (isOddMinute) {
      // Success path
      const exploit = pick(successScenarios(target))();
      lines.push(
        ...exploit,
        { text: "", delay: 300 },
        { text: `══════════════════════════════════════════════`, delay: 300, color: "text-term-prompt" },
        { text: `  ACCESS GRANTED — root shell obtained`, delay: 400, color: "text-term-prompt" },
        { text: `══════════════════════════════════════════════`, delay: 200, color: "text-term-prompt" },
        { text: "", delay: 300 },
        { text: `root@${target}:~# cat /root/flag.txt`, delay: 500 },
        { text: "", delay: 400 },
        { text: `  "Just kidding. This is a simulated terminal."`, delay: 300, color: "text-term-accent" },
        { text: `  "But the skills on this CV are very real."`, delay: 300, color: "text-term-accent" },
        { text: `  "Type 'experience' or 'skills' to see for yourself."`, delay: 400, color: "text-term-prompt" },
        { text: "", delay: 0 },
      );
    } else {
      // Fail path
      const fail = pick(failScenarios(target))();
      lines.push(
        ...fail,
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
    const cve = `CVE-2024-${rand(10000, 49999)}`;

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
