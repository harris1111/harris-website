import { register } from "./registry";
import { profile } from "@/data/profile";

register({
  name: "contact",
  description: "Display contact information",
  usage: "contact",
  execute: () => ({
    type: "text",
    content: [
      `  Phone      ${profile.phone}`,
      `  Email      ${profile.email}`,
      `  LinkedIn   ${profile.social.find((s) => s.platform === "LinkedIn")?.url}`,
      `  GitHub     ${profile.social.find((s) => s.platform === "GitHub")?.url}`,
      `  Location   ${profile.location}`,
    ].join("\n"),
  }),
});
