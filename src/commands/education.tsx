import { register } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";

register({
  name: "education",
  description: "Display education background",
  usage: "education",
  execute: () => {
    const edu = profile.education;
    return {
      type: "jsx",
      content: (
        <div className="whitespace-pre-wrap font-mono">
          <div>{c(edu.institution, "text-term-accent")}</div>
          <div>{c(edu.degree, "text-term-prompt")}</div>
          <div>{c(edu.period, "text-term-warning")} | GPA: {c(edu.gpa, "text-term-accent")}</div>
        </div>
      ),
    };
  },
});
