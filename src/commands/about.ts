import { register } from "./registry";
import { profile } from "@/data/profile";

register({
  name: "about",
  description: "Display profile summary",
  usage: "about",
  execute: () => ({
    type: "text",
    content: [
      `${profile.name}`,
      `${profile.role}`,
      `${profile.location}`,
      "",
      profile.summary,
      "",
      `"${profile.motto}"`,
    ].join("\n"),
  }),
});
