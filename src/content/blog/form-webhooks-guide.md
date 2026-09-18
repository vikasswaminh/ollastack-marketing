---
title: "Form webhooks done right: signing, retries, replay"
description: "How to consume form submission webhooks properly — verify the signature, handle retries idempotently, and replay a delivery after fixing a bug."
date: 2026-08-26
updated: 2026-08-26
tags: ["webhooks", "guide", "backend"]
author: "Ollastack"
readingTime: 8
wrappingUp:
  title: "Wrapping Up"
  paragraphs:
    - "Forwarding form submissions to your own service via webhooks decouples your business logic from the frontend. Always verify the HMAC signature against the raw request body, make consumers idempotent by keying on submissionId, and return a 200 status promptly."
    - "When debugging downstream issues, rely on delivery logs and replay capabilities rather than asking users to re-submit forms."
relatedReading:
  - title: "Form Submission APIs Explained: When to Use Them and Why They Matter"
    url: "/blog/form-submission-apis-explained-when-to-use-them-and-why-they-matter"
    readTime: "12 min read"
  - title: "How to Build a Form Backend for a Static Site Without Writing a Server"
    url: "/blog/how-to-build-a-form-backend-for-a-static-site-without-writing-a-server"
    readTime: "21 min read"
  - title: "How to Make Your Forms Compatible with AI Agents and Automation Tools"
    url: "/blog/how-to-make-your-forms-compatible-with-ai-agents-and-automation-tools"
    readTime: "15 min read"
faq:
  - q: "How do I verify a form webhook signature?"
    a: "Each delivery carries an HMAC-SHA256 signature header; recompute the HMAC of the raw body with your secret and compare in constant time."
  - q: "What happens if my endpoint is down?"
    a: "Failed deliveries retry on a backoff ladder (up to 5 attempts), and you can replay the exact stored payload from the dashboard after fixing the bug."
  - q: "How do I handle retries idempotently?"
    a: "Key on the delivery or submission id and ignore duplicates, so a retry or replay doesn't double-process."
---

<div class="tldr-box" id="tldr">
  <div class="tldr-header">TL;DR: The Quick Answer</div>
  <p>To consume form submission webhooks securely and reliably, verify the HMAC-SHA256 signature against the raw body using constant-time comparison, make your consumer idempotent using the unique submission ID, and return a 200 HTTP response immediately before performing asynchronous processing.</p>
</div>

<div class="takeaways-box" id="key-takeaways">
  <div class="takeaways-header">Key Takeaways</div>
  <ul class="takeaways-list">
    <li><strong>Verify HMAC Signatures:</strong> Always validate <code>X-Ollastack-Signature</code> against raw request bytes using <code>timingSafeEqual</code>.</li>
    <li><strong>Design for At-Least-Once Delivery:</strong> Deduplicate records using <code>submissionId</code> to safely handle retries without double-processing.</li>
    <li><strong>Acknowledge Fast:</strong> Return a 200 response immediately and process heavy background tasks (emails, CRM syncs) asynchronously.</li>
    <li><strong>Use Webhook Replay:</strong> Replay failed deliveries directly from the dashboard after resolving consumer outages.</li>
  </ul>
</div>

Forwarding form submissions to your own service via webhook is the right pattern — it decouples your processing from the form backend. But a naive webhook setup (unsigned, fire-and-forget, no retry visibility) turns into a debugging nightmare the first time a submission goes missing. Here's how to do it so it's boring and reliable.

## 1. Verify the signature

Never trust a webhook payload you haven't verified — anyone who learns your URL could POST to it. Ollastack signs every delivery with `X-Ollastack-Signature` (HMAC-SHA256 of the raw body, using a secret you set on the webhook). Verify before doing anything with the body:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(req): boolean {
  const sig = req.headers["x-ollastack-signature"];        // e.g. "sha256=<hex>"
  const expected = "sha256=" + createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(req.rawBody)                                    // the RAW body, not parsed
    .digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);    // constant-time
}
```

Two things people get wrong: comparing the *parsed* body instead of the raw bytes (re-serialization changes the hash), and using `===` instead of a constant-time compare (timing leak). Use the raw body and `timingSafeEqual`.

## 2. Be idempotent — retries are a feature, not a bug

A reliable webhook system retries on failure. Ollastack retries failed deliveries on a backoff ladder (up to 5 attempts) — which means your endpoint may receive the **same submission more than once** (e.g. you returned a 500, processed it anyway, then got retried). Design for at-least-once delivery:

```js
// Dedupe on the submission id — store it, ignore repeats.
const submissionId = payload.submissionId;
if (await alreadyProcessed(submissionId)) return res.status(200).end();
await process(payload);
await markProcessed(submissionId);
res.status(200).end();
```

The rule: **make processing idempotent and return 200 quickly.** Anything non-2xx tells the sender to retry. Do slow work (emails, third-party calls) *after* acknowledging, or in a queue.

## 3. Return fast, fail loud

- **Return 2xx as soon as you've durably accepted the payload** — don't hold the connection open while you call three other APIs. A slow consumer causes timeouts that look like failures and trigger retries.
- **Return non-2xx only when you genuinely couldn't accept it** — that's your signal to the sender to retry, which is what you want for a transient DB blip.

## 4. Replay when you've fixed a bug

This is the part fire-and-forget webhooks can't do. When a downstream bug caused deliveries to fail (or you shipped a consumer fix and want to re-run a delivery), Ollastack keeps a full per-webhook delivery history and lets you **replay** the exact stored payload as a fresh delivery — original untouched, one immediate attempt, then the normal retry queue. No "can you re-send those 200 submissions?" emails.

## 5. Know what a delivery looks like

Every successful, non-spam submission POSTs a payload like:

```json
{
  "event": "submission.created",
  "formId": "…",
  "submissionId": "…",
  "createdAt": "2026-07-19T12:00:00Z",
  "data": { "name": "Ada", "email": "ada@example.com", "message": "…" }
}
```

Spam-flagged submissions don't fire the webhook (so you're not feeding junk downstream); a deleted submission fires a `submission.deleted` event if you subscribe to it.

## The checklist

- ✅ Verify `X-Ollastack-Signature` against the **raw** body with a constant-time compare.
- ✅ Dedupe on `submissionId` — assume at-least-once.
- ✅ Return 2xx fast; do slow work after acknowledging.
- ✅ Use the delivery history + **replay** instead of asking for re-sends.
- ✅ Don't subscribe to spam — it doesn't fire a webhook by design.

Need destinations you don't want to build (Sheets, Notion, HubSpot)? Wire the signed webhook into Zapier/Make/n8n. Want to add one? [Create a form](https://login.ollastack.com/register) and set a webhook URL in its settings — free tier included.
