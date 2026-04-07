import { register } from "./registry";
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

    const sections = entries.map((exp) => {
      const bullets = exp.bullets.map((b) => `  • ${b}`).join("\n");
      return [
        `${exp.company} — ${exp.role}`,
        `${exp.period} | ${exp.location}`,
        "",
        bullets,
      ].join("\n");
    });

    return { type: "text", content: sections.join("\n\n") };
  },
});
