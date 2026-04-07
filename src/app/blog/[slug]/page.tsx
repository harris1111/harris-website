import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/lib/blog";
import { markdownToHtml, extractToc } from "@/lib/markdown";
import { ThemeLoader } from "@/components/theme-loader";
import type { Metadata } from "next";

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

  const htmlContent = await markdownToHtml(post.content);
  const toc = extractToc(post.content);

  return (
    <main className="min-h-screen bg-term-bg text-term-fg">
      <ThemeLoader />
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

        {/* Table of Contents */}
        {toc.length > 0 && (
          <nav className="mb-8 p-4 border border-term-border rounded bg-term-bg">
            <h2 className="text-sm font-bold text-term-warning mb-2">
              Table of Contents
            </h2>
            <ul className="space-y-1 text-sm">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={item.level === 3 ? "pl-4" : ""}
                >
                  <a
                    href={`#${item.id}`}
                    className="text-term-link hover:text-term-accent"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

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
