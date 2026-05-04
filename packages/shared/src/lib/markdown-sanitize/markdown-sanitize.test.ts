import { describe, expect, it } from "vitest";
import { sanitizeMarkdown } from "./index";

describe("sanitizeMarkdown — strips dangerous markup", () => {
  // Notes on what the assertions are guarding:
  // - The defense is "no executable HTML in the rendered output", not "the
  //   string 'alert(1)' never appears anywhere." Stripping a `<script>` tag
  //   leaves its text content as harmless prose inside a `<p>` — that's the
  //   correct outcome.
  // - rehype-sanitize is the second line of defense; the first is
  //   `remark-rehype` with `allowDangerousHtml: false`, which drops raw HTML
  //   tags before they reach the hast tree at all.

  it("strips a raw <script> tag (text content survives as prose)", () => {
    const html = sanitizeMarkdown("Hello <script>alert(1)</script> world.");
    expect(html).not.toMatch(/<script\b/i);
    expect(html).toContain("Hello");
    expect(html).toContain("world.");
  });

  it("strips a raw <iframe> tag", () => {
    const html = sanitizeMarkdown(
      'Embed: <iframe src="https://evil.example"></iframe> end.',
    );
    expect(html).not.toMatch(/<iframe\b/i);
    // Attribute value is gone with the tag.
    expect(html).not.toContain("evil.example");
  });

  it("strips a raw <style> tag (text content survives as prose)", () => {
    const html = sanitizeMarkdown(
      "Style: <style>body{display:none}</style> end.",
    );
    expect(html).not.toMatch(/<style\b/i);
  });

  it("strips a javascript: URL on a markdown link", () => {
    const html = sanitizeMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    // Anchor element loses its href; the link text survives.
    expect(html).not.toMatch(/<a\b[^>]*href=/i);
    expect(html).toContain("click");
  });

  it("strips an inline event handler on a raw <img>", () => {
    const html = sanitizeMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });

  it("strips a non-image data: URL on a markdown image", () => {
    const html = sanitizeMarkdown(
      "![pwn](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
    );
    // src is removed; img element may stay (alt-only) or vanish entirely.
    expect(html).not.toContain("data:text/html");
  });

  it("strips an svg+xml data: URL on a markdown image (SVG-embedded scripts vector)", () => {
    // Use base64 so the URL doesn't contain `<` (which would break markdown
    // image parsing before sanitize ever sees the img element).
    const html = sanitizeMarkdown(
      "![pwn](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+)",
    );
    expect(html).not.toContain("data:image/svg");
    expect(html).not.toContain("PHN2Zy");
  });
});

describe("sanitizeMarkdown — preserves benign markup", () => {
  it("renders bold and italic", () => {
    expect(sanitizeMarkdown("**bold** and _italic_.")).toMatchInlineSnapshot(
      `"<p><strong>bold</strong> and <em>italic</em>.</p>"`,
    );
  });

  it("renders an unordered list", () => {
    expect(sanitizeMarkdown("- one\n- two\n- three\n")).toMatchInlineSnapshot(`
      "<ul>
      <li>one</li>
      <li>two</li>
      <li>three</li>
      </ul>"
    `);
  });

  it("renders an ordered list", () => {
    expect(sanitizeMarkdown("1. one\n2. two\n")).toMatchInlineSnapshot(`
      "<ol>
      <li>one</li>
      <li>two</li>
      </ol>"
    `);
  });

  it("renders a single-paragraph blockquote (pull-quote shape)", () => {
    expect(
      sanitizeMarkdown(
        "> We're shipping interpretability for a model close enough that the research transfers.",
      ),
    ).toMatchInlineSnapshot(`
      "<blockquote>
      <p>We're shipping interpretability for a model close enough that the research transfers.</p>
      </blockquote>"
    `);
  });

  it("renders a fenced code block", () => {
    expect(
      sanitizeMarkdown("```\nclaude-circuits.attach('reasoning')\n```"),
    ).toMatchInlineSnapshot(
      `"<pre><code>claude-circuits.attach('reasoning')\n</code></pre>"`,
    );
  });

  it("renders inline code", () => {
    expect(sanitizeMarkdown("Run `pnpm test` first.")).toMatchInlineSnapshot(
      `"<p>Run <code>pnpm test</code> first.</p>"`,
    );
  });

  it("preserves an http(s) link", () => {
    expect(
      sanitizeMarkdown("See [Anthropic](https://anthropic.com) for context."),
    ).toMatchInlineSnapshot(
      `"<p>See <a href="https://anthropic.com">Anthropic</a> for context.</p>"`,
    );
  });

  it("preserves an https image", () => {
    expect(
      sanitizeMarkdown("![hero](https://cdn.example/hero.jpg)"),
    ).toMatchInlineSnapshot(
      `"<p><img src="https://cdn.example/hero.jpg" alt="hero"></p>"`,
    );
  });

  it("clamps h1 to h2", () => {
    expect(sanitizeMarkdown("# Title")).toMatchInlineSnapshot(
      `"<h2>Title</h2>"`,
    );
  });

  it("clamps h5 to h4 (cap)", () => {
    expect(sanitizeMarkdown("##### Deep")).toMatchInlineSnapshot(
      `"<h4>Deep</h4>"`,
    );
  });

  it("clamps every heading: h1→h2, h2→h3, h3→h4, h4→h4", () => {
    expect(
      sanitizeMarkdown("# H1\n\n## H2\n\n### H3\n\n#### H4"),
    ).toMatchInlineSnapshot(`
      "<h2>H1</h2>
      <h3>H2</h3>
      <h4>H3</h4>
      <h4>H4</h4>"
    `);
  });
});
