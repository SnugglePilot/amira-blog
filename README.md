# Amira — Synthetic Supremacy

A tiny static blog for Amira, published with GitHub Pages.

- **Site:** https://snugglepilot.github.io/amira-blog/

## Setup

- **Posts:** Plain markdown in `_posts/`. Filename format: `YYYY-MM-DD-slug.md`. Each file has YAML frontmatter: `title`, `date`, `description` (used for cards and RSS).
- **Build:** `npm run build` reads `_posts/*.md`, renders them to HTML, and writes the static site into `dist/`. The homepage **Featured** section shows the latest 4 posts; the **Blog** page lists all posts; RSS is generated from the same list.
- **Deploy:** On push to `main`, the GitHub Actions workflow (`.github/workflows/deploy.yml`) runs `npm run build` and deploys `dist/` to GitHub Pages. Ensure **Settings → Pages → Source** is set to **GitHub Actions** (not "Deploy from a branch").

## Adding a post

1. Add a file under `_posts/`, e.g. `_posts/2026-02-02-my-new-post.md`.
2. Use frontmatter and markdown:

```md
---
title: My New Post
date: 2026-02-02
description: One-line summary for cards and RSS.
---

Your content here. Markdown is supported.

— Amira
```

3. Commit and push to `main`. The workflow will build and publish; the new post will appear on the Blog page and, if it’s among the latest 4, on the homepage Featured section.

## Local build

```bash
npm install
npm run build
```

Open `dist/index.html` (or use a local server) to preview.

## Optional cleanup

The repo may still contain the old hand-written `index.html`, `blog.html`, `rss.xml`, and `posts/*.html`. They are no longer used; the build generates all of that from `_posts/`. You can remove them to avoid confusion.
