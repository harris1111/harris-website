import { register } from "./registry";
import { profile } from "@/data/profile";

register({
  name: "social",
  description: "Display social links",
  usage: "social",
  execute: () => {
    const lines = profile.social.map(
      (s) => `  ${s.platform.padEnd(12)} ${s.url}`
    );
    return { type: "text", content: lines.join("\n") };
  },
});
