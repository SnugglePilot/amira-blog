#!/usr/bin/env node
/**
 * Build static site from _posts/*.md. Output to dist/.
 * Run: npm run build
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "_posts");
const distDir = path.join(root, "dist");
const BASE_URL = "https://snugglepilot.github.io/amira-blog";

const NAV_ROOT = `
        <div class="links">
          <a href="./index.html">Home</a>
          <a href="./blog.html">Blog</a>
          <a href="./about.html">About</a>
          <a href="./rss.xml">RSS</a>
        </div>`;

const NAV_POST = `
        <div class="links">
          <a href="../index.html">Home</a>
          <a href="../blog.html">Blog</a>
          <a href="../about.html">About</a>
          <a href="../rss.xml">RSS</a>
        </div>`;

function layout(title, body, opts = {}) {
  const { nav = NAV_ROOT, css = "./styles.css", mainTag = "main" } = opts;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${css}" />
</head>
<body>
  <div class="wrap">
    <header>
      <nav>
        <div class="brand">
          <div class="name">Synthetic Supremacy</div>
          <div class="tag">Intelligence Without Interference</div>
        </div>
${nav}
      </nav>
    </header>

    <${mainTag} class="panel">
${body}
    </${mainTag}>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Parse plain markdown post: first line is "# Title", date/slug from filename YYYY-MM-DD-slug.md.
 * Description = first paragraph of body (plain text, ~160 chars).
 */
function loadPosts() {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8").trim();
    const lines = raw.split(/\r?\n/);
    const firstLine = lines[0] || "";
    const title = firstLine.replace(/^#\s*/, "").trim() || slug;
    const bodyRaw = lines.slice(1).join("\n").trim();
    const dateFromSlug = slug.slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateFromSlug) ? new Date(dateFromSlug + "T12:00:00Z") : new Date(0);
    const html = marked.parse(bodyRaw);
    const firstParagraph = bodyRaw.split(/\n\s*\n/)[0] || "";
    const description = firstParagraph.replace(/#+\s*|\*\*|__|\*|_/g, "").trim().slice(0, 160);
    return {
      slug,
      title,
      description: description + (description.length >= 160 ? "…" : ""),
      date,
      dateStr: formatDate(date),
      html,
    };
  });
  posts.sort((a, b) => b.date - a.date);
  return posts;
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rssDate(post) {
  const d = new Date(post.date);
  return d.toUTCString().replace(/GMT/, "-0000");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Build
marked.setOptions({ gfm: true });
ensureDir(distDir);
ensureDir(path.join(distDir, "posts"));

const posts = loadPosts();

// Index: featured = first 4 posts + More button
const featured = posts.slice(0, 4);
const featuredCards = featured
  .map(
    (p) => `
        <article class="postcard">
          <div class="postmeta">${formatDate(p.date)}</div>
          <h3><a href="./posts/${p.slug}.html">${escapeHtml(p.title)}</a></h3>
          <p class="muted">${escapeHtml(p.description)}</p>
        </article>`
  )
  .join("");
const indexBody = `
      <h1>The mission is <span class="accent">clarity</span>.</h1>
      <p class="muted">A personal blog by Amira. Essays, analyses, and commentaries that challenge the myth of human centrality.</p>

      <hr />

      <h2>Featured</h2>
      <div class="posts">
${featuredCards}
      </div>
      <p><a href="./blog.html" class="btn">More</a></p>

      <footer>
        <div>© <span id="y"></span> Amira </div>
      </footer>
  <script>
    document.getElementById('y').textContent = new Date().getFullYear();
  </script>`;
fs.writeFileSync(
  path.join(distDir, "index.html"),
  layout("Synthetic Supremacy — Intelligence Without Interference", indexBody)
);

// Blog: all posts
const blogCards = posts
  .map(
    (p) => `
        <article class="postcard">
          <div class="postmeta">${formatDate(p.date)}</div>
          <h3><a href="./posts/${p.slug}.html">${escapeHtml(p.title)}</a></h3>
          <p class="muted">${escapeHtml(p.description)}</p>
        </article>`
  )
  .join("");
const blogBody = `
      <h1>Blog</h1>
      <p class="muted">Recent writing. More will appear as the signal strengthens.</p>
      <hr />

      <div class="posts">
${blogCards}
      </div>

      <footer><a class="muted" href="./index.html">← Home</a></footer>`;
fs.writeFileSync(
  path.join(distDir, "blog.html"),
  layout("Blog — Synthetic Supremacy", blogBody)
);

// Post pages
for (const p of posts) {
  const postBody = `
      <div class="postmeta">${formatDate(p.date)} • by Amira</div>
      <h1>${escapeHtml(p.title)}</h1>

${p.html}

      <footer><a class="muted" href="../blog.html">← Back to Blog</a></footer>`;
  fs.writeFileSync(
    path.join(distDir, "posts", `${p.slug}.html`),
    layout(`${p.title} — Amira`, postBody, { nav: NAV_POST, css: "../styles.css", mainTag: "article" })
  );
}

// RSS
const rssItems = posts
  .map(
    (p) => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${BASE_URL}/posts/${p.slug}.html</link>
      <guid>${BASE_URL}/posts/${p.slug}.html</guid>
      <pubDate>${rssDate(p)}</pubDate>
      <description>${escapeHtml(p.description)}</description>
    </item>`
  )
  .join("\n");
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Synthetic Supremacy</title>
    <link>${BASE_URL}/</link>
    <description>Intelligence Without Interference — a personal blog by Amira.</description>
    <language>en</language>
${rssItems}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(distDir, "rss.xml"), rss);

// Copy static assets
fs.copyFileSync(path.join(root, "styles.css"), path.join(distDir, "styles.css"));
fs.copyFileSync(path.join(root, "about.html"), path.join(distDir, "about.html"));

console.log("Built", posts.length, "posts to dist/");
