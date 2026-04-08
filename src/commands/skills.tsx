import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "skills",
  description: "Display technical skills",
  usage: "skills [category]",
  execute: (args) => {
    let skills = profile.skills;

    if (args[0]) {
      const query = args[0].toLowerCase();
      skills = skills.filter((s) =>
        s.category.toLowerCase().includes(query)
      );
      if (skills.length === 0) {
        return {
          type: "error",
          content: `No skill category matching "${args[0]}". Try: ${profile.skills.map((s) => s.category).join(", ")}`,
        };
      }
    }

    const maxCat = Math.max(...skills.map((s) => s.category.length));

    const header = (
      <div>
        {"  "}{c("Category".padEnd(maxCat + 2), "text-term-accent")} {c("Technologies", "text-term-accent")}
      </div>
    );
    const separator = (
      <div className="text-term-muted">
        {"  "}{"─".repeat(maxCat + 2)} {"─".repeat(50)}
      </div>
    );

    const rows = skills.map((s, i) => (
      <div key={i}>
        {"  "}{c(s.category.padEnd(maxCat + 2), "text-term-warning")} {s.technologies.map((t, j) => (
          <span key={j}>{j > 0 ? ", " : ""}{c(t, "text-term-link")}</span>
        ))}
      </div>
    ));

    const langRows = !args[0] ? [
      <div key="lang-sep">{""}</div>,
      ...profile.languages.map((l, i) => (
        <div key={`lang-${i}`}>
          {"  "}{c(l.name.padEnd(maxCat + 2), "text-term-warning")} {c(l.score, "text-term-prompt")}
        </div>
      )),
    ] : [];

    return {
      type: "jsx",
      content: (
        <div className="whitespace-pre-wrap font-mono">
          {header}
          {separator}
          {rows}
          {langRows}
        </div>
      ),
    };
  },
});
