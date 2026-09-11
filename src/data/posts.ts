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
    slug: "how-developers-can-use-disposable-inboxes-to-speed-up-testing",
    title: "How Developers Can Use Disposable Inboxes to Speed Up Testing",
    description:
      "Disposable inboxes let developers test signups, OTPs, password resets and transactional email in seconds instead of minutes. Here's how to use them in CI, Docker, Playwright and Cypress without flaky sleeps or shared test accounts.",
    date: "2026-09-11",
    readingTime: "19 min read",
    category: "Email Testing",
    categorySlug: "email-testing",
    featured: true,
  },
  {
    slug: "disposable-inbox-vs-temporary-email",
    title: "Disposable Inbox vs Temporary Email: Which One Is Better for Testing?",
    description:
      "Disposable inbox and temporary email sound like the same thing, but for developers testing signup flows, OTPs, and CI pipelines, the difference matters a lot. Here's a full breakdown of both, and which one belongs in your test suite.",
    date: "2026-09-10",
    readingTime: "19 min read",
    category: "Email Testing",
    categorySlug: "email-testing",
  },
  {
    slug: "form-submission-apis-explained-when-to-use-them-and-why-they-matter",
    title: "Form Submission APIs Explained: When to Use Them and Why They Matter",
    description:
      "A complete guide to form submission APIs. Learn what they are, how they work, when to use one instead of a form builder, and why they matter for developers, SaaS products, and AI agents in 2026.",
    date: "2026-09-09",
    readingTime: "22 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "what-is-a-headless-form-a-simple-guide-to-modern-developers",
    title: "What Is a Headless Form? A Simple Guide to Modern Developers",
    description:
      "A plain English breakdown of headless forms, what they are, how they work, why developers are switching to them, and how they compare to traditional forms and form builders in 2026.",
    date: "2026-09-08",
    readingTime: "23 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "how-to-build-ai-ready-forms-for-autonomous-agents",
    title: "How to Build AI-Ready Forms for Autonomous Agents",
    description:
      "A practical, developer-focused guide on designing forms that AI agents can fill, validate, and submit reliably, covering schema design, auth, and error handling.",
    date: "2026-09-07",
    readingTime: "22 min read",
    category: "AI Agents",
    categorySlug: "ai-agents",
  },
  {
    slug: "mailosaur-vs-mailinator-vs-disposable-inboxes",
    title: "Mailosaur vs Mailinator vs Disposable Inboxes: Which Is Best for QA Testing in 2026",
    description:
      "Compare Mailosaur, Mailinator, and disposable inboxes for QA testing in 2026. A developer breakdown of cost, isolation, CI integration, and OTP automation.",
    date: "2026-09-04",
    readingTime: "17 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "what-is-an-agent-email-api",
    title: "What Is an Agent Email API and Why Does It Matter for AI Workflows?",
    description:
      "AI agents are booking meetings, signing up for tools, verifying accounts, and following up on leads — and every one of those tasks eventually hits an inbox. Here's what an agent email API actually is, why a normal transactional email service can't do the job, and how to wire email into an agentic workflow properly.",
    date: "2026-09-03",
    readingTime: "21 min read",
    category: "AI Agents",
    categorySlug: "ai-agents",
  },
  {
    slug: "self-host-vs-hosted-form-backend",
    title: "Self-Host vs Hosted Form Backend: Complete 2026 Decision Framework",
    description:
      "Should you self-host your form backend or use a hosted API? A complete breakdown of maintenance, security, deliverability, costs, and infrastructure tradeoffs.",
    date: "2026-09-02",
    readingTime: "18 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "how-to-connect-a-contact-form-to-email-without-backend-code",
    title: "How to Connect a Contact Form to Email Without Backend Code (2026 Guide)",
    description:
      "Learn how to wire any HTML contact form directly to email without managing servers, SMTP credentials, or complex serverless functions.",
    date: "2026-09-01",
    readingTime: "15 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "form-backend-vs-form-builder",
    title: "Form Backend vs Form Builder: What Developers Should Choose in 2026",
    description:
      "Compare form backends and form builders in 2026. Learn how APIs, customization, security, webhooks, scalability, AI agents, and developer control affect which option you should choose.",
    date: "2026-08-31",
    readingTime: "18 min read",
    category: "Comparisons & Migrations",
    categorySlug: "comparisons",
  },
  {
    slug: "how-to-automate-otp-email-testing-in-ci-cd-pipelines",
    title: "How to Automate OTP Email Testing in CI/CD Pipelines",
    description:
      "The practical guide to testing email verification flows with isolated inboxes, Email APIs, Playwright, Cypress, Selenium, CI workflows, and secure parallel execution.",
    date: "2026-08-28",
    readingTime: "18 min read",
    category: "Email & Testing",
    categorySlug: "email-testing",
  },
  {
    slug: "how-to-build-a-form-backend-for-a-static-site-without-writing-a-server",
    title:
      "How to Build a Form Backend for a Static Site Without Writing a Server",
    description:
      "You don't need Express, a database, or a $5/month droplet just to catch a contact form. Here's exactly how to give a static site a real form backend — spam filtering, notifications, webhooks and all — without writing a line of server code.",
    date: "2026-08-27",
    readingTime: "21 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "form-webhooks-guide",
    title: "Form Webhooks Done Right: Signing, Retries, Replay",
    description:
      "How to consume form submission webhooks properly — verify HMAC signatures, handle retries idempotently, and replay deliveries after debugging.",
    date: "2026-08-26",
    readingTime: "12 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "form-design-conversion",
    title: "Form design for higher conversions (and less spam)",
    description:
      "Practical tips for designing high-converting forms without compromising on spam security.",
    date: "2026-08-25",
    readingTime: "8 min read",
    category: "Forms & Backend",
    categorySlug: "forms-backend",
  },
  {
    slug: "test-inbox-docker",
    title: "Test email in Docker and CI with a disposable inbox",
    description:
      "Run integration tests in Docker containers with real, isolated email inboxes that discard automatically.",
    date: "2026-08-24",
    readingTime: "12 min read",
    category: "Email & Testing",
    categorySlug: "email-testing",
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
