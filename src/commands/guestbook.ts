import { register } from "./registry";

register({
  name: "guestbook",
  description: "Read or sign the guestbook",
  usage: 'guestbook [--write "message" --name "name"] [--page N]',
  execute: async (_args, _ctx, flags) => {
    // Write mode
    if (flags.write) {
      const message = typeof flags.write === "string" ? flags.write : "";
      const name = typeof flags.name === "string" ? flags.name : "Anonymous";

      if (!message) {
        return {
          type: "error",
          content: 'Usage: guestbook --write "your message" --name "Your Name"',
        };
      }

      try {
        const res = await fetch("/api/guestbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, message }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { type: "error", content: data.error || "Failed to sign guestbook" };
        }

        return {
          type: "text",
          content: `Thanks, ${name}! Your message has been added to the guestbook.`,
        };
      } catch {
        return { type: "error", content: "Failed to connect to guestbook API." };
      }
    }

    // Read mode
    try {
      const page = typeof flags.page === "string" ? flags.page : "1";
      const res = await fetch(`/api/guestbook?page=${page}`);

      if (!res.ok) {
        return { type: "error", content: "Failed to fetch guestbook entries." };
      }

      const entries = await res.json();

      if (entries.length === 0) {
        return {
          type: "text",
          content: [
            "Guestbook is empty! Be the first to sign it:",
            "",
            '  guestbook --write "Hello!" --name "Your Name"',
          ].join("\n"),
        };
      }

      const lines = entries.map(
        (e: { name: string; message: string; createdAt: string }) => {
          const date = new Date(e.createdAt).toLocaleDateString();
          return `  [${date}] ${e.name}: ${e.message}`;
        }
      );

      return {
        type: "text",
        content: [
          "Guestbook:",
          "",
          ...lines,
          "",
          'Sign it: guestbook --write "message" --name "name"',
        ].join("\n"),
      };
    } catch {
      return { type: "error", content: "Failed to fetch guestbook." };
    }
  },
});
