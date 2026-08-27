export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category?: string;
  categorySlug?: string;
  featured?: boolean;
}

export const posts: PostMeta[] = [
  {
    slug: "form-backend-vs-form-builder",
    title: "Form Backend vs Form Builder: What Developers Should Choose in 2026",
    description:
      "Compare form backends and form builders in 2026. Learn how APIs, customization, security, webhooks, scalability, AI agents, and developer control affect which option you should choose.",
    date: "2026-08-27",
    readingTime: "18 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
    featured: true,
  },
  {
    slug: "how-to-automate-otp-email-testing-in-ci-cd-pipelines",
    title: "How to Automate OTP Email Testing in CI/CD Pipelines",
    description:
      "The practical guide to testing email verification flows with isolated inboxes, Email APIs, Playwright, Cypress, Selenium, CI workflows, and secure parallel execution.",
    date: "2026-08-25",
    readingTime: "18 min read",
    category: "Email & Testing",
    categorySlug: "email-testing",
    featured: true,
  },
  {
    slug: "how-to-build-a-form-backend-for-a-static-site-without-writing-a-server",
    title:
      "How to Build a Form Backend for a Static Site Without Writing a Server",
    description:
      "You don't need Express, a database, or a $5/month droplet just to catch a contact form. Here's exactly how to give a static site a real form backend — spam filtering, notifications, webhooks and all — without writing a line of server code.",
    date: "2026-08-25",
    readingTime: "21 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "can-ai-agents-submit-forms-safely",
    title:
      "Can AI Agents Submit Forms Safely? Here's What Developers Need to Know",
    description:
      "AI agents are filling out and submitting forms on behalf of humans at scale. Here's what \"safe\" actually means for that traffic, where it breaks, and how to build (or choose) a form backend that handles it properly.",
    date: "2026-08-21",
    readingTime: "21 min read",
    category: "AI Agents",
    categorySlug: "ai-agents",
  },
  {
    slug: "netlify-forms-alternatives",
    title: "Netlify Forms alternatives in 2026: a migration guide",
    description:
      "Netlify Forms moved to credit-based billing. Here's how to move your forms off Netlify without rewriting your site — with the actual code diff for each alternative.",
    date: "2026-05-16",
    readingTime: "10 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "formspree-vs-netlify-forms",
    title: "Formspree vs Netlify Forms (2026): a fair comparison",
    description:
      "Both handle form submissions for static sites — but on different assumptions. When each one fits, when each one breaks, and what else to consider.",
    date: "2026-05-16",
    readingTime: "8 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "basin-vs-web3forms",
    title: "Basin vs Web3Forms (2026): which form backend fits you",
    description:
      "Basin invests in dashboard polish, Web3Forms invests in unlimited free submissions. They're optimizing for different users. Here's how to pick — and when neither is the right answer.",
    date: "2026-05-16",
    readingTime: "7 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "forminit-alternatives",
    title:
      "Forminit alternatives in 2026 (formerly Getform): an honest comparison",
    description:
      "Getform rebranded to Forminit in early 2026. A straight comparison of the form backends worth considering — Formspree, Basin, Formcarry, Web3Forms, Netlify Forms, Formspark, Ollastack — with the tradeoffs each carries.",
    date: "2026-05-16",
    readingTime: "11 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "form-backend-for-ai-agents",
    title:
      "Form backend for AI agents: why forms break for LLMs (and what to do)",
    description:
      "AI agents are increasingly submitting forms on behalf of users — and traditional form backends flag every one of them as spam. Here's why, and how to design a backend that treats agents as first-class users.",
    date: "2026-05-16",
    readingTime: "9 min read",
    category: "AI Agents",
    categorySlug: "ai-agents",
  },
  {
    slug: "html-form-to-email-without-backend",
    title: "Send an HTML form to email without writing a backend",
    description:
      "A practical walkthrough: point an HTML form at an endpoint, get an email when someone submits, skip the server. With the gotchas nobody warns you about.",
    date: "2026-05-15",
    readingTime: "7 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
];

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  });
