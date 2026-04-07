import { register } from "./registry";
import { profile } from "@/data/profile";

register({
  name: "education",
  description: "Display education background",
  usage: "education",
  execute: () => {
    const edu = profile.education;
    return {
      type: "text",
      content: [
        edu.institution,
        `${edu.degree}`,
        `${edu.period} | GPA: ${edu.gpa}`,
      ].join("\n"),
    };
  },
});
