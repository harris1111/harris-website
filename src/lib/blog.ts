import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPostMeta, BlogPost } from "@/types";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const WORDS_PER_MINUTE = 200;

function getReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Get all published blog post metadata, sorted newest first */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title || slug,
      date: data.date || "Unknown",
      tags: data.tags || [],
      description: data.description || "",
      readingTime: getReadingTime(content),
      published: data.published !== false,
    };
  });

  return posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Get a single blog post by slug with full content */
export function getPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  if (data.published === false) return null;

  return {
    slug,
    title: data.title || slug,
    date: data.date || "Unknown",
    tags: data.tags || [],
    description: data.description || "",
    readingTime: getReadingTime(content),
    published: true,
    content,
  };
}

/** Get all slugs for static generation */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
