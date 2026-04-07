import { register } from "./registry";
import { profile } from "@/data/profile";

register({
  name: "certifications",
  description: "Display certifications",
  usage: "certifications",
  execute: () => {
    const lines = profile.certifications.map((c) => `  • ${c}`);
    return { type: "text", content: lines.join("\n") };
  },
});
