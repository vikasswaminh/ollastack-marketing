---
title: "How to Build a Form Backend for a Static Site Without Writing a Server"
description: "You don't need Express, a database, or a $5/month droplet just to catch a contact form. Here's exactly how to give a static site a real form backend — spam filtering, notifications, webhooks and all — without writing a line of server code."
date: 2026-08-19
updated: 2026-08-19
tags: ["forms", "static-site", "hugo", "astro", "webhooks", "ai-agents"]
author: "Ollastack"
readingTime: 21
faq:
  - q: "Do I need to know backend development to set this up?"
    a: "No — that's the entire point of this approach. Creating the form, copying the endpoint URL, and pasting it into your form's action attribute (or a fetch() call) requires only HTML and, optionally, a little JavaScript for a custom success state. Everything downstream — spam filtering, notification emails, storage — is handled by the service, with no server-side code of your own required unless you specifically want a webhook integration."
  - q: "Will this work with static site generators like Hugo, Astro, or Eleventy?"
    a: "Yes, without exception. These generators output plain HTML, CSS, and JavaScript at build time, and a form backend has no idea — and no reason to care — which generator produced the page it's receiving a submission from. Anywhere you can write a <form> tag or call fetch(), this works."
  - q: "What actually stops my form from filling up with spam?"
    a: "A layered pipeline: a honeypot field invisible to humans but visible to bots, IP and origin checks, keyword and link-density filters, a reputation service like Akismet, and typically a machine-learning classifier trained on real submission history. Crucially, a well-built system never silently deletes a submission it's only moderately unsure about — it quarantines and flags it, still delivering the notification, so a genuine inquiry is never lost to a false positive."
  - q: "Can I still get an email notification, or do I need to check a dashboard constantly?"
    a: "Email notifications are the default expectation, not an extra feature. You set a verified recipient address (or a few, depending on your plan's limits) in the form's settings, and a notification fires automatically the moment a real submission arrives. Dashboards are useful for history and for reviewing anything flagged as possible spam, but day-to-day, the email is what you actually rely on."
  - q: "What happens if I need the data somewhere other than my inbox — like a CRM or Slack?"
    a: "That's what webhooks are for. Register a URL in the form's settings, and every successful, non-spam submission gets POSTed to it, typically with an HMAC signature you can verify to confirm the request genuinely came from your form backend. Look for a service that shows you full delivery history and lets you retry (or \"replay\") a failed delivery, rather than one that fires the webhook once and gives up silently if your receiving endpoint happened to be down."
  - q: "Can an automated script or CI pipeline submit the form without getting flagged as a bot?"
    a: "On modern platforms, yes — mint a scoped API token in the dashboard and authenticate the submission with an Authorization: Bearer header. A submission made this way is treated as trusted: it bypasses the honeypot, CAPTCHA, and per-IP rate limiting that would otherwise apply to an anonymous request, and it's tagged in your dashboard so you can distinguish agent or script submissions from human ones."
  - q: "Is this actually secure enough for a form that handles sensitive information, like a job application?"
    a: "For most use cases, yes, provided the service supports the basics: restricted CORS origins, HMAC-signed webhooks, encrypted storage of any custom SMTP credentials, and file-type/size limits on uploads. If you're handling especially sensitive data — health information, payment details — check the specific service's compliance posture directly rather than assuming; that's also generally the point at which some custom server-side handling becomes worth the extra effort described earlier in this piece."
  - q: "What if I outgrow the free tier or need more than one form?"
    a: "Every major provider in this space has paid tiers that scale submission volume, recipient counts, and form counts upward — check the specific [pricing page](https://ollastack.com/pricing) for current limits, since these change more often than the underlying integration mechanics do. The good news is that moving between tiers, or even between providers later, doesn't touch your site's HTML beyond the endpoint URL itself."
---

Here's a scene that plays out a hundred times a day, on every corner of the web. Someone builds a beautiful, fast, static site — Hugo, Astro, Eleventy, plain HTML, doesn't matter which — and it's *great*. Pages load in a blink. There's no database to patch, no server to reboot at 2 a.m., no dependency-update Tuesday. Then they get to the contact page, or the newsletter signup, or the "request a demo" form, and they hit a wall: `<form>` tags need somewhere to send their data, and a static site, by definition, has nowhere for that data to go.

The instinctive fix is to spin up a tiny backend. A Node script. A Python function. Maybe a whole Express app with a database table just for messages. And that's where a lot of otherwise-sensible developers lose an afternoon (or a weekend) building infrastructure to solve what is, fundamentally, a five-minute problem.

This guide is about the other way: treating "form backend" as a solved problem you can plug into with [Ollastack](https://ollastack.com), the same way you'd plug into a CDN instead of writing your own edge network. We'll cover why static sites can't handle forms on their own, what a hosted form backend actually does under the hood, how to wire one up in minutes, and — because this is the part most tutorials skip — how to handle spam, notifications, webhooks, file uploads, and even AI agents submitting your forms, all without touching a server.

## Key Takeaways

- **Static sites lack runtimes:** Forms require a server endpoint listening for POST requests to validate and store data.
- **Hosted form backends bridge the gap:** Plug in an [Ollastack endpoint](https://ollastack.com) via the `<form action="...">` attribute or standard `fetch()`.
- **Layered spam defense is critical:** Rely on honeypots (`_gotcha`), origin verification, link checks, and ML filters that quarantine instead of deleting real leads.
- **Zero-code file uploads:** Handle multipart file uploads (resumes, attachments) without setting up S3 buckets or pre-signed URLs.
- **Automate with webhooks:** Relay form submissions directly to CRMs, Slack, or databases with secure HMAC signature verification.
- **First-class AI agent support:** Use scoped API tokens to allow AI agents, CI pipelines, and tests to submit without tripping bot defenses.

---

## Why a static site can't handle a form by itself

It's worth being precise about *why* this problem exists, because the answer shapes every decision that follows.

A static site is, at its core, a folder of files — HTML, CSS, JS, images — served exactly as they are. There's no runtime attached to it. When a browser loads `index.html`, nothing on the hosting side is "listening" for anything; it just hands over bytes. That's the entire reason static hosting is so fast and so cheap: there's no application server evaluating requests, no process to keep warm, nothing to scale.

A `<form>` element, on the other hand, is designed around the assumption that *something* is listening at the URL in its `action` attribute. When you click submit, the browser bundles up the field values and either navigates to that URL with the data in the query string (GET) or sends it as the request body (POST). Either way, it expects a response — ideally a 200 or a 302 redirect, not a 404 because nothing at that address knows what to do with a POST request.

So the mismatch is structural: forms assume a backend exists; static hosting guarantees one doesn't. You have exactly three ways to close that gap:

1. **Write and run your own backend** — a small API route, hosted somewhere with a runtime (a VPS, a serverless function you deploy yourself, a container). You own the code, the uptime, the security patches, and the 2 a.m. pager.
2. **Use your static host's built-in form handling**, if it has one — some platforms intercept form submissions at build time and store them for you. Convenient, but you're locked to that host and the feature set is usually thin.
3. **Point the form at a dedicated form-backend service like [Ollastack](https://ollastack.com)** — a hosted endpoint built specifically to receive form submissions, whose entire job is being the "something" that's listening. This is the option this guide is about.

Option 1 isn't hard exactly, it's just *disproportionate*. A form endpoint needs, at minimum: input validation, spam filtering, an email notification pipeline (which means dealing with SMTP, DKIM, SPF, and deliverability — a whole discipline on its own), some place to store submissions so you don't lose one if your inbox rule misfires, and ideally a way to see what happened when something goes wrong. That's a real, maintainable service — for a contact form. Most teams that go down this road either under-build it (no spam filtering, submissions vanish into a Gmail label nobody checks) or over-build it (a whole admin panel for twelve messages a month).

---

## What a hosted form backend actually is

Strip away the marketing language and a "form backend as a service" is refreshingly simple: it's a URL that accepts a POST request, does something useful with the payload, and gives you a response. The "something useful" is where all the value lives:

- It validates and stores the submission so nothing is lost.
- It filters spam using a layered pipeline (more on this below) so your inbox stays a leads list, not a junk drawer.
- It sends you a notification — email, and often a webhook — the moment a real submission arrives.
- It returns a sane response to the browser, either JSON for a JS-driven form or a redirect for a classic HTML one.

Because this is *all* the service does, it can do it well. Deliverability, spam classification, and retry logic for webhooks are each their own hard problems, and a dedicated form backend has usually solved them at a scale a single team's side project never will.

With [Ollastack](https://ollastack.com), the shape of the integration is nearly identical everywhere: you create a form in the [Ollastack dashboard](https://login.ollastack.com/register), you get an endpoint URL, you point your `<form action="">` at it, done. If you're comparing options or migrating from an older setup, the [Ollastack migration hub](https://ollastack.com/resources/migration-hub/) has a rundown of how to transition smoothly without downtime.

---

## The five-minute version

Let's do the simplest possible version first, because it really is this short. Say you've got a static contact page with this form:

```html
<form action="#" method="POST">
  <label>Name <input name="name" required /></label>
  <label>Email <input name="email" type="email" required /></label>
  <label>Message <textarea name="message" required></textarea></label>
  <button type="submit">Send</button>
</form>
```

Right now, that `action="#"` goes nowhere. Sign up for a form backend, create a form in its dashboard, and you'll get an endpoint that looks something like:

```
https://login.ollastack.com/api/submit/your-slug
```

Swap it in:

```html
<form action="https://login.ollastack.com/api/submit/your-slug" method="POST">
  <label>Name <input name="name" required /></label>
  <label>Email <input name="email" type="email" required /></label>
  <label>Message <textarea name="message" required></textarea></label>
  <button type="submit">Send</button>
</form>
```

That's it. That single-line change is the entire "backend" for your form. Submit it, and the service receives the name, email, and message fields, checks them against its spam pipeline, stores the submission, and emails you a notification. No server, no deploy, no database migration.

If you'd rather submit via JavaScript — say, to show an inline success message instead of navigating away — the same endpoint happily accepts a `fetch()` call with a JSON body:

```javascript
async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const payload = Object.fromEntries(new FormData(form));

  const response = await fetch(
    "https://login.ollastack.com/api/submit/your-slug",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (response.ok) {
    const data = await response.json();
    // { success: true, id: "sub_...", next: null }
    form.reset();
    showSuccessMessage();
  } else {
    showErrorMessage();
  }
}
```

Notice what *didn't* happen anywhere in that snippet: no API key baked into client-side JavaScript, no CORS server you had to configure, no database schema. The endpoint accepts `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data` interchangeably, so a plain `<form>` and a hand-rolled `fetch()` both work against the exact same URL without any translation layer on your end.

---

## Field conventions worth knowing

Most hosted form backends share a set of "magic" field-name conventions, inherited from the earliest players in this space and carried forward because there's no reason to reinvent them. Knowing them saves you from writing custom logic for things the endpoint already does:

| You want | Field name |
| :--- | :--- |
| Reply-To on the notification email | `_replyto` or an `email` field |
| Override the notification subject line | `_subject` |
| Redirect to a custom "thank you" page | `_next` |
| A honeypot trap for bots | `_gotcha` |

A quick and important caveat on the redirect field: a well-built backend will only honor `_next` if it points to an origin you've explicitly allowed for that form. Otherwise, anyone could submit your form with a `_next` value pointing at a phishing page and use your legitimate form endpoint as an open redirect. If a service lets you set `_next` to *anything* with no allow-list, that's a sign its security model hasn't been thought through — worth checking before you commit to it.

One deliberate restriction you'll run into on well-designed platforms: fields like `_cc` and `_bcc` generally aren't honored from the public payload, even though `_replyto` and `_subject` are. The reasoning is straightforward — if an anonymous visitor could set arbitrary CC/BCC recipients on your notification email, your public contact form becomes a free email relay for spammers, who will absolutely find and abuse it within days of your site going live. Recipients belong in your dashboard settings, not in a field a stranger can populate.

---

## Spam: the part that actually determines whether this works

Here's an uncomfortable truth: the moment you put a public form on the internet, bots will find it. Not eventually — usually within hours. Untargeted comment-spam and phishing bots crawl the web constantly looking for exactly this shape of thing: a `<form>` tag with an action URL. If your form backend's spam handling is an afterthought, your "form backend" project quietly turns into a "spam relay" project, and you won't notice until your notification inbox is unusable. For deeper insights on balancing friction and spam defense, see the [Ollastack form design guide](/blog/form-design-conversion).

A serious form backend runs submissions through several layers, roughly in this order:

1. **Honeypot fields.** A hidden input (like the `_gotcha` field mentioned above) that's invisible to real visitors via CSS but gets filled in by bots that blindly complete every field on a page. Any value in it is an instant, free, zero-false-positive signal.
2. **IP and origin checks.** Requests from known bad ranges, or from an origin that doesn't match any domain you've registered for the form, get rejected before they're even processed.
3. **Keyword and regex filters.** Catches the crude stuff — pharmaceutical spam, SEO link farms, the greatest hits of junk content.
4. **Excessive-link detection.** A message that's mostly URLs is a strong spam signal on its own, independent of what the URLs actually say.
5. **A third-party reputation service** (Akismet is the long-standing name here) that's seen enough spam across enough sites to catch patterns a single-site filter never would.
6. **An in-house ML classifier** trained on the platform's own submission history, catching the stuff that's slipped past everything above.

The layering matters more than any individual layer. No single check is reliable enough on its own — honeypots miss sophisticated bots, keyword filters miss spam in other languages, and ML classifiers occasionally misfire on legitimate messages that happen to look unusual. Stacking several *different kinds* of signal is what gets the false-positive rate low enough to trust.

And that last point deserves its own paragraph, because it's the single most important design decision in this whole space: a real inquiry should never be silently deleted. If a submission only trips the least certain layer — the ML classifier — the right move isn't to bin it, it's to *quarantine* it: still deliver the notification, just flag it clearly (something like a `[Possible spam]` prefix on the subject line), and let a human make the final call with one click. Compare that to a system that deletes anything it's unsure about — you'll never know a real customer inquiry existed at all. You just won't hear from them, and you'll never know why.

If you're evaluating form backends, this is worth testing directly before you commit: submit something borderline through the form (a short message with a link in it, say) and see what actually happens to it. Does it show up anywhere, even flagged? Or does it just disappear? That answer tells you more about the product than any feature list will.

---

## Notifications: getting the message where it needs to go

A form that captures spam-free submissions but never tells anyone about them isn't much better than one that doesn't work at all. Notification setup is usually a dashboard task rather than a code task, but there are a few things worth understanding so you don't get surprised later.

- **Recipient verification.** Most services require you to verify any address you want notifications sent to. This feels like friction the first time you hit it, but it's the anti-abuse control that stops someone from using a form backend to mail-bomb a stranger's inbox by pointing a form at it — without verification, anyone could set *your* email as a form's recipient and spam you through a form they built. Verify your address once, and it's done.
- **Recipient limits by plan.** Free tiers commonly cap the number of To/CC/BCC recipients on a single notification (two is a typical number), with paid plans allowing more. If your team has a shared inbox plus two individuals who all want a copy, check the limit before you build a whole distribution around it.
- **Sender identity.** By default, your notification emails will usually come from the platform's own sending domain, which is fine for a lot of use cases but can look slightly off-brand or trip a recipient's spam filter if your organization has strict DMARC policies. If deliverability and brand consistency both matter to you, look for a custom sender domain or bring-your-own-SMTP option via the [Ollastack deliverability hub](https://ollastack.com/resources/deliverability-hub/), so notifications arrive as `hello@yourdomain.com` rather than `no-reply@the-form-service.com`. A well-built platform will also fail over gracefully to its own sender if your custom SMTP credentials have a problem, so a misconfigured mail server doesn't mean your notifications silently vanish.

---

## Webhooks: connecting the form to everything else

Email notifications are great for a human checking an inbox. They're a poor fit for "add this lead to our CRM" or "post a message in our team Slack the second someone books a demo." That's what webhooks are for, and it's one area where a hosted form backend can genuinely outperform a backend you'd write yourself in an afternoon. Explore the [Ollastack developer hub](https://ollastack.com/resources/developer-hub/) and [Ollastack webhook documentation](https://ollastack.com/docs#webhooks) for end-to-end recipes.

The pattern is standard: you register a URL in your form's settings, and every successful, non-spam submission triggers a POST to it with the submission payload as the body. The part worth paying attention to is the signature verification, because you want to be sure a webhook actually came from your form backend and not from someone who guessed your endpoint URL.

```javascript
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyWebhook(headers, rawBody, secret) {
  const signatureHeader = headers["x-ollastack-signature"]; // "sha256=<hex>"
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const provided = Buffer.from(signatureHeader.split("=")[1], "hex");
  const computed = Buffer.from(expected, "hex");

  return (
    provided.length === computed.length &&
    timingSafeEqual(provided, computed)
  );
}
```

That's a standard HMAC verification — compute the same hash on your side using a shared secret, compare it to the header the request arrived with, and reject anything that doesn't match. It's a small amount of code, and notably, it's the *only* server-side code this entire setup requires — and only if you actually want a webhook integration. If all you need is email notifications, you don't write any of this.

The other thing to look for is what happens when your webhook receiver has a bad five minutes — your server redeploys mid-request, or a downstream API you call from the webhook handler times out. A well-built form backend retries failed deliveries on a backoff schedule (several attempts spread over increasing intervals, rather than five instant retries that just hit the same downtime), and — this is the feature that saves you real debugging time — keeps a full delivery history per webhook, including the raw payload of every attempt, so you can inspect exactly what was sent and when. The best implementations add a Replay button: fix the bug in your receiving endpoint, then re-send the *exact* stored payload from the failed delivery instead of asking the customer to resubmit their form. That single feature is the difference between "we lost a lead because our webhook handler had a typo" and "we fixed the typo and replayed the delivery two minutes later."

---

## File uploads without a file server

Contact forms are simple. Resumes attached to a job application form, or screenshots attached to a bug report form, are a different animal — now you need somewhere to actually store binary files, not just text fields.

Most hosted form backends handle this the same way they handle text: accept `multipart/form-data`, store the file in the submission record, and give you a link to download it from the dashboard (often with size and file-type limits enforced automatically, which is itself a spam-and-abuse control worth having — an unrestricted upload field is an invitation for someone to try uploading something you really don't want stored on your infrastructure). Practically, this means the HTML doesn't change much from a plain form:

```html
<form
  action="https://login.ollastack.com/api/submit/your-slug"
  method="POST"
  enctype="multipart/form-data"
>
  <input name="name" required />
  <input name="email" type="email" required />
  <input name="resume" type="file" accept=".pdf,.doc,.docx" required />
  <button type="submit">Apply</button>
</form>
```

Add `enctype="multipart/form-data"`, add a `type="file"` input, and the rest of the flow — spam filtering, notification, webhook — works exactly as it did for a text-only form. There's no separate object-storage bucket to provision, no signed-URL logic to write, no lifecycle policy to configure for old uploads. That's arguably where a hosted form backend earns its keep the most, because "build your own file upload pipeline" is a considerably bigger undertaking than "build your own text form handler."

---

## The 2026 wrinkle: forms submitted by AI agents

This is a genuinely new problem, and it didn't exist in most people's mental model of "form backends" even two or three years ago. Increasingly, the thing filling out a form isn't a human clicking through a browser — it's an autonomous agent booking a demo on a company's behalf, a monitoring script confirming a status page's contact form still works, or a CI pipeline running an end-to-end test suite against a staging site every deploy.

A classic spam pipeline treats all of these exactly like a bot, because structurally, they *are* bots — no mouse movement, no realistic typing cadence, submissions that arrive in milliseconds. That's a problem if the "bot" submitting your form is actually a legitimate agent acting for a real customer, or your own test suite validating the form still works after a deploy.

The fix modern form backends have converged on is a scoped API token. You mint a token in your dashboard, and any submission authenticated with `Authorization: Bearer <token>` is treated as trusted rather than anonymous — it skips the honeypot check, the CAPTCHA (if you have one configured), and the per-IP rate limit that would otherwise throttle a script hammering the endpoint during a test run. Submissions made this way get tagged with the token's identity in your dashboard, so you can tell at a glance which entries came from a human on your site versus an automated process, without them getting mixed up or, worse, one getting mistakenly filtered as spam. Read the [Ollastack agent documentation](https://ollastack.com/docs/agents) and our in-depth analysis on [Ollastack safe AI agent form submission](/blog/can-ai-agents-submit-forms-safely) if this is relevant to your setup — you can also see [why forms break for LLMs](/blog/form-backend-for-ai-agents) and explore [Ollastack email inboxes for AI agents](/blog/email-for-ai-agents).

Agents also benefit from being able to discover the entire API surface programmatically rather than needing a human to read documentation and hand-write integration code — a machine-readable spec at a predictable URL (the [Ollastack OpenAPI document](https://ollastack.com/docs/api), typically) lets an agent figure out what fields a form expects and how to submit to it, without a person in the loop at all.

---

## CORS, allowed origins, and other security basics

Because your form is submitting from a browser running on someone else's machine, cross-origin behavior matters, even though — helpfully — you rarely have to configure it by hand. A well-built form backend already knows the origin(s) you registered for a given form (the domain your site is served from) and sets its CORS headers accordingly, rejecting a `fetch()` call from an origin it doesn't recognize before it ever reaches your spam pipeline or your notification logic. If you switch domains, or add a staging subdomain, you'll usually need to add it to the form's allowed-origins list in the dashboard — a two-minute settings change, not a code change.

The other basic worth checking is rate limiting per IP address, independent of the spam classifier. This catches a different failure mode: not "this content is spam," but "this single visitor (or misbehaving script) is hammering the endpoint," which is worth throttling regardless of what's in the payload. Combined with the honeypot and the layered spam pipeline described earlier, this is what stops a static contact form from ever becoming a liability, even though there's no server of yours actually sitting between the internet and the form's logic.

---

## Multi-step forms and custom redirects

Not every form is a single page with a submit button. Multi-step forms — a qualifying question, then contact details, then a scheduling widget — are common for anything sales-adjacent, and they're entirely compatible with this approach, because from the form backend's point of view, a multi-step form is just a form whose fields happen to be spread across a JavaScript-managed wizard instead of one HTML page. As long as the final step assembles all the collected fields into one `fetch()` call (or one classic `<form>` submission), the backend handles it exactly like any other submission.

The redirect field mentioned earlier (`_next`) is what most classic HTML-only forms use to send a visitor to a "thank you" page after a successful submission, without any client-side JavaScript at all:

```html
<form action="https://login.ollastack.com/api/submit/your-slug" method="POST">
  <input type="hidden" name="_next" value="https://yoursite.com/thanks" />
  <input name="email" type="email" required />
  <button type="submit">Subscribe</button>
</form>
```

If you're building the multi-step version in JavaScript instead, you'll typically read the `next` value back from the JSON response (`{ success: true, id: "sub_...", next: <url|null> }`) and perform the navigation yourself with `window.location.href = data.next`, which gives you the option to show a success animation first, or route to a different page depending on which "step" the visitor came from.

---

## Testing before you trust it

Before you point a real, public-facing form at any backend — hosted or homegrown — run through a short verification pass. It costs ten minutes and it's the difference between finding a misconfiguration yourself versus a customer finding it for you:

- Submit a real test entry through the live page, not through a dashboard "test submission" button, since the two can behave differently if your form's HTML has a typo in a field name.
- Confirm the notification email actually arrived, not just that the dashboard shows the submission — deliverability issues are invisible unless you specifically check for them.
- Trigger the webhook, if you've configured one, and confirm a delivery row appears with the payload you expect.
- Deliberately try to break the honeypot — submit through your browser's dev console with the hidden field populated, and confirm it gets flagged rather than silently accepted.
- Check what a borderline submission does — something with a link in the message, say — and make sure it's quarantined and visible rather than deleted outright, per the "never silently drop a real lead" principle from earlier in this piece.

If you're automating this as part of a CI/CD pipeline or browser test suite, check out our walkthroughs on [asserting on emails in Playwright and Cypress](/blog/assert-on-email-in-playwright-cypress) as well as [testing emails in Docker with disposable inboxes](/blog/test-inbox-docker).

If you're migrating an existing form from one backend to another rather than starting fresh, it's worth running both endpoints in parallel for a few days before decommissioning the old one — point a hidden test form at the new endpoint, confirm everything works end to end, and only then cut the live form over. The [Ollastack migration hub](https://ollastack.com/resources/migration-hub/) has step-by-step cutover checklists and migration recipes.

---

## A complete worked example

Let's put the whole thing together — a realistic contact form, with a honeypot, JS-driven submission, and a success state, wired entirely to a hosted endpoint. No backend code below is anything you deploy; the only "server" involved is the third-party endpoint.

```html
<form id="contact-form">
  <label>Name
    <input name="name" required />
  </label>

  <label>Email
    <input name="email" type="email" required />
  </label>

  <label>Message
    <textarea name="message" required></textarea>
  </label>

  <!-- honeypot: hidden from real visitors via CSS, filled in by bots -->
  <input
    type="text"
    name="_gotcha"
    style="display:none"
    tabindex="-1"
    autocomplete="off"
  />

  <button type="submit">Send message</button>
</form>

<p id="form-status" role="status"></p>

<script>
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const endpoint = "https://login.ollastack.com/api/submit/your-slug";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending…";

    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.reset();
        status.textContent = "Thanks — we'll get back to you shortly.";
      } else {
        status.textContent = "Something went wrong. Please try again.";
      }
    } catch (error) {
      status.textContent = "Network error. Please try again.";
    }
  });
</script>
```

Walk through what this buys you, top to bottom: a real contact form, spam-filtered, notification-driven, with an inline success message and no page reload — built with a form tag, a script tag, and one URL. Every piece of the "hard part" — deliverability, spam classification, storage, security headers — lives entirely on the other side of that URL.

---

## When you actually do need a real server

None of this is an argument that you should never write a backend — it's an argument that a contact form is rarely the reason to start. A few situations genuinely do call for your own server-side code, and it's worth being honest about where that line sits:

- **Custom business logic on submission:** Checking inventory before confirming an order, calculating a real-time quote, or writing to an internal system with rules too specific for a generic webhook to express.
- **Direct payment processing:** Processing credit cards directly brings its own compliance surface (PCI scope, in particular) that a form backend isn't designed to handle for you.
- **Enterprise pipelines:** Submission volume and complexity genuinely warranting a bespoke pipeline — very large enterprises with dedicated data-processing requirements sometimes are past the point where a general-purpose tool is the right fit.
- **Proprietary internal systems:** Submissions need to feed directly into a legacy internal system with no webhook-friendly API on the receiving end at all.

Even in these cases, a common pattern is to use a hosted form backend for the *front door* — validation, spam filtering, the honeypot, the notification — and have its webhook trigger your custom logic downstream, rather than reimplementing spam filtering and deliverability from scratch just to get to the one piece of genuinely custom logic you actually needed.

---

## The bigger picture

Static sites won an argument that used to be genuinely contentious: for the vast majority of content-driven sites, you don't need a server humming along 24/7 just to serve pages. Forms were the last real gap in that argument — the one place where "static" seemed to force your hand back toward a runtime. Hosted form backends close that gap cleanly, and they do it by being *narrowly* good at one thing rather than broadly mediocre at everything a general-purpose backend would need to be.

The practical upshot: the next time you're staring at a `<form>` tag on a static site wondering what to put in the `action` attribute, resist the urge to reach for a framework. Point it at an endpoint built for exactly this job, spend your afternoon on something your site actually needs, and let someone else worry about SPF records and retry backoffs. If you want to see the whole flow live before committing anything, [create a form on Ollastack](https://login.ollastack.com/register) — most services, Ollastack included, have a [free tier](https://ollastack.com/pricing) generous enough to fully evaluate the fit before you touch a paid plan.

---

## Related reading
- [Ollastack Form Engine for AI Agents & LLMs](https://ollastack.com/blogform-backend-for-ai-agents)
- [Ollastack Form Migration and Cutover Hub](https://ollastack.com/resources/migration-hub/)
- [Ollastack Form Backend API & Webhook Specs](https://ollastack.com/docs/api)
- [Ollastack Form Design: High Conversion & Zero Spam](https://ollastack.com/blogform-design-conversion)
- [Can AI Agents Submit Forms Safely with Ollastack?](https://ollastack.com/blogcan-ai-agents-submit-forms-safely/)
- [Ollastack Agent Inboxes: Give AI Agents Their Own Email](https://ollastack.com/blogemail-for-ai-agents)
