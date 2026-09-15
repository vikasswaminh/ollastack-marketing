import { defineCollection, z } from "astro:content";

// Blog content collection. New posts are markdown under src/content/blog/*.md;
// the older hand-built posts live as standalone .astro pages and are listed
// alongside these in blog/index.astro. The slug is the filename (no date
// prefix — keep filenames clean, e.g. migrate-from-formspree.md).
const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default("Ollastack"),
    readingTime: z.number().default(8),
    draft: z.boolean().default(false),
    canonical: z.string().optional(),
    ogImage: z.string().optional(),
    // Optional FAQ — rendered as a section AND emitted as FAQPage JSON-LD
    // (rich-result eligibility + People-Also-Ask coverage).
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
    // Optional Wrapping Up section rendered after FAQ
    wrappingUp: z
      .object({
        title: z.string().optional(),
        paragraphs: z.array(z.string()),
      })
      .optional(),
  }),
});

export const collections = { blog };
