import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "social",
  description: "Display social links",
  usage: "social",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        {profile.social.map((s, i) => (
          <div key={i}>
            {"  "}{c(s.platform.padEnd(12), "text-term-warning")} {c(s.url, "text-term-link")}
          </div>
        ))}
      </div>
    ),
  }),
});
