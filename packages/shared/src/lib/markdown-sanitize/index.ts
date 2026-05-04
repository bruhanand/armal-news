// Output is HTML so the deep-dive page can render via dangerouslySetInnerHTML
// against a pre-sanitized string. The same util feeds the admin Preview tab in
// slice 0008 — admin preview must equal public render byte-for-byte (ADR 0004
// § E). Export the schema so 0008 can import the same allow-list.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";

// Allow-list locked to prose markup the design pack uses on the deep-dive
// page. Headings cap at h4 (clamp pass below); h1/page title is owned by the
// page shell so the article body never competes with it. img and a are the
// only attribute-bearing elements; protocols are restricted to http/https
// (and data: for img, further filtered to data:image/* below) so
// `[click](javascript:alert(1))` and `<a href="data:text/html,...">` get
// stripped.
export const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    "p",
    "a",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "h4",
    "img",
    "hr",
    "br",
  ],
  attributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["className"],
    pre: ["className"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https", "data"],
  },
  clobberPrefix: "user-content-",
  clobber: [],
  ancestors: {
    li: ["ul", "ol"],
  },
  strip: ["script", "style"],
  allowComments: false,
  allowDoctypes: false,
};

// Clamp every heading down one level (h1→h2, h2→h3, h3→h4), then cap at h4.
// h4/h5/h6 all collapse to h4 so a `##### deeply-nested` block in OpenClaw's
// output can't exceed the article's typographic ceiling.
function rehypeClampHeadings() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const m = /^h([1-6])$/.exec(node.tagName);
      if (!m) return;
      const original = parseInt(m[1]!, 10);
      const next = Math.min(original + 1, 4);
      node.tagName = `h${next}`;
    });
  };
}

// rehype-sanitize's protocol allow-list is per-scheme but not per-mime, so
// it can't distinguish `data:image/png;base64,…` from `data:text/html;…`.
// We allow `data:` in `protocols.src` and then strip any non-image data URL
// from img.src here. svg is excluded because the brief calls out
// SVG-embedded scripts as a strip target.
const ALLOWED_IMG_DATA_MIME = /^data:image\/(png|jpe?g|gif|webp);/i;

function rehypeRestrictImgDataUrls() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;
      const src = node.properties?.src;
      if (typeof src !== "string") return;
      if (src.startsWith("data:") && !ALLOWED_IMG_DATA_MIME.test(src)) {
        if (node.properties) delete node.properties.src;
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  // allowDangerousHtml is left at its default (false), so any raw HTML tag in
  // the markdown source — `<script>`, `<iframe>`, `<style>`, an inline
  // `<img onerror=…>` — gets dropped here, before sanitization sees it.
  .use(remarkRehype)
  .use(rehypeClampHeadings)
  .use(rehypeSanitize, SANITIZE_SCHEMA)
  .use(rehypeRestrictImgDataUrls)
  .use(rehypeStringify);

export function sanitizeMarkdown(input: string): string {
  return String(processor.processSync(input));
}
