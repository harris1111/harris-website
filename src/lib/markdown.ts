import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Convert markdown string to HTML string (server-side) */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);

  // Add id attributes to headings for anchor links
  let html = result.toString();
  html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_match, level, text) => {
    const id = text
      .replace(/<[^>]*>/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  return html;
}

/** Extract table of contents from markdown */
export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    toc.push({ id, text, level });
  }

  return toc;
}
