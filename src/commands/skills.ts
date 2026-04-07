import { register } from "./registry";
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
    const lines = skills.map(
      (s) =>
        `  ${s.category.padEnd(maxCat + 2)} ${s.technologies.join(", ")}`
    );

    const header = `  ${"Category".padEnd(maxCat + 2)} Technologies`;
    const separator = `  ${"─".repeat(maxCat + 2)} ${"─".repeat(50)}`;

    const output = [header, separator, ...lines];

    // Add languages
    if (!args[0]) {
      output.push("");
      output.push(
        ...profile.languages.map(
          (l) => `  ${l.name.padEnd(maxCat + 2)} ${l.score}`
        )
      );
    }

    return { type: "text", content: output.join("\n") };
  },
});
