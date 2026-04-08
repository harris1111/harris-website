import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "experience",
  description: "Display work experience",
  usage: "experience [company-slug]",
  execute: (args) => {
    let entries = profile.experience;

    if (args[0]) {
      const query = args[0].toLowerCase();
      entries = entries.filter(
        (e) =>
          e.slug.includes(query) || e.company.toLowerCase().includes(query)
      );
      if (entries.length === 0) {
        return {
          type: "error",
          content: `No experience matching "${args[0]}". Available: ${profile.experience.map((e) => e.slug).join(", ")}`,
        };
      }
    }

    const sections = entries.map((exp, i) => (
      <div key={i} className={i > 0 ? "mt-2" : ""}>
        <div>{c(exp.company, "text-term-accent")} — {c(exp.role, "text-term-prompt")}</div>
        <div>{c(exp.period, "text-term-warning")} | {c(exp.location, "text-term-muted")}</div>
        <div>{""}</div>
        {exp.bullets.map((b, j) => (
          <div key={j}>  {c("•", "text-term-muted")} {b}</div>
        ))}
      </div>
    ));

    return {
      type: "jsx",
      content: <div className="whitespace-pre-wrap font-mono">{sections}</div>,
    };
  },
});
