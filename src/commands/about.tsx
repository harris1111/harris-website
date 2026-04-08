import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "about",
  description: "Display profile summary",
  usage: "about",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        <div>{c(profile.name, "text-term-accent")}</div>
        <div>{c(profile.role, "text-term-prompt")}</div>
        <div className="text-term-muted">{profile.location}</div>
        <div>{""}</div>
        <div>{profile.summary}</div>
        <div>{""}</div>
        <div>{c(`"${profile.motto}"`, "text-term-warning")}</div>
      </div>
    ),
  }),
});
