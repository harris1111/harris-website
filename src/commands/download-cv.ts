import { register } from "./registry";

register({
  name: "download-cv",
  description: "Download CV as PDF",
  usage: "download-cv",
  execute: () => {
    // Trigger download client-side
    if (typeof window !== "undefined") {
      const link = document.createElement("a");
      link.href = "/cv/Nguyen-Minh-An-DevOps-Engineer-CV.pdf";
      link.download = "Nguyen-Minh-An-DevOps-Engineer-CV.pdf";
      link.click();
    }
    return {
      type: "text",
      content: "Downloading CV... If it doesn't start, check /cv/ directory.",
    };
  },
});
