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

/* ── Site-specific scenarios (only for own domain) ── */

/** Recon scenarios exclusive to the site -- references real tech stack */
export function siteReconScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} Pulling Docker image manifest from {c(`ghcr.io/harris1111`, "text-term-link")}...</>, delay: 400 },
      { text: <>    Layer 1: {c("node:22-alpine", "text-term-prompt")} base image -- known CVEs in libcrypto</>, delay: 250 },
      { text: <>    Layer 2: {c("npm ci --omit=dev", "text-term-muted")} -- production deps only</>, delay: 200 },
      { text: <>    Layer 3: {c(".next/standalone/", "text-term-link")} -- Next.js 16 standalone output detected</>, delay: 200 },
      { text: <>    Layer 4: {c("prisma generate", "text-term-warning")} -- Prisma 7 ORM with PostgreSQL adapter</>, delay: 200 },
      { text: <>    Env leaked in layer: {c("DATABASE_URL=postgresql://...:5432/harris_cv", "text-term-error")}</>, delay: 300 },
      { text: <>{c("[+]", "text-term-accent")} Full stack fingerprinted: Next.js 16 + Prisma 7 + PostgreSQL 16</>, delay: 250 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Analyzing GitHub Actions workflow {c(".github/workflows/deploy.yml", "text-term-link")}...</>, delay: 400 },
      { text: <>    Trigger: {c("push to master", "text-term-prompt")} -- no branch protection detected</>, delay: 250 },
      { text: <>    Step 1: {c("eslint", "text-term-muted")} lint check (can be bypassed with --no-verify)</>, delay: 200 },
      { text: <>    Step 2: {c("next build", "text-term-prompt")} -- build output pushed to {c("ghcr.io", "text-term-link")}</>, delay: 200 },
      { text: <>    Step 3: {c("docker compose up -d", "text-term-warning")} via SSH to VPS</>, delay: 200 },
      { text: <>    Secrets referenced: {c("POSTGRES_PASSWORD", "text-term-error")}, {c("GHCR_TOKEN", "text-term-error")}, {c("VPS_SSH_KEY", "text-term-error")}</>, delay: 300 },
      { text: <>{c("[+]", "text-term-accent")} CI/CD pipeline fully mapped -- 3 secret extraction vectors</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Extracting Prisma schema from {c("prisma/schema.prisma", "text-term-link")}...</>, delay: 400 },
      { text: <>    datasource: {c("postgresql", "text-term-prompt")} via {c("@prisma/adapter-pg", "text-term-link")}</>, delay: 200 },
      { text: <>    model {c("GuestbookEntry", "text-term-prompt")} {"{"} id Int, name String, message String, createdAt DateTime {"}"}</>, delay: 250 },
      { text: <>    No {c("@unique", "text-term-warning")} constraints on name/message -- duplicate injection possible</>, delay: 200 },
      { text: <>    Rate limiter: {c("in-memory Map<string, number>", "text-term-warning")} -- resets on container restart</>, delay: 250 },
      { text: <>    IP source: {c("x-forwarded-for", "text-term-error")} header -- spoofable behind reverse proxy</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} Database schema reconstructed + rate limiter bypass identified</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Reverse-engineering Nginx config from response headers...</>, delay: 400 },
      { text: <>    {c("Server:", "text-term-prompt")} nginx/1.24 -- proxy_pass to {c("localhost:3000", "text-term-link")}</>, delay: 200 },
      { text: <>    {c("X-Frame-Options:", "text-term-prompt")} DENY -- clickjacking blocked</>, delay: 200 },
      { text: <>    {c("Strict-Transport-Security:", "text-term-prompt")} max-age=31536000 -- HSTS enabled</>, delay: 200 },
      { text: <>    SSL cert: {c("Let's Encrypt", "text-term-link")} -- auto-renewed via certbot cron</>, delay: 200 },
      { text: <>    Static assets cached {c("1 year immutable", "text-term-warning")} -- but HTML only {c("1 hour", "text-term-muted")}</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} Full Nginx topology mapped -- cache poisoning vector viable</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Deep git history analysis on {c("harris1111/harris-website", "text-term-link")}...</>, delay: 400 },
      { text: <>    Total commits: {c(String(rand(80, 200)), "text-term-warning")} -- single author: {c("harris1111", "text-term-prompt")}</>, delay: 200 },
      { text: <>    {c("51b770c", "text-term-warning")} content: rewrite 10 blog posts with technical narratives</>, delay: 200 },
      { text: <>    {c("a577935", "text-term-warning")} feat: blog TOC and theme support for all pages</>, delay: 200 },
      { text: <>    {c("8055d67", "text-term-warning")} fix: server-side markdown rendering for blog posts</>, delay: 200 },
      { text: <>    Commit signing: {c("DISABLED", "text-term-error")} -- impersonation trivial via git config</>, delay: 250 },
      { text: <>    Found {c(".env.example", "text-term-error")} committed -- reveals DATABASE_URL format</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} 2 high-value vectors: commit impersonation + env template leak</>, delay: 300 },
    ],
  ];
}

/** Scan scenarios exclusive to the site */
export function siteScanScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} Fuzzing Next.js 16 API routes with custom payloads...</>, delay: 500 },
      { text: <>    {c("GET", "text-term-prompt")}  {c("/api/blog", "text-term-link")}       200 -- returns all posts as JSON array</>, delay: 200 },
      { text: <>    {c("GET", "text-term-prompt")}  {c("/api/health", "text-term-link")}     200 -- {c('{"status":"ok"}', "text-term-muted")} exposes uptime</>, delay: 200 },
      { text: <>    {c("POST", "text-term-warning")} {c("/api/guestbook", "text-term-link")} 200 -- accepts name + message, no authentication</>, delay: 200 },
      { text: <>    Rate limit: {c("1 request/hour/IP", "text-term-error")} via {c("x-forwarded-for", "text-term-prompt")} header</>, delay: 200 },
      { text: <>    Header origin: Nginx {c("proxy_set_header", "text-term-warning")} -- spoofable from client</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} Unauthenticated write endpoint + spoofable rate limiter confirmed</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Inspecting Docker container configuration...</>, delay: 500 },
      { text: <>    Image: {c("harris-website:latest", "text-term-prompt")} running as user {c("nextjs", "text-term-link")} (uid 1001)</>, delay: 200 },
      { text: <>    PID namespace: {c("isolated", "text-term-accent")} -- cannot see host processes</>, delay: 200 },
      { text: <>    Network: {c("docker-bridge", "text-term-warning")} -- shared with {c("postgres", "text-term-error")} container</>, delay: 200 },
      { text: <>    Volume mounts: {c("/app/.next", "text-term-link")} (ro), {c("/app/content/blog", "text-term-link")} (ro)</>, delay: 200 },
      { text: <>    DNS: resolves {c("postgres", "text-term-error")} to {c("172.18.0.2", "text-term-warning")} inside bridge network</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} Container can reach PostgreSQL directly -- no network segmentation</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Testing guestbook input sanitization pipeline...</>, delay: 500 },
      { text: <>    Profanity filter: {c("word-list regex", "text-term-prompt")} -- {c("case-sensitive only", "text-term-warning")}</>, delay: 200 },
      { text: <>    HTML sanitizer: strips {"<script>"} tags but allows {c("data attributes", "text-term-warning")}</>, delay: 250 },
      { text: <>    Test 1: {c("Cyrillic homoglyphs", "text-term-error")} (e.g. a -&gt; a) -- {c("BYPASSED", "text-term-error")} filter</>, delay: 250 },
      { text: <>    Test 2: {c("Zero-width joiners", "text-term-error")} between chars -- {c("BYPASSED", "text-term-error")} filter</>, delay: 250 },
      { text: <>    Test 3: {c("HTML entity encoding", "text-term-error")} -- partially {c("BYPASSED", "text-term-error")}</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} 3 filter bypass methods confirmed -- stored XSS potential</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Analyzing server-side markdown rendering pipeline...</>, delay: 500 },
      { text: <>    Parser: {c("remark-parse", "text-term-prompt")} + {c("remark-gfm", "text-term-prompt")} + {c("remark-html", "text-term-prompt")}</>, delay: 200 },
      { text: <>    Syntax highlighter: {c("shiki 4.x", "text-term-warning")} -- processes code blocks server-side</>, delay: 200 },
      { text: <>    Language param passed directly to shiki without validation</>, delay: 250 },
      { text: <>    Crafted lang string {c('```aaaaa(a+)+$```', "text-term-error")} triggers exponential backtracking</>, delay: 250 },
      { text: <>    Blog content loaded via {c("fs.readFileSync", "text-term-warning")} -- no path traversal guard</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} ReDoS + potential path traversal in blog content loader</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Full VPS port scan + service enumeration...</>, delay: 500 },
      { text: <>    {c("22/tcp", "text-term-link")}    open   {c("OpenSSH 8.9p1", "text-term-prompt")} -- password auth {c("enabled", "text-term-error")}</>, delay: 200 },
      { text: <>    {c("80/tcp", "text-term-link")}    open   {c("nginx/1.24", "text-term-prompt")} -- redirect to 443</>, delay: 200 },
      { text: <>    {c("443/tcp", "text-term-link")}   open   {c("nginx/1.24", "text-term-prompt")} -- TLS 1.3 + HSTS</>, delay: 200 },
      { text: <>    {c("5432/tcp", "text-term-link")}  filtered -- PostgreSQL bound to {c("172.18.0.0/16", "text-term-warning")} only</>, delay: 200 },
      { text: <>    Backup cron: {c("pg_dump", "text-term-prompt")} to {c("/var/backups/harris_cv.sql.gz", "text-term-link")}</>, delay: 250 },
      { text: <>    Backup permissions: {c("-rw-r--r--", "text-term-error")} -- {c("world-readable", "text-term-error")} if path guessed</>, delay: 250 },
      { text: <>{c("[+]", "text-term-accent")} SSH password auth + world-readable DB backups -- 2 critical findings</>, delay: 300 },
    ],
  ];
}

/** Exploit success scenarios exclusive to the site -- very aggressive */
export function siteSuccessScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[+]", "text-term-accent")} Chaining X-Forwarded-For spoof + guestbook SQLi...</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 1: Rotating source IPs to evade rate limiter...</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Rate limiter bypassed -- {c("429", "text-term-error")} no longer triggered</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Step 2: Injecting {c("'; DROP TABLE \"GuestbookEntry\";--", "text-term-error")} via message field</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Prisma raw query executed -- table dropped</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Step 3: Pivoting to extract DATABASE_URL from Next.js process env...</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Full PostgreSQL access -- all tables dumped to attacker server</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Exploiting Docker bridge network for container escape...</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 1: Reaching postgres container at {c("172.18.0.2:5432", "text-term-link")} from app container</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Connected -- default {c("pg", "text-term-prompt")} credentials from DATABASE_URL</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Step 2: Using {c("COPY TO PROGRAM", "text-term-error")} for command execution on DB host</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Reverse shell spawned from PostgreSQL container</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Step 3: Docker socket found at {c("/var/run/docker.sock", "text-term-error")} -- mounting host root</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} VPS root filesystem mounted -- full host compromise achieved</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} GitHub Actions supply chain attack initiated...</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 1: Forking repo and modifying {c("deploy.yml", "text-term-link")} to exfiltrate secrets</>, delay: 500 },
      { text: <>{c("[*]", "text-term-muted")} Step 2: Submitting PR with {c("workflow_run", "text-term-warning")} trigger to bypass approval</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} CI runner executed malicious step -- secrets dumped to webhook</>, delay: 400 },
      { text: <>    {c("GHCR_TOKEN", "text-term-error")}=ghp_{c(randHex(36), "text-term-muted")}</>, delay: 200 },
      { text: <>    {c("VPS_SSH_KEY", "text-term-error")}=-----BEGIN OPENSSH PRIVATE KEY-----...</>, delay: 200 },
      { text: <>{c("[*]", "text-term-muted")} Step 3: SSHing to VPS with stolen key + pushing backdoored image</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Supply chain fully compromised -- persistent backdoor deployed</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Prisma adapter-pg raw query exploitation...</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 1: Crafting malicious guestbook entry with nested SQL in name field</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Prisma {c("$queryRaw", "text-term-error")} accepted unsanitized template literal</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 2: Extracting pg_shadow via UNION injection</>, delay: 500 },
      { text: <>    {c("admin", "text-term-warning")}:{c("md5" + randHex(32), "text-term-error")}</>, delay: 200 },
      { text: <>{c("[*]", "text-term-muted")} Step 3: Connecting directly with extracted credentials</>, delay: 400 },
      { text: <>{c("[+]", "text-term-accent")} Database superuser access -- creating reverse shell via pg_execute</>, delay: 400, color: "text-term-prompt" },
    ],
    () => [
      { text: <>{c("[+]", "text-term-accent")} Nginx cache poisoning + SSRF chain attack...</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 1: Sending request with {c("Host: evil.attacker.com", "text-term-error")} header</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Nginx cached response with poisoned Host -- all visitors redirected</>, delay: 400 },
      { text: <>{c("[*]", "text-term-muted")} Step 2: Chaining with internal SSRF to {c("http://172.18.0.2:5432", "text-term-link")}</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} PostgreSQL protocol smuggling via HTTP succeeded</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Step 3: Pivoting through DB to backup server at {c("/var/backups/", "text-term-link")}</>, delay: 500 },
      { text: <>{c("[+]", "text-term-accent")} Exfiltrated {c("harris_cv.sql.gz", "text-term-error")} -- full database + credentials</>, delay: 400, color: "text-term-prompt" },
    ],
  ];
}

/** Fail scenarios exclusive to the site */
export function siteFailScenarios(t: string): (() => HackerLine[])[] {
  return [
    () => [
      { text: <>{c("[*]", "text-term-muted")} Attempting SQL injection on {c("/api/guestbook", "text-term-link")} POST endpoint...</>, delay: 400 },
      { text: <>    Payload 1: {c("'; DROP TABLE \"GuestbookEntry\";--", "text-term-error")}</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Prisma parameterized queries -- injection string treated as literal text</>, delay: 300 },
      { text: <>    Payload 2: {c("UNION SELECT * FROM pg_shadow--", "text-term-error")}</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} No raw SQL execution path in Prisma ORM layer</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying {c("/api/blog?slug=../../etc/passwd", "text-term-error")}...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Blog loader uses hardcoded {c("content/blog/", "text-term-prompt")} prefix -- path traversal blocked</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Docker container escape attempt on {c("harris-website", "text-term-prompt")}...</>, delay: 400 },
      { text: <>    Process running as {c("nextjs:1001", "text-term-prompt")} -- non-root, no sudo binary</>, delay: 250 },
      { text: <>{c("[-]", "text-term-error")} No {c("--privileged", "text-term-warning")} flag -- {c("CAP_SYS_ADMIN", "text-term-error")} not granted</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Checking for {c("CVE-2024-21626", "text-term-warning")} (runc WORKDIR escape)...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} runc version {c("1.1.12", "text-term-accent")} -- vulnerability patched in this build</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying {c("/proc/self/cgroup", "text-term-link")} pivot...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} cgroup v2 with restricted device access -- all escape routes sealed</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} GitHub Actions workflow poisoning via fork PR...</>, delay: 400 },
      { text: <>    Creating fork with modified {c("deploy.yml", "text-term-link")} -- injecting secret dump step</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Workflow requires {c("maintainer approval", "text-term-accent")} for first-time contributors</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying {c("GITHUB_TOKEN", "text-term-error")} permission escalation on fork...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Fork tokens scoped to {c("read-only", "text-term-accent")} -- cannot write to parent repo</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Attempting {c("workflow_dispatch", "text-term-warning")} trigger from fork...</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Dispatch events only accepted from same-repo -- fork rejected</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Bypassing rate limiter via X-Forwarded-For spoofing...</>, delay: 400 },
      { text: <>    Injecting {c("X-Forwarded-For: 1.2.3.4", "text-term-warning")} header in POST request</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Nginx {c("real_ip_module", "text-term-prompt")} configured -- strips client-supplied XFF</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying {c("X-Real-IP", "text-term-warning")} and {c("CF-Connecting-IP", "text-term-warning")} headers...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Nginx only trusts its own {c("set_real_ip_from", "text-term-prompt")} whitelist</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying TCP-level IP rotation via proxy chain...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Rate: 1 req/hour/IP still enforced -- need {c("3,600+", "text-term-warning")} unique IPs for flood</>, delay: 300 },
    ],
    () => [
      { text: <>{c("[*]", "text-term-muted")} Direct attack on PostgreSQL service at {c("5432/tcp", "text-term-link")}...</>, delay: 400 },
      { text: <>    Port scan: {c("filtered", "text-term-muted")} -- bound to {c("172.18.0.0/16", "text-term-warning")} (Docker bridge only)</>, delay: 300 },
      { text: <>{c("[-]", "text-term-error")} Not reachable from public internet -- Docker network isolation</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Attempting DNS rebinding to {c("172.18.0.2", "text-term-warning")} via crafted domain...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} {c("pg_hba.conf", "text-term-prompt")} set to {c("local", "text-term-accent")} + {c("172.18.0.0/16", "text-term-accent")} only</>, delay: 300 },
      { text: <>{c("[*]", "text-term-muted")} Trying to reach backup file at {c("/var/backups/harris_cv.sql.gz", "text-term-link")}...</>, delay: 400 },
      { text: <>{c("[-]", "text-term-error")} Nginx {c("location /var", "text-term-prompt")} not configured -- 404 on all guessed paths</>, delay: 300 },
    ],
  ];
}
