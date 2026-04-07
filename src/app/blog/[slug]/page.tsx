import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/lib/blog";
import type { Metadata } from "next";
import { BlogContent } from "./blog-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} — Nguyen Minh An`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-term-bg text-term-fg">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-term-accent mb-2">
            {post.title}
          </h1>
          <div className="text-term-muted text-sm">
            {post.date} · {post.readingTime} min read ·{" "}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-term-selection text-term-link px-2 py-0.5 rounded mr-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <BlogContent content={post.content} />

        <footer className="mt-12 pt-6 border-t border-term-border flex gap-4 text-sm">
          <a href="/" className="text-term-link hover:text-term-accent">
            ← Terminal
          </a>
          <a href="/blog" className="text-term-link hover:text-term-accent">
            ← Blog
          </a>
        </footer>
      </article>
    </main>
  );
}
