"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-term-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-term-accent mt-8 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-term-accent mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-term-prompt mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-term-fg leading-relaxed mb-4">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-term-link underline hover:text-term-accent"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-term-bg border border-term-border rounded p-4 text-sm overflow-x-auto my-4 text-term-accent">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-term-selection text-term-link px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-term-bg border border-term-border rounded p-4 overflow-x-auto my-4 text-sm">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-term-fg">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-term-fg">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-term-fg">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-term-accent pl-4 my-4 text-term-muted italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-term-border px-3 py-2 text-left text-term-warning font-bold bg-term-selection">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-term-border px-3 py-2 text-term-fg">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="text-term-accent font-bold">{children}</strong>
          ),
          hr: () => <hr className="border-term-border my-6" />,
        }}
      />
    </div>
  );
}
