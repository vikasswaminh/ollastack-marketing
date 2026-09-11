// Centralized JSON-LD builders for the marketing site.
//
// The plan prices are ALSO rendered visibly on the homepage (§3) and on
// /pricing (the `tiers` array). Keeping the machine-readable prices here — one
// source, imported by both pages — stops the structured data from drifting away
// from the visible price (the sitemap is auto-enumerated for the same reason).
//
// 2026 note: FAQPage no longer produces a Google rich result (removed
// 2026-05-07), but the markup still helps AI Mode / answer engines parse the
// Q&A and is harmless to keep. SoftwareApplication + Offer are still supported
// and feed price/plan answers. We deliberately DON'T emit aggregateRating — we
// have no real reviews, and inventing them is a penalty risk.

const SITE = "https://ollastack.com";

export interface Plan {
  name: string;
  price: string; // whole USD, no symbol
  submissions: string;
}

export const PLANS: Plan[] = [
  { name: "Free", price: "0", submissions: "50" },
  { name: "Solo", price: "9", submissions: "500" },
  { name: "Team", price: "29", submissions: "5,000" },
];

export const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ollastack",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: `${SITE}/`,
  description:
    "Agent email API, form backend, and email-testing platform — send and receive email as an AI agent, collect form submissions, and read OTP codes and links in CI.",
  offers: PLANS.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: p.price,
    priceCurrency: "USD",
    url: `${SITE}/pricing`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: p.price,
      priceCurrency: "USD",
      unitText: "MONTH",
    },
  })),
};

export interface Faq {
  q: string;
  a: string;
}

export const faqPageLd = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

// Docs-page structured data. BreadcrumbList still yields a SERP breadcrumb and,
// with TechArticle, gives AI Mode a named, attributable source for "how do I…"
// answers (docs are a prime citation surface). Emitted centrally by Base.astro
// when a page passes docsName + docsSlug.
export const docsBreadcrumbLd = (name: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE}/docs` },
    { "@type": "ListItem", position: 3, name, item: `${SITE}/docs/${slug}` },
  ],
});

export const blogBreadcrumbLd = (title: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog/` },
    { "@type": "ListItem", position: 3, name: title, item: `${SITE}/blog/${slug}/` },
  ],
});

export const blogIndexBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog/` },
  ],
};

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ollastack",
  url: `${SITE}/`,
  logo: `${SITE}/logo.svg`,
  sameAs: ["https://github.com/vikasswaminh/ollastack-marketing"],
  description: "One platform for AI agents: forms they can submit, agent mailboxes that send and receive email, and disposable inboxes for email testing in CI.",
};

export const webSiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ollastack",
  url: `${SITE}/`,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const techArticleLd = (opts: {
  title: string;
  description: string;
  slug: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: opts.title,
  description: opts.description,
  author: { "@type": "Organization", name: "Ollastack", url: `${SITE}/` },
  publisher: {
    "@type": "Organization",
    name: "Ollastack",
    logo: { "@type": "ImageObject", url: `${SITE}/logo.svg` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/docs/${opts.slug}` },
  image: `${SITE}/og.png`,
});

