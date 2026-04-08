import { type HackerLine } from "@/components/hacker-animation";
import { c } from "@/commands/format-helpers";

/* ── random helpers ── */

export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function randIp() {
  return `${rand(10, 223)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
}

export function randMs() {
  return `${(Math.random() * 40 + 1).toFixed(3)} ms`;
}

export function randHex(len: number) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

/* ── port data ── */

export const OPEN_PORTS = [
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

export const CLOSED_PORTS = [21, 23, 25, 53, 110, 139, 445, 993, 995, 3389];

/* ── hack scenario pools (10 each) ── */

/** Phase 1: Recon scenarios */
export function reconScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} Enumerating subdomains...</>, delay: 300 },
      { text: <>    Found: {c(`api.${t}`, "text-term-link")}</>, delay: 200 },
      { text: <>    Found: {c(`admin.${t}`, "text-term-link")}</>, delay: 150 },
      { text: <>    Found: {c(`staging.${t}`, "text-term-warning")}</>, delay: 180 },
      { text: <>{c("[+]", "text-term-accent")} {rand(3, 7)} subdomains discovered</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Running OSINT on {c(t, "text-term-link")}...</>, delay: 400 },
      { text: <>    GitHub repos found: {c(String(rand(5, 25)), "text-term-warning")}</>, delay: 200 },
      { text: <>    Leaked emails: {c(`${rand(1, 4)} addresses`, "text-term-error")}</>, delay: 250 },
      { text: <>    Employee profiles: {c(`${rand(2, 8)}`, "text-term-warning")} on LinkedIn</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} DNS zone transfer attempt...</>, delay: 350 },
      { text: <>    AXFR query to {c(`ns1.${t}`, "text-term-link")}...</>, delay: 300 },
      { text: <>    Got {c(String(rand(12, 45)), "text-term-warning")} DNS records</>, delay: 250 },
      { text: <>    {c("MX", "text-term-prompt")}, {c("A", "text-term-prompt")}, {c("AAAA", "text-term-prompt")}, {c("CNAME", "text-term-prompt")}, {c("TXT", "text-term-prompt")} entries dumped</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Shodan search for {c(t, "text-term-link")}...</>, delay: 400 },
      { text: <>    {c(String(rand(2, 6)), "text-term-warning")} hosts found in {rand(1, 3)} data centers</>, delay: 250 },
      { text: <>    Cloud provider: {c(pick(["AWS", "GCP", "Azure", "DigitalOcean", "Hetzner"]), "text-term-prompt")}</>, delay: 200 },
      { text: <>    SSL cert CN: {c(`*.${t}`, "text-term-link")}</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Wayback Machine crawl...</>, delay: 350 },
      { text: <>    {c(String(rand(50, 500)), "text-term-warning")} snapshots from 2020-2025</>, delay: 250 },
      { text: <>    Found old admin panel at {c("/wp-admin", "text-term-link")} (removed)</>, delay: 200 },
      { text: <>    Found exposed {c(".env", "text-term-error")} in snapshot (rotated)</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Google dorking {c(t, "text-term-link")}...</>, delay: 300 },
      { text: <>    {c("site:", "text-term-prompt")}{t} {c("filetype:pdf", "text-term-prompt")} → {c(String(rand(2, 15)), "text-term-warning")} results</>, delay: 200 },
      { text: <>    {c("site:", "text-term-prompt")}{t} {c("inurl:admin", "text-term-prompt")} → {c(String(rand(0, 3)), "text-term-warning")} results</>, delay: 200 },
      { text: <>    Cached login page found</>, delay: 250 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Certificate Transparency logs...</>, delay: 350 },
      { text: <>    {c(String(rand(8, 30)), "text-term-warning")} certificates issued for {c(`*.${t}`, "text-term-link")}</>, delay: 250 },
      { text: <>    Issuer: {c("Let's Encrypt", "text-term-prompt")}</>, delay: 150 },
      { text: <>    {c("Wildcard cert", "text-term-warning")} detected — broad attack surface</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} theHarvester scan...</>, delay: 300 },
      { text: <>    Emails: {c(`admin@${t}`, "text-term-link")}, {c(`devops@${t}`, "text-term-link")}</>, delay: 200 },
      { text: <>    Hosts: {c(String(rand(3, 8)), "text-term-warning")} unique IPs resolved</>, delay: 200 },
      { text: <>    Virtual hosts: {c(String(rand(2, 5)), "text-term-warning")} on same IP</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Reverse IP lookup on {c(randIp(), "text-term-link")}...</>, delay: 350 },
      { text: <>    {c(String(rand(1, 12)), "text-term-warning")} other domains on same server</>, delay: 250 },
      { text: <>    {c("Shared hosting", "text-term-warning")} detected — lateral movement possible</>, delay: 200 },
      { text: <>    ASN: {c(`AS${rand(10000, 65000)}`, "text-term-muted")} ({c(pick(["Cloudflare", "AWS", "Google", "OVH"]), "text-term-prompt")})</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Fingerprinting web technologies...</>, delay: 300 },
      { text: <>    Framework: {c(pick(["Next.js 16", "React 19", "Nuxt 4", "Remix 3"]), "text-term-prompt")}</>, delay: 200 },
      { text: <>    Server: {c(pick(["nginx/1.24", "Caddy/2.7", "Apache/2.4"]), "text-term-prompt")}</>, delay: 150 },
      { text: <>    CDN: {c(pick(["Cloudflare", "Fastly", "CloudFront", "Vercel Edge"]), "text-term-link")}</>, delay: 150 },
      { text: <>    WAF: {c(pick(["Cloudflare WAF", "AWS WAF", "ModSecurity", "Sucuri"]), "text-term-warning")} detected</>, delay: 200 },
    ],
  ];
}

/** Phase 2: Scanning scenarios */
export function scanScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} SYN scan on {c(String(rand(1000, 65535)), "text-term-warning")} ports...</>, delay: 500 },
      { text: <>    {c("22/tcp", "text-term-link")}   open  {c("ssh", "text-term-prompt")}       OpenSSH 8.9</>, delay: 120 },
      { text: <>    {c("443/tcp", "text-term-link")}  open  {c("https", "text-term-prompt")}     nginx/1.24</>, delay: 120 },
      { text: <>    {c("5432/tcp", "text-term-link")} open  {c("postgresql", "text-term-prompt")} PostgreSQL 16</>, delay: 120 },
      { text: <>{c("[+]", "text-term-accent")} {rand(3, 6)} open ports found</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Nmap aggressive scan ({c("-A", "text-term-warning")})...</>, delay: 600 },
      { text: <>    OS: {c("Linux 6.x", "text-term-prompt")} ({c(`${rand(90, 99)}%`, "text-term-warning")} confidence)</>, delay: 200 },
      { text: <>    Traceroute: {c(String(rand(5, 15)), "text-term-warning")} hops</>, delay: 150 },
      { text: <>    Scripts: {c(String(rand(12, 40)), "text-term-warning")} NSE scripts executed</>, delay: 200 },
      { text: <>    Found HTTP title: {c('"Harris — Terminal CV"', "text-term-accent")}</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Nikto web vulnerability scan...</>, delay: 500 },
      { text: <>    Server: {c("nginx/1.24.0", "text-term-prompt")}</>, delay: 150 },
      { text: <>    X-Frame-Options: {c("SAMEORIGIN ✓", "text-term-accent")}</>, delay: 150 },
      { text: <>    X-Content-Type-Options: {c("nosniff ✓", "text-term-accent")}</>, delay: 150 },
      { text: <>    {c(String(rand(0, 2)), "text-term-warning")} potential findings (low severity)</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Gobuster directory brute-force...</>, delay: 500 },
      { text: <>    {c("/api", "text-term-link")}          (Status: {c("200", "text-term-accent")})</>, delay: 150 },
      { text: <>    {c("/blog", "text-term-link")}         (Status: {c("200", "text-term-accent")})</>, delay: 120 },
      { text: <>    {c("/about", "text-term-link")}        (Status: {c("200", "text-term-accent")})</>, delay: 120 },
      { text: <>    {c("/.env", "text-term-error")}         (Status: {c("403", "text-term-error")}) — blocked</>, delay: 150 },
      { text: <>    {c("/admin", "text-term-muted")}        (Status: {c("404", "text-term-muted")})</>, delay: 120 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} SSL/TLS analysis ({c("testssl.sh", "text-term-prompt")})...</>, delay: 500 },
      { text: <>    TLS 1.3: {c("yes ✓", "text-term-accent")}</>, delay: 150 },
      { text: <>    TLS 1.2: {c("yes", "text-term-accent")} (strong ciphers only) {c("✓", "text-term-accent")}</>, delay: 150 },
      { text: <>    HSTS: {c("enabled", "text-term-accent")} (max-age={c(String(rand(15000000, 31536000)), "text-term-warning")})</>, delay: 150 },
      { text: <>    Certificate: valid for {c(`${rand(30, 90)}`, "text-term-warning")} more days</>, delay: 150 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} WPScan... target is {c("NOT WordPress", "text-term-muted")}</>, delay: 300 },
      { text: <>{c("[+]", "text-term-accent")} Falling back to {c("nuclei", "text-term-prompt")} templates...</>, delay: 400 },
      { text: <>    Running {c(String(rand(3000, 6000)), "text-term-warning")} templates against {c(t, "text-term-link")}</>, delay: 300 },
      { text: <>    {c(String(rand(0, 3)), "text-term-warning")} info-level findings</>, delay: 200 },
      { text: <>    {c("0", "text-term-accent")} critical findings</>, delay: 150 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Masscan UDP scan (top 100 ports)...</>, delay: 500 },
      { text: <>    {c("53/udp", "text-term-link")}    open  {c("DNS", "text-term-prompt")}</>, delay: 120 },
      { text: <>    {c("123/udp", "text-term-link")}   open  {c("NTP", "text-term-prompt")}</>, delay: 120 },
      { text: <>    All other UDP ports: {c("filtered", "text-term-muted")}</>, delay: 200 },
      { text: <>{c("[+]", "text-term-accent")} Firewall is blocking most UDP traffic</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} API endpoint enumeration...</>, delay: 400 },
      { text: <>    {c("GET", "text-term-prompt")}  {c("/api/blog", "text-term-link")}       → {c("200", "text-term-accent")} ({rand(10, 50)} entries)</>, delay: 150 },
      { text: <>    {c("GET", "text-term-prompt")}  {c("/api/guestbook", "text-term-link")}  → {c("200", "text-term-accent")} (rate-limited)</>, delay: 150 },
      { text: <>    {c("POST", "text-term-warning")} {c("/api/guestbook", "text-term-link")}  → {c("429", "text-term-error")} (1 req/hour/IP)</>, delay: 150 },
      { text: <>    {c("GET", "text-term-prompt")}  {c("/api/health", "text-term-link")}     → {c("200", "text-term-accent")} {c('{"status":"ok"}', "text-term-muted")}</>, delay: 150 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Vulnerability scan ({c("OpenVAS", "text-term-prompt")})...</>, delay: 600 },
      { text: <>    Scanning {c(String(rand(1000, 5000)), "text-term-warning")} CVEs against services...</>, delay: 400 },
      { text: <>    High: {c("0", "text-term-accent")}  Medium: {c(String(rand(0, 2)), "text-term-warning")}  Low: {c(String(rand(1, 5)), "text-term-muted")}  Info: {c(String(rand(3, 12)), "text-term-muted")}</>, delay: 250 },
      { text: <>    No exploitable vulnerabilities found</>, delay: 200 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} DNS enumeration ({c("dnsrecon", "text-term-prompt")})...</>, delay: 400 },
      { text: <>    {c("A", "text-term-prompt")}     {c(t, "text-term-link")} → {c(randIp(), "text-term-warning")}</>, delay: 120 },
      { text: <>    {c("AAAA", "text-term-prompt")}  {c(t, "text-term-link")} → {c(`2606:4700::${randHex(4)}`, "text-term-warning")}</>, delay: 120 },
      { text: <>    {c("MX", "text-term-prompt")}    {c(t, "text-term-link")} → {c(`mail.${t}`, "text-term-link")} (pri 10)</>, delay: 120 },
      { text: <>    {c("TXT", "text-term-prompt")}   {c(t, "text-term-link")} → {c('"v=spf1 include:_spf.google.com ~all"', "text-term-muted")}</>, delay: 150 },
      { text: <>{c("[+]", "text-term-accent")} DNSSEC: {c("enabled ✓", "text-term-accent")}</>, delay: 150 },
    ],
  ];
}

/** Phase 3 FAIL scenarios — attack blocked */
export function failScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[*]", "text-term-muted")} SQL injection on {c("/api/guestbook", "text-term-link")}...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} WAF blocked: {c("403 Forbidden", "text-term-error")}</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} XSS on input fields...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} CSP headers block inline scripts</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} SSH brute-force ({c("hydra", "text-term-prompt")})...</>, delay: 500 },
      { text: <>    Trying {c("admin", "text-term-warning")}:{c("admin", "text-term-error")}... {c("FAILED", "text-term-error")}</>, delay: 200 },
      { text: <>    Trying {c("root", "text-term-warning")}:{c("password", "text-term-error")}... {c("FAILED", "text-term-error")}</>, delay: 200 },
      { text: <>{c("[-]", "text-term-error")} Fail2ban: IP banned after {c("3", "text-term-warning")} attempts</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Path traversal on {c("/api/blog", "text-term-link")}...</>, delay: 400 },
      { text: <>    {c("../../etc/passwd", "text-term-warning")} → {c("400 Bad Request", "text-term-error")}</>, delay: 250 },
      { text: <>{c("[-]", "text-term-error")} Input sanitization in place</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Null byte injection...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Blocked by framework</>, delay: 250 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} CSRF token extraction...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} {c("SameSite=Strict", "text-term-prompt")} cookies — no CSRF possible</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Clickjacking attempt...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} {c("X-Frame-Options: DENY", "text-term-prompt")}</>, delay: 250 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Deserialization attack on API...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} JSON-only endpoints, no object deserialization</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Prototype pollution attempt...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} {c("Object.freeze()", "text-term-prompt")} on critical prototypes</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Log4Shell ({c("CVE-2021-44228", "text-term-warning")}) probe...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Not Java-based — not vulnerable</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} SSRF via image URL...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} No user-controlled URL fetching endpoints</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} JWT token forgery...</>, delay: 400 },
      { text: <>    Trying {c("alg:none", "text-term-warning")} attack...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Server rejects unsigned tokens</>, delay: 250 },
      { text: <>{c("[*]", "text-term-muted")} Brute-forcing JWT secret...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Key too strong ({c(`${rand(256, 512)}-bit`, "text-term-warning")})</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} GraphQL introspection probe...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} No GraphQL endpoint found</>, delay: 250 },
      { text: <>{c("[*]", "text-term-muted")} WebSocket hijacking...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} No WebSocket endpoints exposed</>, delay: 250 },
      { text: <>{c("[*]", "text-term-muted")} DNS rebinding...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Host header validation in place</>, delay: 250 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} XXE injection on XML parser...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} No XML endpoints — JSON only</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Command injection via {c("User-Agent", "text-term-prompt")}...</>, delay: 350 },
      { text: <>{c("[-]", "text-term-error")} Headers are sanitized before logging</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Subdomain takeover check...</>, delay: 400 },
      { text: <>    Checking {c("CNAME", "text-term-prompt")} for dangling records...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} All CNAMEs resolve — no takeover possible</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Open redirect via {c("/api/", "text-term-link")}...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} No redirect endpoints found</>, delay: 250 },
    ],
  ];
}

/** Phase 3 SUCCESS scenarios — attack succeeds */
export function successScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} SQLi bypass on {c("/api/guestbook", "text-term-link")}!</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Dumping database...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Got DB creds: {c("admin", "text-term-warning")}:{c(randHex(8), "text-term-error")}</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Privilege escalation via {c(`CVE-2024-${rand(10000, 49999)}`, "text-term-warning")}...</>, delay: 600 },
      { text: <>{c("[+]", "text-term-accent")} Root shell obtained!</>, delay: 500, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Race condition in guestbook {c("POST", "text-term-warning")}!</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Bypassing rate limiter with {c(String(rand(50, 200)), "text-term-warning")} concurrent requests...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Rate limit bypassed</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Chaining with {c("IDOR", "text-term-warning")} on user endpoint...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Admin token extracted!</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Leaked {c(".env", "text-term-error")} found in Docker layer!</>, delay: 400 },
      { text: <>    {c("DATABASE_URL", "text-term-prompt")}={c(`postgres://admin:${randHex(12)}@db:5432/harris`, "text-term-warning")}</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Connecting to PostgreSQL directly...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Database accessed — {c(String(rand(5, 20)), "text-term-warning")} tables dumped</>, delay: 400 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} SSRF via blog image proxy!</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Pivoting to internal metadata service...</>, delay: 500 },
      { text: <>    {c("http://169.254.169.254/latest/meta-data/", "text-term-link")}</>, delay: 300 },
      { text: <>{c("[+]", "text-term-accent")} Cloud credentials extracted!</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Full infrastructure access gained</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Prototype pollution in JSON parser!</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Injecting {c("__proto__.isAdmin = true", "text-term-warning")}...</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Admin privileges escalated</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Spawning reverse shell via {c("child_process", "text-term-prompt")}...</>, delay: 600 },
      { text: <>{c("[+]", "text-term-accent")} Shell obtained on {c(`${randIp()}:${rand(4000, 9000)}`, "text-term-link")}</>, delay: 400 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} JWT secret brute-forced: {c(`"${pick(["secret", "harris123", "changeme"])}"`, "text-term-error")}</>, delay: 500 },
      { text: <>{c("[*]", "text-term-muted")} Forging admin JWT token...</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Token accepted by server!</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Accessing {c("/api/admin/users", "text-term-link")}...</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Full user database dumped ({c(String(rand(100, 5000)), "text-term-warning")} records)</>, delay: 400 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Nginx misconfiguration found!</>, delay: 400 },
      { text: <>    {c("/server-status", "text-term-link")} endpoint exposed</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Extracting internal IPs from status page...</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Found Docker network: {c("172.18.0.0/16", "text-term-warning")}</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Lateral movement to database container...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} PostgreSQL container compromised!</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Dependency confusion attack!</>, delay: 400 },
      { text: <>    Published malicious {c('"harris-utils"', "text-term-error")} to npm</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Waiting for CI/CD pipeline to install...</>, delay: 600 },
      { text: <>{c("[+]", "text-term-accent")} Malicious {c("postinstall", "text-term-warning")} script executed!</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Build server shell obtained</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Git repository exposed at {c("/.git/", "text-term-link")}!</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Downloading git objects...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Full source code reconstructed</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Found hardcoded API key in commit {c(randHex(7), "text-term-warning")}</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} API key valid — cloud services compromised</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} WebSocket upgrade smuggling!</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Bypassing reverse proxy via {c("H2C smuggling", "text-term-warning")}...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Direct access to Node.js process</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Injecting {c("eval()", "text-term-error")} via debug endpoint...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Remote code execution achieved!</>, delay: 400, color: "text-term-prompt" },
    ],
  ];
}
