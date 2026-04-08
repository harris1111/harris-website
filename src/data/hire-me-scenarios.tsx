import { type HackerLine } from "@/components/hacker-animation";
import { c } from "@/commands/format-helpers";
import { profile } from "./profile";
import { randHex, rand } from "./hacker-scenarios";
import { SITE_URL } from "@/lib/site-config";

function bar(pct: number, label: string): HackerLine {
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const color = pct === 100 ? "text-term-accent" : "text-term-muted";
  return { text: <>    {c(`[${"#".repeat(filled)}${".".repeat(empty)}] ${pct}%`, color)} {label}</>, delay: pct === 100 ? 300 : 400 };
}

/** Contact info lines shared across all scenarios */
function contactLines(): HackerLine[] {
  const linkedin = profile.social.find(s => s.platform === "LinkedIn");
  const github = profile.social.find(s => s.platform === "GitHub");
  const lines: HackerLine[] = [
    { text: <>{c("  -- Secure Communication Channels --", "text-term-warning")}</>, delay: 300 },
    { text: "", delay: 100 },
    { text: <>  {c("Email:", "text-term-warning")}     {c(profile.email, "text-term-link")}</>, delay: 150 },
    { text: <>  {c("Phone:", "text-term-warning")}     {c(profile.phone, "text-term-link")}</>, delay: 150 },
  ];
  if (linkedin) lines.push({ text: <>  {c("LinkedIn:", "text-term-warning")}  {c(linkedin.url, "text-term-link")}</>, delay: 150 });
  if (github) lines.push({ text: <>  {c("GitHub:", "text-term-warning")}    {c(github.url, "text-term-link")}</>, delay: 150 });
  lines.push({ text: <>  {c("Web:", "text-term-warning")}       {c(SITE_URL, "text-term-link")}</>, delay: 150 });
  return lines;
}

/** ASCII art banner shared across scenarios */
const HIRE_BANNER: HackerLine[] = [
  { text: <>{c("  _  _ ___ ___ ___   __  __ ___", "text-term-prompt")}</>, delay: 80 },
  { text: <>{c(" | || |_ _| _ \\ __| |  \\/  | __|", "text-term-prompt")}</>, delay: 80 },
  { text: <>{c(" | __ || ||   / _|  | |\\/| | _|", "text-term-prompt")}</>, delay: 80 },
  { text: <>{c(" |_||_|___|_|_\\___| |_|  |_|___|", "text-term-prompt")}</>, delay: 80 },
];

/** 5 different hire-me scenarios — all end with contact info + theme unlock */
export function getHireMeScenario(): HackerLine[] {
  const scenarios = [
    // Scenario 1: Classic root shell escalation
    () => {
      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} verifying credentials...</>, delay: 400 },
        { text: <>{c("[sudo]", "text-term-warning")} password for {c("recruiter", "text-term-prompt")}: {c("************", "text-term-muted")}</>, delay: 600 },
        { text: <>{c("[sudo]", "text-term-accent")} authentication successful</>, delay: 500 },
        { text: "", delay: 300 },
        { text: <>{c("[*]", "text-term-accent")} Escalating to root...</>, delay: 400 },
        bar(15, "Checking sudoers file"),
        bar(40, "Spawning privileged shell"),
        bar(75, "Loading root environment"),
        bar(100, "Root access granted"),
        { text: "", delay: 300 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("cat /etc/shadow | head -1", "text-term-warning")}</>, delay: 500 },
        { text: <>{c(`root:$6$${randHex(16)}:19741:0:99999:7:::`, "text-term-muted")}</>, delay: 300 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("cat /root/classified/candidate.txt", "text-term-warning")}</>, delay: 600 },
        { text: "", delay: 400 },
        ...HIRE_BANNER,
        { text: "", delay: 200 },
        { text: <>  {c("ACCESS LEVEL:", "text-term-warning")} {c("MAXIMUM", "text-term-error")}</>, delay: 200 },
        { text: <>  {c("STATUS:", "text-term-warning")}       {c("AVAILABLE FOR HIRE", "text-term-accent")}</>, delay: 200 },
        { text: <>  {c("THREAT:", "text-term-warning")}       {c("WILL IMPROVE YOUR INFRA", "text-term-prompt")}</>, delay: 200 },
        { text: "", delay: 300 },
        ...contactLines(),
        { text: "", delay: 300 },
        { text: <>  {c("K8s clusters", "text-term-link")} that auto-heal. {c("CI/CD pipelines", "text-term-link")} that never break.</>, delay: 200 },
        { text: <>  {c("99.95%", "text-term-accent")} uptime. {c("10M req/day", "text-term-accent")}. Zero excuses.</>, delay: 200 },
        { text: "", delay: 400 },
        { text: <>  {c("GG WP. Now go send that email.", "text-term-accent")}</>, delay: 500 },
      ];
      return lines;
    },

    // Scenario 2: Database exfiltration reveals candidate profile
    () => {
      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} bypassing authentication layer...</>, delay: 400 },
        bar(20, "Cracking password hash"),
        bar(55, "Brute-forcing with rockyou.txt"),
        bar(85, "Hash cracked: recruiter:***"),
        bar(100, "Session elevated to root"),
        { text: "", delay: 300 },
        { text: <>{c("[+]", "text-term-accent")} Root shell obtained. Dumping classified database...</>, delay: 500 },
        { text: "", delay: 200 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("psql -U admin -d classified", "text-term-warning")}</>, delay: 500 },
        { text: <>classified=# {c("SELECT * FROM top_candidates ORDER BY skill_level DESC LIMIT 1;", "text-term-warning")}</>, delay: 600 },
        { text: "", delay: 300 },
        { text: <> {c("name", "text-term-accent")}            | {c("role", "text-term-accent")}             | {c("clearance", "text-term-accent")}  | {c("status", "text-term-accent")}</>, delay: 150 },
        { text: ` -----------------+------------------+------------+-----------`, delay: 100, color: "text-term-muted" },
        { text: <> {c(profile.name, "text-term-prompt")}  | {c(profile.role, "text-term-link")} | {c("LEVEL 5", "text-term-error")}    | {c("AVAILABLE", "text-term-accent")}</>, delay: 200 },
        { text: <>(1 row)</>, delay: 100, color: "text-term-muted" },
        { text: "", delay: 400 },
        ...HIRE_BANNER,
        { text: "", delay: 200 },
        ...contactLines(),
        { text: "", delay: 300 },
        { text: <>  {c('"I architect infrastructure like I solve CTFs', "text-term-muted")}</>, delay: 200 },
        { text: <>  {c(' -- methodically, relentlessly, and with style."', "text-term-muted")}</>, delay: 200 },
        { text: "", delay: 400 },
        { text: <>  {c("You found me. That means you're good at what you do too.", "text-term-accent")}</>, delay: 400 },
      ];
      return lines;
    },

    // Scenario 3: Binary reverse engineering reveals secret
    () => {
      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} injecting shellcode into kernel module...</>, delay: 500 },
        bar(10, "Compiling exploit payload"),
        bar(35, "Bypassing ASLR + NX"),
        bar(60, "Shellcode injected into PID 1"),
        bar(90, "Privilege escalation in progress"),
        bar(100, "Kernel ring 0 access achieved"),
        { text: "", delay: 300 },
        { text: <>{c("[+]", "text-term-accent")} Root obtained via kernel exploit. Extracting secrets...</>, delay: 500 },
        { text: "", delay: 200 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("strings /usr/sbin/hire-me | grep -i flag", "text-term-warning")}</>, delay: 500 },
        { text: <>{c("FLAG{y0u_f0und_th3_b3st_d3v0ps_3ng1n33r}", "text-term-accent")}</>, delay: 400 },
        { text: "", delay: 200 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("./hire-me --decode-flag", "text-term-warning")}</>, delay: 500 },
        { text: "", delay: 400 },
        ...HIRE_BANNER,
        { text: "", delay: 200 },
        { text: <>  {c("FLAG DECODED:", "text-term-warning")} {c(profile.name, "text-term-prompt")} -- {c(profile.role, "text-term-link")}</>, delay: 300 },
        { text: <>  {c("LOCATION:", "text-term-warning")}     {c(profile.location, "text-term-muted")}</>, delay: 200 },
        { text: <>  {c("CLEARANCE:", "text-term-warning")}    {c("TOP SECRET // SCI", "text-term-error")}</>, delay: 200 },
        { text: "", delay: 300 },
        ...contactLines(),
        { text: "", delay: 400 },
        { text: <>  {c("The flag was the engineer all along.", "text-term-accent")}</>, delay: 500 },
      ];
      return lines;
    },

    // Scenario 4: Memory forensics reveal hidden process
    () => {
      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} attaching debugger to PID 1...</>, delay: 400 },
        bar(20, "Reading /proc/1/maps"),
        bar(50, "Dumping process memory"),
        bar(80, "Analyzing heap for credentials"),
        bar(100, "Memory extraction complete"),
        { text: "", delay: 300 },
        { text: <>{c("[+]", "text-term-accent")} Found encrypted blob in kernel memory at {c(`0x${randHex(12)}`, "text-term-warning")}</>, delay: 500 },
        { text: <>{c("[*]", "text-term-muted")} Decrypting with extracted AES key...</>, delay: 600 },
        bar(30, "Key schedule expansion"),
        bar(65, "AES-256-GCM decryption"),
        bar(100, "Decrypted successfully"),
        { text: "", delay: 300 },
        { text: <>{c("[+]", "text-term-accent")} Hidden process revealed: {c("/usr/local/bin/hire-harris", "text-term-link")}</>, delay: 400 },
        { text: <>{c("root@harris-cv", "text-term-error")}:~# {c("/usr/local/bin/hire-harris --execute", "text-term-warning")}</>, delay: 500 },
        { text: "", delay: 400 },
        ...HIRE_BANNER,
        { text: "", delay: 200 },
        { text: <>  {c("PROCESS:", "text-term-warning")}    hire-harris (PID {c(String(rand(1337, 9999)), "text-term-muted")})</>, delay: 200 },
        { text: <>  {c("PRIORITY:", "text-term-warning")}   {c("REAL-TIME (RT)", "text-term-error")} -- cannot be killed</>, delay: 200 },
        { text: <>  {c("UPTIME:", "text-term-warning")}     {c("2.5+ years", "text-term-accent")} and counting</>, delay: 200 },
        { text: "", delay: 300 },
        ...contactLines(),
        { text: "", delay: 400 },
        { text: <>  {c("Some processes are too important to stop.", "text-term-accent")}</>, delay: 500 },
      ];
      return lines;
    },

    // Scenario 5: Blockchain-style proof of work
    () => {
      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} initiating proof-of-work challenge...</>, delay: 400 },
        { text: <>{c("[*]", "text-term-muted")} Mining block to prove you're serious about hiring...</>, delay: 500 },
        bar(5, `Nonce: ${rand(100000, 999999)} -- no match`),
        bar(25, `Nonce: ${rand(100000, 999999)} -- no match`),
        bar(50, `Nonce: ${rand(100000, 999999)} -- partial match`),
        bar(75, `Nonce: ${rand(100000, 999999)} -- getting close`),
        bar(100, `Nonce: ${rand(100000, 999999)} -- BLOCK MINED`),
        { text: "", delay: 300 },
        { text: <>{c("[+]", "text-term-accent")} Block validated. Transaction recorded on chain.</>, delay: 400 },
        { text: "", delay: 200 },
        { text: <>  {c("TX:", "text-term-warning")}     {c(`0x${randHex(64)}`, "text-term-muted")}</>, delay: 200 },
        { text: <>  {c("FROM:", "text-term-warning")}   {c("recruiter.eth", "text-term-link")}</>, delay: 150 },
        { text: <>  {c("TO:", "text-term-warning")}     {c("harris.eth", "text-term-link")}</>, delay: 150 },
        { text: <>  {c("DATA:", "text-term-warning")}   {c('"HIRE_ME_CONFIRMED"', "text-term-accent")}</>, delay: 200 },
        { text: "", delay: 400 },
        ...HIRE_BANNER,
        { text: "", delay: 200 },
        ...contactLines(),
        { text: "", delay: 300 },
        { text: <>  {c("Smart contracts are immutable.", "text-term-muted")}</>, delay: 200 },
        { text: <>  {c("So is my commitment to your infrastructure.", "text-term-accent")}</>, delay: 300 },
        { text: "", delay: 400 },
        { text: <>  {c("The blockchain doesn't lie. Hire me.", "text-term-accent")}</>, delay: 500 },
      ];
      return lines;
    },
  ];

  // Pick a random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const lines = scenario();

  // Add theme unlock at the end
  lines.push(
    { text: "", delay: 500 },
    { text: <>{c("[+]", "text-term-accent")} Achievement unlocked: {c("HACKER THEME", "text-term-error")}</>, delay: 400 },
    { text: <>    Run {c("'theme hacker'", "text-term-warning")} to activate your reward.</>, delay: 300 },
    { text: "", delay: 0 },
  );

  return lines;
}
