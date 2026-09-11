import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { posts } from "../data/posts";

const SITE = "https://ollastack.com";
const TODAY = new Date().toISOString().slice(0, 10);

interface Entry {
  url: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
}

// Auto-enumerate every static page under src/pages so the sitemap can't drift
// out of sync with the site (it used to be a hand-maintained list, and ~11 docs
// pages + /use-cases had silently fallen off it). Blog posts are handled
// separately below (markdown collection + legacy .astro posts).
const pageFiles = import.meta.glob("./**/*.astro");

function fileToUrl(key: string): string | null {
  // "./docs/agent-mail.astro" -> "/docs/agent-mail"; "./index.astro" -> "/"
  let p = key.replace(/^\.\//, "/").replace(/\.astro$/, "");
  if (p.includes("[")) return null; // dynamic route (e.g. blog/[...slug])
  p = p.replace(/\/index$/, "");
  if (p === "") p = "/";
  if (p === "/404") return null; // not indexable
  return p;
}

function priorityFor(url: string): string {
  if (url === "/") return "1.0";
  if (url === "/pricing" || url === "/email-api") return "0.9";
  if (url === "/docs" || url === "/blog" || url.startsWith("/resources")) return "0.8";
  return "0.7";
}
function changefreqFor(url: string): "weekly" | "monthly" {
  if (["/", "/docs", "/blog", "/email-api", "/careers"].includes(url)) return "weekly";
  return "monthly";
}

// Better lastmod for the standalone .astro blog posts, from their post metadata.
const postDate: Record<string, string> = Object.fromEntries(
  posts.map((p) => [`/blog/${p.slug.replace(/^\//, "")}`, p.date])
);

const staticEntries: Entry[] = Object.keys(pageFiles)
  .map(fileToUrl)
  .filter((u): u is string => u !== null)
  .map((url) => ({
    url,
    lastmod: postDate[url] ?? TODAY,
    changefreq: changefreqFor(url),
    priority: url.startsWith("/blog") ? "0.7" : priorityFor(url),
  }));

// Markdown blog posts (not .astro files, so not in the glob above).
const collectionBlog: Entry[] = (
  await getCollection("blog", ({ data }) => data.draft !== true)
).map((p) => {
  const cleanSlug = p.slug.replace(/^\//, "");
  return {
    url: `/blog/${cleanSlug}`,
    lastmod: (p.data.updated ?? p.data.date).toISOString().slice(0, 10),
    changefreq: "monthly",
    priority: "0.7",
  };
});

// Dedupe by URL (a standalone .astro post and its posts[] entry can overlap).
const byUrl = new Map<string, Entry>();
for (const e of [...staticEntries, ...collectionBlog]) {
  const normalizedUrl = e.url.replace(/\/$/, "") || "/";
  if (!byUrl.has(normalizedUrl)) {
    byUrl.set(normalizedUrl, { ...e, url: normalizedUrl });
  }
}
const all = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));

// Cloudflare Pages 308-redirects every non-slash URL to its trailing-slash form
// (e.g. /docs/agents -> /docs/agents/), and that slash form is what each page
// self-canonicalizes to. Advertise the SAME trailing-slash URL in <loc> so the
// sitemap doesn't point Google at URLs that immediately redirect. Root stays "/".
const withSlash = (u: string): string => (u === "/" ? "/" : `${u}/`);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (e) => `  <url>
    <loc>${SITE}${withSlash(e.url)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

export const GET: APIRoute = () =>
  new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
