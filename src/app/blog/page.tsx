import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { ThemeLoader } from "@/components/theme-loader";

export const metadata: Metadata = {
  title: "Blog — Nguyen Minh An | DevOps Engineer",
  description: "DevOps engineering blog — CI/CD, Kubernetes, GitOps, and cloud infrastructure.",
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-term-bg text-term-fg">
      <ThemeLoader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-term-accent">
            ~/blog
          </h1>
          <p className="text-term-muted mt-1">
            DevOps engineering notes — CI/CD, Kubernetes, GitOps, infrastructure.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-term-muted">No posts yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="border border-term-border rounded p-4 hover:border-term-muted transition-colors"
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  <h2 className="text-lg font-bold text-term-fg group-hover:text-term-accent transition-colors">
                    {post.title}
                  </h2>
                  <div className="text-term-muted text-sm mt-1">
                    {post.date} · {post.readingTime} min read
                  </div>
                  {post.description && (
                    <p className="text-term-fg/80 text-sm mt-2 leading-relaxed">
                      {post.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-term-selection text-term-link px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-term-border flex gap-4 text-sm">
          <Link href="/" className="text-term-link hover:text-term-accent">
            ← Terminal
          </Link>
          <Link href="/about" className="text-term-link hover:text-term-accent">
            About →
          </Link>
        </footer>
      </div>
    </main>
  );
}
