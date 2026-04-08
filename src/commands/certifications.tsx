import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "certifications",
  description: "Display certifications",
  usage: "certifications",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        {profile.certifications.map((cert, i) => (
          <div key={i}>  {c("•", "text-term-muted")} {c(cert, "text-term-accent")}</div>
        ))}
      </div>
    ),
  }),
});
