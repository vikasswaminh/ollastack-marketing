---
title: "Test email in Docker and CI with a disposable inbox"
description: "Mailhog proves an email was sent, not delivered. Test real email from a Docker container or CI job with a disposable inbox over HTTP — create, wait, assert."
date: 2026-08-24
updated: 2026-08-24
tags: ["testing", "docker", "ci", "email"]
author: "Ollastack"
readingTime: 7
faq:
  - q: "How do I test email from inside a Docker container?"
    a: "Use a disposable inbox over HTTP rather than a local SMTP catcher: create an inbox via the API, point your app at its address, then long-poll the wait endpoint and assert on the extracted code or link. It needs only an OLLASTACK_API_TOKEN env var — no SMTP service in the compose file."
  - q: "Why not just use Mailhog or Mailpit?"
    a: "Mailhog/Mailpit catch SMTP locally, which proves your app tried to send — but not that mail actually delivers, authenticates, or renders for a real recipient. A real disposable inbox tests the true round-trip."
  - q: "Does it work in GitHub Actions or GitLab CI?"
    a: "Yes — it's plain HTTP, so it runs from any container or CI runner with just the API token as a secret. No service container to stand up."
---

You containerized your app and now your email tests are awkward: a local SMTP catcher (Mailhog, Mailpit) runs as another service and only proves your app *tried* to send. To test that email actually delivers and contains the right thing, use a **real disposable inbox over HTTP** — no SMTP service in your compose file.

## Why local SMTP catchers fall short

Mailhog and Mailpit are great for *seeing* outgoing mail in development. But they intercept SMTP locally, so they can't tell you whether mail actually:

- delivers to a real inbox,
- passes authentication (SPF/DKIM/DMARC),
- renders the right code or link for a recipient.

For a test that proves the real round-trip, you need a real inbox your container can read over HTTP.

## The pattern in a container

Pass an API token as an env var; everything else is HTTP, so there's nothing to add to `docker-compose.yml`:

```yaml
# docker-compose.yml (test)
services:
  app:
    build: .
    environment:
      - OLLASTACK_API_TOKEN=${OLLASTACK_API_TOKEN}
```

Inside the test (any language — Node shown):

```js
const API = "https://login.ollastack.com";
const h = { Authorization: `Bearer ${process.env.OLLASTACK_API_TOKEN}` };

// 1. disposable inbox
const inbox = await fetch(`${API}/api/mailboxes`, {
  method: "POST", headers: { ...h, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "ci", mode: "test" }),
}).then(r => r.json());

// 2. drive your app with inbox.address (sign up, reset, etc.)
await signup(inbox.address);

// 3. long-poll for the email and assert
const msg = await fetch(`${API}/api/mailboxes/${inbox.id}/wait?timeout=60`, { headers: h })
  .then(r => r.json());
expect(msg.codes[0]).toMatch(/^\d{6}$/);
```

No SMTP container, no port wiring — just the token. The `wait` endpoint long-polls, so the test isn't a flaky `sleep`, and `codes[]`/`links[]` are extracted so you don't scrape HTML.

## In GitHub Actions / GitLab CI

It's the same HTTP calls from a CI runner — add `OLLASTACK_API_TOKEN` as a secret:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      OLLASTACK_API_TOKEN: ${{ secrets.OLLASTACK_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```

No service container, no SMTP sink to maintain.

## Keep it isolated

- **One inbox per test** (or a `+tag` subaddress) so parallel jobs don't read each other's mail.
- **Bulk-clear** between runs and set a **retention window** so test mail purges itself.
- Test inboxes are **never spam-filtered**, so a strict transactional email is never dropped from under your assertion.

## The takeaway

In Docker or CI, skip the local SMTP catcher and test the real thing: a disposable inbox over HTTP, created and read with one token. It's the difference between "we tried to send" and "the email actually arrived and was correct." More in [the email testing API](/blog/email-testing-api-for-ci), [testing OTP in CI](/blog/test-otp-email-in-ci), and [the Mailosaur alternative](/blog/mailosaur-alternative).

[Get a test inbox](https://login.ollastack.com/register) — disposable, HTTP-readable, free to start.
