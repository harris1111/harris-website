import type { Metadata } from "next";
import { profile } from "@/data/profile";
import Link from "next/link";
import { ThemeLoader } from "@/components/theme-loader";

export const metadata: Metadata = {
  title: "About — Nguyen Minh An | DevOps Engineer",
  description: profile.summary,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-term-accent font-bold text-lg mb-2 border-b border-term-border pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-term-bg text-term-fg">
      <ThemeLoader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <pre className="text-term-accent text-xs sm:text-sm leading-tight">{`
 _   _                 _
| | | | __ _ _ __ _ __(_)___
| |_| |/ _\` | '__| '__| / __|
|  _  | (_| | |  | |  | \\__ \\
|_| |_|\\__,_|_|  |_|  |_|___/`}
          </pre>
          <h1 className="text-2xl font-bold text-term-fg mt-4">{profile.name}</h1>
          <p className="text-term-prompt text-lg">{profile.role}</p>
          <p className="text-term-muted">{profile.location}</p>
          <div className="flex gap-4 mt-3 text-sm">
            {profile.social.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-term-link hover:text-term-accent underline"
              >
                {s.platform}
              </a>
            ))}
          </div>
        </header>

        {/* Summary */}
        <Section title="$ cat about.txt">
          <p className="leading-relaxed">{profile.summary}</p>
          <p className="text-term-muted mt-2 italic">&quot;{profile.motto}&quot;</p>
        </Section>

        {/* Skills */}
        <Section title="$ skills">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {profile.skills.map((s) => (
                  <tr key={s.category} className="border-b border-term-border/30">
                    <td className="text-term-warning py-1 pr-4 whitespace-nowrap font-bold align-top">
                      {s.category}
                    </td>
                    <td className="py-1">{s.technologies.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm">
            {profile.languages.map((l) => (
              <span key={l.name} className="mr-6">
                <span className="text-term-warning">{l.name}:</span> {l.score}
              </span>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section title="$ experience">
          {profile.experience.map((exp) => (
            <div key={exp.slug} className="mb-6">
              <h3 className="text-term-prompt font-bold">
                {exp.company} — {exp.role}
              </h3>
              <p className="text-term-muted text-sm mb-2">
                {exp.period} | {exp.location}
              </p>
              <ul className="space-y-1">
                {exp.bullets.map((b, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <span className="text-term-muted mr-1">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        {/* Education */}
        <Section title="$ education">
          <p className="font-bold">{profile.education.institution}</p>
          <p>{profile.education.degree}</p>
          <p className="text-term-muted text-sm">
            {profile.education.period} | GPA: {profile.education.gpa}
          </p>
        </Section>

        {/* Certifications */}
        <Section title="$ certifications">
          <ul>
            {profile.certifications.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="text-term-muted mr-1">•</span> {c}
              </li>
            ))}
          </ul>
        </Section>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-term-border flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-term-link hover:text-term-accent">
            ← Terminal
          </Link>
          <Link href="/blog" className="text-term-link hover:text-term-accent">
            Blog →
          </Link>
          <a
            href={profile.social.find((s) => s.platform === "LinkedIn")?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-term-link hover:text-term-accent"
          >
            LinkedIn ↗
          </a>
          <a
            href="/cv/Nguyen-Minh-An-DevOps-Engineer-CV.pdf"
            download
            className="text-term-link hover:text-term-accent"
          >
            Download CV ↓
          </a>
        </footer>
      </div>
    </main>
  );
}
