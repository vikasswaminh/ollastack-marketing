---
draft: true
title: "Formspree migration pitfalls to avoid"
description: "Migrating off Formspree is a one-line change, but a few things bite: CC/BCC handling, recipient verification, spam-test wording, and skipping the cutover check."
date: 2026-08-20
updated: 2026-06-22
tags: ["migration", "formspree", "guide"]
author: "Ollastack"
readingTime: 7
wrappingUp:
  title: "Wrapping Up"
  paragraphs:
    - "Migrating off Formspree is largely a one-line endpoint swap, but avoiding common pitfalls ensures zero downtime or lost customer inquiries. Always verify the new endpoint and notifications before decommissioning legacy forms."
    - "Configure CC/BCC recipients directly in backend settings for safety, test with realistic inquiry copy rather than generic filler words, and export historical submissions for your archives."
relatedReading:
  - title: "Best Formspree Alternatives for Developers in 2026"
    url: "/blog/best-formspree-alternatives-for-developers"
    readTime: "12 min read"
  - title: "How to Build a Form Backend for a Static Site Without Writing a Server"
    url: "/blog/how-to-build-a-form-backend-for-a-static-site-without-writing-a-server"
    readTime: "21 min read"
  - title: "Form Webhooks Guide: Best Practices for Reliable Data Delivery"
    url: "/blog/form-webhooks-guide"
    readTime: "8 min read"
faq:
  - q: "What's the most common Formspree migration mistake?"
    a: "Skipping the cutover verification — deleting the Formspree form before confirming the new endpoint delivers the notification and fires the webhook. Always run a real test (and ideally both endpoints in parallel) first."
  - q: "Why isn't my _cc / _bcc working after migrating?"
    a: "By design, CC/BCC aren't read from public payloads — that would turn your form into an email relay. Set CC/BCC recipients in the form settings instead."
  - q: "Why did my test submission get flagged as spam?"
    a: "The literal word 'test' (and phrases like 'delivery test') scores as spam-shaped to the ML classifier. Use realistic enquiry text when testing, e.g. a real-sounding question."
---

<div class="tldr-box" id="tldr">
  <div class="tldr-header">TL;DR: The Quick Answer</div>
  <p>Moving off Formspree is a simple endpoint URL swap in your HTML form, but avoid common cutover mistakes: verify notifications before deleting the old form, configure CC/BCC in backend settings rather than public payload fields, and test using realistic text so spam filters don't flag test words.</p>
</div>

<div class="takeaways-box" id="key-takeaways">
  <div class="takeaways-header">Key Takeaways</div>
  <ul class="takeaways-list">
    <li><strong>Verify Before Deleting:</strong> Run end-to-end tests and parallel endpoints before decommissioning your old Formspree endpoint.</li>
    <li><strong>Secure CC/BCC Settings:</strong> Configure email routing in backend settings rather than client-side hidden fields to prevent email relay abuse.</li>
    <li><strong>Recipient Verification:</strong> Ensure destination email addresses are verified on the account before sending live traffic.</li>
    <li><strong>Realistic Test Content:</strong> Avoid submitting literal strings like "test" which trigger automated ML spam quarantine.</li>
  </ul>
</div>

Moving off Formspree is genuinely easy — swap the endpoint, keep your fields. But a handful of details trip teams up. Here are the pitfalls and how to sidestep each.

## 1. Deleting Formspree before verifying the cutover

The big one. Don't remove the Formspree form until you've confirmed the new endpoint works end to end:

1. Submit a real test from the live page and confirm it lands in the inbox.
2. Confirm the notification email actually arrived.
3. Trigger the webhook and confirm a delivery row.

Run both endpoints in parallel for a few days if you're cautious. The change is reversible until you delete the old form.

## 2. Expecting `_cc` / `_bcc` from the payload

Formspree lets some flows set CC/BCC. Ollastack deliberately **does not read CC/BCC from public payloads** — otherwise anyone could turn your form into an email relay. Set default CC/BCC in the **form settings** instead. (See [securing a form endpoint](/blog/secure-forms-honeypot-captcha).)

## 3. Forgetting the verified-recipient rule

A form can only notify an address **verified on the owning account**. If notifications don't arrive, the recipient probably isn't verified yet — verify it first. This is the anti-mail-bomb control, not a bug.

## 4. Testing with the word "test"

When you send a trial submission, don't put the literal word **"test"** (or "delivery test") in the body — the ML spam classifier genuinely scores those as spam-shaped and may quarantine them. Use realistic enquiry text like "I'd like pricing for a 12-person team." A `[Possible spam]` label on a literal "test" is correct behaviour, not a fault. (Background: [the ML quarantine model](/blog/ml-quarantine-explained).)

## 5. Honeypot field assumptions

If your Formspree markup relied on a honeypot, confirm how it maps over. Ollastack's optional honeypot is `_gotcha` — leave it empty in real markup; bots fill it and get filtered. It's free and adds zero friction, but it's optional (the spam pipeline runs regardless).

## 6. Field names in handlers and webhooks

The form fields carry over unchanged, but if a **serverless handler or webhook consumer** reads specific keys, double-check them — especially that webhook consumers now read fields under the `data` object. (See [migrating Formspree webhooks in Node](/blog/formspree-webhook-migration-node).)

## 7. Rate limits during a bulk backfill

If you script a large backfill of historical submissions, pace it — hammering the endpoint can trip rate limits. Use modest concurrency, and an idempotency key so a re-run doesn't duplicate rows.

## 8. Expecting history to move automatically

The cutover doesn't migrate past submissions. Export your Formspree history for your records; a one-click bulk import isn't a feature, so most teams keep the export as an archive and start the new endpoint fresh.
