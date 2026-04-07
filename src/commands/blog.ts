import { register } from "./registry";
import type { BlogPostMeta } from "@/types";

register({
  name: "blog",
  description: "Read blog posts",
  usage: "blog [slug]",
  execute: async (args) => {
    // View specific post
    if (args[0]) {
      try {
        const res = await fetch(`/api/blog/${args[0]}`);
        if (!res.ok) {
          return {
            type: "error",
            content: `Post not found: ${args[0]}`,
          };
        }
        const post = await res.json();
        const header = [
          post.title,
          `${post.date} · ${post.readingTime} min read · ${post.tags.join(", ")}`,
          "─".repeat(60),
          "",
        ].join("\n");
        return {
          type: "text",
          content: header + post.content,
        };
      } catch {
        return {
          type: "error",
          content: "Failed to fetch blog post. Is the server running?",
        };
      }
    }

    // List all posts
    try {
      const res = await fetch("/api/blog");
      const posts: BlogPostMeta[] = await res.json();

      if (posts.length === 0) {
        return { type: "text", content: "No blog posts yet." };
      }

      const lines = posts.map(
        (p) =>
          `  ${p.date}  ${p.title.padEnd(40)}  [${p.tags.join(", ")}]  ${p.readingTime}m`
      );

      return {
        type: "text",
        content: [
          "Blog Posts:",
          "",
          `  ${"Date".padEnd(12)}${"Title".padEnd(40)}  Tags`,
          `  ${"─".repeat(10)}  ${"─".repeat(38)}  ${"─".repeat(20)}`,
          ...lines,
          "",
          "Usage: blog <slug> to read a post",
        ].join("\n"),
      };
    } catch {
      return {
        type: "error",
        content: "Failed to fetch blog list.",
      };
    }
  },
});
