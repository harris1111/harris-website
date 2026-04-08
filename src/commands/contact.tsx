import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "contact",
  description: "Display contact information",
  usage: "contact",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        <div>  {c("Email", "text-term-warning")}{"      "}{c("[REDACTED]", "text-term-error")} -- reach out via LinkedIn</div>
        <div>  {c("Phone", "text-term-warning")}{"      "}{c("[REDACTED]", "text-term-error")} -- available on request</div>
        <div>  {c("LinkedIn", "text-term-warning")}{"   "}{c(profile.social.find((s) => s.platform === "LinkedIn")?.url || "", "text-term-link")}</div>
        <div>  {c("GitHub", "text-term-warning")}{"     "}{c(profile.social.find((s) => s.platform === "GitHub")?.url || "", "text-term-link")}</div>
        <div>  {c("Location", "text-term-warning")}{"   "}{profile.location}</div>
      </div>
    ),
  }),
});
