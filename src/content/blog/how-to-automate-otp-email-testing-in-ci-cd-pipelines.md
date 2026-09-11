---
title: "How to Automate OTP Email Testing in CI/CD Pipelines"
description: "The practical guide to testing email verification flows with isolated inboxes, Email APIs, Playwright, Cypress, Selenium, CI workflows, and secure parallel execution."
date: 2026-08-28
updated: 2026-08-28
tags: ["email-testing", "ci-cd", "playwright", "cypress", "selenium", "otp"]
author: "OllaStack Team"
readingTime: 18
faq:
  - q: "What is OTP email testing?"
    a: "OTP email testing verifies that an application generates, delivers, retrieves, and accepts a one-time password sent by email. It can be performed manually, but automation is useful for CI/CD because it allows every deployment to verify the complete authentication flow."
  - q: "How do you automate OTP verification?"
    a: "Create an isolated test inbox, trigger the OTP flow, retrieve the email through an API or controlled mailbox, extract the code, submit it in the browser, and verify the resulting application state."
  - q: "How do you test OTP emails in Playwright?"
    a: "Use Playwright for browser actions and an Email API or controlled test inbox for email retrieval. Create a unique inbox for the test worker, retrieve the expected message, extract the OTP, and submit it through the browser."
  - q: "How do you test OTP emails in Cypress?"
    a: "Use a Cypress command or task to communicate with the Email API. Retrieve the test email, extract the OTP, return it to the browser test, and submit the code."
  - q: "How do you test OTP emails in Selenium?"
    a: "Use Selenium to control the browser and an HTTP client such as Python requests to retrieve the OTP from an Email API."
  - q: "Can you test OTP emails without Gmail?"
    a: "Yes. You can use dedicated Email APIs, temporary test inboxes, mock SMTP, controlled corporate mailboxes, IMAP, and webhook-based email delivery. A personal Gmail account is not required."
  - q: "What is the best approach for CI/CD OTP testing?"
    a: "For full E2E staging tests, an authenticated Email API with isolated test inboxes is a practical option. For local integration tests, mock SMTP is usually faster and simpler."
  - q: "How do you prevent OTP tests from interfering with each other?"
    a: "Give each test worker or test run a unique email address or mailbox. Do not use one shared static inbox for parallel tests."
  - q: "How do you test magic links?"
    a: "Retrieve the email, extract the expected application URL, validate the domain, open the link through the browser test, and verify the resulting authenticated state."
  - q: "How do you keep OTP test data secure?"
    a: "Use staging-only accounts and domains, short mailbox retention, scoped API tokens, CI secret storage, automatic cleanup, and safe logging. Never expose OTP values, API tokens, passwords, or authentication links in CI logs."
---

## Quick Answer

To automate OTP email testing in CI/CD, use a dedicated test inbox or [Email API](/email-api) instead of a personal Gmail or Outlook account. Generate a unique email address for each test run, trigger the OTP email, retrieve the message programmatically, extract the verification code, and submit it through your browser automation framework.

The basic workflow is:

`Create isolated test inbox ↓ Create/register test user ↓ Trigger OTP email ↓ Retrieve email ↓ Extract OTP ↓ Submit OTP ↓ Verify successful authentication`

For most CI/CD end-to-end tests, an [Email API](/email-api) with isolated inboxes is a practical approach because the test can access messages programmatically without requiring a person to open an inbox.

---

<div class="takeaways-box" id="key-takeaways">
  <div class="takeaways-header">Key Takeaways</div>
  <ul class="takeaways-list">
    <li><strong>OTP email testing should validate the real verification flow</strong> instead of disabling OTP checks in staging.</li>
    <li><strong>Shared Gmail, Outlook, or other consumer inboxes</strong> can introduce delivery delays, authentication problems, spam filtering, and test collisions.</li>
    <li><strong>A dedicated <a href="/email-api">Email API</a></strong> can provide controlled, programmatic access to test messages.</li>
    <li><strong>Give each parallel CI worker a unique email address or mailbox.</strong></li>
    <li><strong>Retrieve the email using an API or webhook</strong> rather than relying on manual inbox access.</li>
    <li><strong>Prefer plain-text email when available</strong> because it is generally easier to parse.</li>
    <li><strong>For HTML emails, use stable selectors or DOM parsing</strong> instead of searching raw HTML for arbitrary numbers.</li>
    <li><strong>Test OTP expiration, resend behavior, invalid codes, and single-use behavior</strong> where those are part of the application requirements.</li>
    <li><strong>Store API keys and test credentials in CI secrets.</strong></li>
    <li><strong>Use mock SMTP for fast local integration testing</strong> and a real staging email flow for end-to-end testing.</li>
    <li><strong>Keep OTP values, authentication links, and other sensitive test data</strong> out of CI logs and screenshots.</li>
  </ul>
</div>

## What Is OTP Email Testing?

OTP email testing verifies that an application can correctly generate, send, receive, parse, and accept a one-time password delivered through email.

OTP verification is commonly used during:
- Account registration
- Email verification
- Login authentication
- Password recovery
- New-device verification
- Security-sensitive account changes
- Passwordless authentication
- Multi-factor authentication

A basic manual flow is simple:
1. Enter an email address.
2. Click Send OTP.
3. Open the email inbox.
4. Copy the OTP.
5. Enter the OTP into the application.
6. Continue after successful verification.

Automating this process is more complicated because the OTP exists outside the browser. The browser automation tool can control the web page, but it cannot automatically know when an external email arrives unless you give the test an email retrieval mechanism.

That creates an additional workflow:

`Browser ↓ Application ↓ Email service ↓ Test inbox ↓ Email API ↓ Test runner ↓ Browser`

A reliable OTP test therefore needs to coordinate both the browser and the email system. The goal is not simply to check whether an email exists. A useful test should verify that the complete verification journey works.

---

## Why OTP Email Tests Fail in CI/CD

Browser automation is generally predictable. A test can:
`Open page → Enter email → Click button → Check result`

Email introduces asynchronous behavior. The application sends a message. The email service processes it. The message becomes available in a mailbox. The test then needs to locate the correct message and extract the correct OTP before the code expires.

Any part of that chain can fail.

### Common causes of failure

1. **Email delivery is asynchronous**  
   The OTP may not appear immediately. A test that expects the message instantly can fail even though the application eventually sends it successfully.

2. **The wrong email is selected**  
   If the inbox contains multiple OTP messages, a test might retrieve an older code. This becomes particularly problematic when a user clicks *Resend OTP*.

3. **Tests share one inbox**  
   Suppose four Playwright workers run simultaneously. All four tests use `test@example.com`.
   - Worker 1 requests OTP A.
   - Worker 2 requests OTP B.
   - Worker 3 requests OTP C.
   - Worker 4 requests OTP D.  
   If all four read from the same mailbox, there is no guarantee that Worker 2 will retrieve OTP B. The result is a flaky test even though the application itself may be working correctly.

4. **The OTP expires**  
   OTP codes usually have a limited lifetime. If the CI runner is slow, the email service is delayed, or the test waits too long before submitting the code, the OTP may no longer be valid.

5. **Email parsing is fragile**  
   A six-digit regular expression can accidentally match:
   - A tracking number
   - A date
   - An order number
   - A CSS value
   - An unrelated number in an HTML email

6. **Consumer email authentication changes**  
   A test that depends on a personal Gmail or Outlook account can break because of:
   - Authentication changes
   - Password changes
   - MFA requirements
   - Provider restrictions
   - Rate limits
   - Spam filtering
   - Account security policies  
   This creates another dependency that has nothing to do with the application being tested.

---

## Best Ways to Test OTP Emails Automatically

There are several approaches to automated OTP email testing.

| Approach | CI Reliability | Speed | Best Use | Main Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **Dedicated [Email API](/email-api) + isolated inboxes** | High | Fast | CI/CD E2E tests | External API dependency |
| **SMTP/IMAP** | Medium | Medium | Corporate mail workflows | Polling and maintenance |
| **Mock SMTP** | Very High | Very Fast | Local integration tests | Doesn't validate real delivery |
| **Webhooks** | High | Very Fast | Event-driven CI | Requires webhook infrastructure |

### Dedicated Email API
An [Email API](/email-api) gives your test runner programmatic access to test messages. A typical flow is:
`Create inbox → Get inbox credentials → Trigger OTP → Query API → Receive email → Extract OTP → Continue browser test`
This approach is particularly useful for CI/CD because there is no human involved.

### SMTP and IMAP
SMTP and IMAP can be useful when you specifically need to test your organization's existing mail infrastructure. However, they often require more configuration and credential management. Polling a mailbox can also introduce delays.

### Mock SMTP
Mock SMTP is excellent for local development and fast integration tests. The application can send an email to a local mail server, and the test can inspect the message. The advantage is speed. The limitation is that it does not prove the complete real-world delivery path.

### Webhooks
A webhook-based system can notify your test infrastructure when a message arrives. Instead of repeated polling loops (`Check → Wait → Check → Wait`), the workflow becomes:
`Email arrives ↓ Webhook event ↓ Test receives notification ↓ OTP extracted`
This can be useful for high-volume parallel testing.

---

## Which OTP Testing Approach Should You Choose?

- For full **CI/CD end-to-end testing**, a dedicated [Email API](/email-api) with isolated test inboxes is a practical option.
- For **local integration tests**, mock SMTP is usually simpler and faster.
- For tests that specifically need to validate a corporate mailbox workflow, **SMTP/IMAP** may be appropriate.
- For **high-speed event-driven pipelines**, webhooks can reduce polling.

The important thing is to choose the approach based on what the test needs to prove. If the purpose is simply to test OTP generation, you may not need a real email at all. If the purpose is to verify the complete user experience, your E2E test should include the email step.

---

## How to Automate OTP Email Testing

A reliable OTP automation workflow can be divided into six steps.

### Step 1: Create an Isolated Test Inbox
Create a unique email address for each test or CI worker. For example:
- `otp-build123-worker0@example.test`
- `otp-build123-worker1@example.test`
- `otp-build123-worker2@example.test`

The exact format does not matter. What matters is that the test can clearly associate the inbox with its current execution.

```javascript
const workerIndex = process.env.TEST_WORKER_INDEX || "0";
const uniqueRunId = `${Date.now()}-w${workerIndex}`;
const testEmail = `test-user-${uniqueRunId}@sandbox.example.test`;
```

If your Email API supports temporary inboxes, create the inbox when the test begins. Delete it after the test finishes. Short mailbox retention also prevents old authentication messages from accumulating.

### Step 2: Trigger the OTP Email
Use your browser automation framework to perform the actual user action.

```javascript
await page.goto(`${BASE_URL}/register`);
await page.fill('input[name="email"]', testEmail);
await page.fill('input[name="password"]', process.env.TEST_PASSWORD);
await page.click('button[type="submit"]');

await expect(page.getByRole('heading', { name: /verify/i })).toBeVisible();
```

The important point is that the application should send the OTP through the staging email flow that you actually want to validate.

### Step 3: Retrieve the Email
After triggering the OTP, the test needs to retrieve the message. A simple polling helper might look like this:

```javascript
async function waitForEmail(inboxId, token, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const response = await fetch(
      `${EMAIL_API_URL}/inboxes/${inboxId}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.ok) {
      const messages = await response.json();
      if (messages.length) {
        return messages[0];
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for OTP email");
}
```

Notice the timeout. Never allow the test to poll indefinitely. A failed email service should result in a clear CI failure rather than a job that hangs forever.

### Step 4: Identify the Correct Message
Do not automatically assume that the first email is the correct email. Filter messages using available information. Useful filters include:
- Recipient
- Sender
- Subject
- Timestamp
- Message ID
- Test-specific identifier

For example:
- **Recipient:** `otp-build123-worker0@example.test`
- **Sender:** `no-reply@staging.example.com`
- **Subject:** `Verify your email address`

If your application can include a test-specific identifier, use it. This makes message selection much more reliable.

### Step 5: Extract the OTP
The simplest case is a plain-text email:  
`Your verification code is 482913.`

A parser could use:

```javascript
function extractOtp(body) {
  const labeled = body.match(
    /(?:verification code|security code|otp|passcode)\s*(?:is|:|=)?\s*([0-9]{4,8})/i
  );
  if (labeled) {
    return labeled[1];
  }
  const fallback = body.match(/\b([0-9]{6})\b/);
  return fallback ? fallback[1] : null;
}
```

However, the labeled pattern should be preferred. A generic six-digit search should be a fallback rather than the primary method.

### Step 6: Submit and Verify the OTP
Once the OTP has been extracted:

```javascript
const email = await waitForEmail(inboxId, inboxToken);
const body = email.textBody || email.htmlBody || "";
const otp = extractOtp(body);

if (!otp) {
  throw new Error("OTP code not found in email");
}

await page.fill('input[name="otpCode"]', otp);
await page.click('button[type="submit"]');
```

Then verify the final application state:

```javascript
await expect(page).toHaveURL(/dashboard/);
await expect(page.getByText(/welcome/i)).toBeVisible();
```

The final assertion is important. You do not want a test that only proves an email arrived. You want a test that proves the user can actually complete verification.

---

## How to Test OTP Emails with Playwright

[Playwright](https://playwright.dev/) works well for OTP testing because browser actions and API requests can be combined in the same test workflow.

A reusable test can look like this:

```javascript
import { test, expect } from '@playwright/test';

test('user can verify email with an OTP', async ({ page }) => {
  const inbox = await createTestInbox();
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[name="email"]', inbox.email);
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD);
  await page.click('button[type="submit"]');

  const message = await waitForEmail(inbox.id, inbox.token);
  const otp = extractOtp(message.textBody || message.htmlBody || '');
  if (!otp) {
    throw new Error('OTP not found');
  }

  await page.fill('input[name="otpCode"]', otp);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

The best practice is to keep mailbox creation, email retrieval, and OTP parsing in reusable helpers. That keeps individual E2E tests readable.

---

## How to Test OTP Emails with Cypress

[Cypress](https://www.cypress.io/) can use a custom command or task to retrieve the email. For example:

```javascript
Cypress.Commands.add('fetchOTP', (inboxId, token) => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('EMAIL_API_URL')}/inboxes/${inboxId}/messages`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(response => {
    const body = response.body[0]?.textBody || '';
    const match = body.match(
      /(?:verification code|otp|passcode)\s*(?:is|:|=)?\s*([0-9]{4,8})/i
    );
    if (!match) {
      throw new Error('OTP not found');
    }
    return match[1];
  });
});
```

The exact API integration depends on your email provider. The important architectural pattern is:
`Cypress ↓ Email API ↓ Test inbox ↓ OTP ↓ Cypress browser flow`

---

## How to Test OTP Emails with Selenium

[Selenium](https://www.selenium.dev/) can use a standard HTTP client for email retrieval. For example, with Python:

```python
import os
import re
import requests

def fetch_otp(inbox_id, token):
    response = requests.get(
        f"{os.environ['EMAIL_API_URL']}/inboxes/{inbox_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    response.raise_for_status()
    body = response.json()[0].get("textBody", "")
    match = re.search(
        r"(?:verification code|otp|passcode)\s*(?:is|:|=)?\s*([0-9]{4,8})",
        body,
        re.I,
    )
    if not match:
        raise RuntimeError("OTP not found")
    return match.group(1)
```

Selenium controls the browser while the HTTP client handles email retrieval.

---

## Parsing OTP Emails Reliably

Email parsing is one of the areas where automated tests can become fragile. An email can contain:
- Plain text
- HTML
- CSS
- Tracking URLs
- Hidden elements
- Images
- Multiple numeric values
- MIME parts

A regex across the entire raw HTML document may therefore produce the wrong result.

### Prefer structured selectors
If you control the email template, consider adding a stable identifier:

```html
<span data-testid="otp-code">482913</span>
```

The test can then target that element. This is more reliable than depending on the exact wording of the email.

---

## Plain Text vs HTML Email

### Plain Text
Plain text is generally easier to parse:
```
Your verification code is 482913. This code expires in 10 minutes.
```
There are fewer unrelated values to confuse the parser.

### HTML
HTML can be visually attractive but technically more complicated:
```html
<div class="email">
  <p>Your verification code is:</p>
  <strong data-testid="otp-code">482913</strong>
</div>
```

Use an HTML parser when necessary. Example with [Cheerio](https://cheerio.js.org/):

```javascript
import * as cheerio from 'cheerio';

function extractOtpFromHtml(html) {
  const $ = cheerio.load(html);
  const explicit = $('.otp-code, #verification-code, [data-testid="otp-display"]')
    .first()
    .text()
    .trim();
  if (/^\d{4,8}$/.test(explicit)) {
    return explicit;
  }
  return extractOtp($('body').text());
}
```

---

## Handling Different OTP Lengths

Not every application uses six-digit codes. Some systems use:
- Four digits
- Six digits
- Eight digits
- Alphanumeric verification codes

If your application has a known OTP format, make the parser match that exact format:

```javascript
function extractSixDigitOtp(body) {
  const match = body.match(/\b\d{6}\b/);
  return match ? match[0] : null;
}
```

A generic parser should not assume six digits unless the application actually uses six digits.

---

## Testing Magic Links

Email verification does not always use numeric OTPs. Some applications send a magic link instead.

The testing workflow is similar:
`Trigger verification ↓ Retrieve email ↓ Extract link ↓ Validate expected domain ↓ Open link ↓ Verify authenticated state`

Example helper:

```javascript
function extractMagicLink(body, host) {
  const pattern = new RegExp(`https?://${host}/[^"\\s<]+`, 'i');
  return body.match(pattern)?.[0] || null;
}
```

Always validate the domain before opening an extracted link. This prevents a malformed or unexpected message from causing the test to navigate somewhere unintended.

---

## Testing Localized OTP Emails

If your application supports multiple languages, email verification should be tested across the supported locales:
- English → OTP email
- Hindi → OTP email
- French → OTP email
- German → OTP email

Avoid writing tests that depend entirely on English text. Instead of searching for `"Your verification code is"`, prefer `[data-testid="otp-code"]` or another stable selector. This reduces test maintenance when marketing copy or translations change.

---

## Testing OTP Resend

Resend functionality deserves its own test. A common flow is:
`Request OTP A ↓ Receive OTP A ↓ Click Resend ↓ Receive OTP B ↓ Submit OTP B`

If your application's rules invalidate OTP A after the resend, also verify:
- **OTP A** → rejected
- **OTP B** → accepted

This catches a common state-management problem where multiple active OTPs are incorrectly accepted.

---

## Testing OTP Expiration

Expiration should also be tested:
`Generate OTP ↓ Wait until expiration ↓ Submit OTP ↓ Expect rejection`

However, do not make CI wait several minutes simply to test expiration. If your staging environment provides a test-only expiration configuration or controllable clock, use it. For example, a staging configuration might use a short test expiration window while production uses the normal value. The important requirement is to keep the test environment isolated from production security settings.

---

## Testing Invalid OTPs

A good test suite should verify that an incorrect code is rejected:
`Request OTP ↓ Retrieve real OTP ↓ Modify one digit ↓ Submit invalid OTP ↓ Expect verification failure`

This validates that the application is actually checking the submitted code rather than merely checking whether an OTP field contains a value.

---

## Testing Reused OTPs

OTP means *one-time password*. If the product requires single-use behavior, test it explicitly:
`Request OTP ↓ Submit correct OTP ↓ Verification succeeds ↓ Submit same OTP again ↓ Verification fails`

This is particularly useful for authentication and account-security testing.

---

## How to Run OTP Tests in GitHub Actions

Store email API credentials and test passwords in GitHub Actions Secrets.

```yaml
name: E2E OTP Tests
on:
  pull_request:
    branches: [main]

jobs:
  otp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run OTP E2E tests
        env:
          BASE_URL: ${{ secrets.STAGING_BASE_URL }}
          EMAIL_API_URL: ${{ secrets.EMAIL_API_URL }}
          EMAIL_API_KEY: ${{ secrets.EMAIL_API_KEY }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: npx playwright test
```

Do not place credentials directly in the YAML file.

---

## How to Run OTP Tests in GitLab CI

A GitLab pipeline can use the same general approach:

```yaml
e2e_otp_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.44.0-jammy
  script:
    - npm ci
    - npx playwright test
  variables:
    BASE_URL: $STAGING_BASE_URL
    EMAIL_API_URL: $EMAIL_API_URL
    EMAIL_API_KEY: $EMAIL_API_KEY
    TEST_PASSWORD: $TEST_PASSWORD
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
    expire_in: 7 days
```

Again, credentials should be supplied through the CI platform's protected variables or secret mechanism.

---

## Handling OTP Test Collisions in Parallel CI Jobs

Parallel CI execution is one of the biggest reasons shared email inboxes cause flaky tests.

Imagine:
- Worker 0 → `user@example.com`
- Worker 1 → `user@example.com`
- Worker 2 → `user@example.com`
- Worker 3 → `user@example.com`

All four tests can trigger OTPs within milliseconds of one another.

Instead:
- Worker 0 → `otp-build123-worker0@example.test`
- Worker 1 → `otp-build123-worker1@example.test`
- Worker 2 → `otp-build123-worker2@example.test`
- Worker 3 → `otp-build123-worker3@example.test`

Now each worker has an isolated email namespace. A practical implementation is:

```javascript
const worker = process.env.TEST_WORKER_INDEX || "0";
const build = process.env.CI_PIPELINE_ID || `${Date.now()}`;
const email = `otp-${build}-worker-${worker}@sandbox.example.test`;
```

If a worker runs multiple tests, add a unique test identifier as well.

---

## Polling vs Fixed Delays

Avoid code like:
```javascript
await sleep(5000);
const email = await getLatestEmail();
```

Why? Because five seconds may not always be enough. A busy CI runner may require longer. A fast test may receive the message after 400 ms, meaning the remaining 4.6 seconds were wasted.

A better approach is:
`Check message ↓ Message found? ├── Yes → Continue └── No → Wait → Check again`

Use a maximum timeout so the test remains bounded.

---

## Making OTP Tests Deterministic

The best OTP tests do not depend on luck. They should control:
- Test email address
- Test user
- Mailbox
- Message selection
- Timeout
- OTP parsing
- Cleanup
- Parallel worker identity

### Prefer conditions over sleeps
Instead of `Wait 5 seconds`, use `Wait until expected email exists` with a maximum timeout.

### Use separate time budgets
- **Mailbox creation:** 5 seconds
- **Email delivery:** 15 seconds
- **Browser action:** 10 seconds

This makes failures easier to understand.

---

## Debugging Failed OTP Tests

When an OTP test fails, you need to know where it failed. A useful diagnostic sequence is:
`Was OTP requested? ↓ Was email generated? ↓ Was email received? ↓ Was correct message selected? ↓ Was OTP extracted? ↓ Was OTP submitted? ↓ Was verification accepted?`

Instead of a generic `Error: Timeout`, your test should report structured diagnostic details:
```
OTP email was not found.
Inbox: ci-test-worker-2
Recipient: redacted
Expected sender: staging-mail
Elapsed time: 15 seconds
```

Do not expose the actual OTP in the error.

---

## Useful CI Diagnostics

Safe diagnostic information can include:
- CI run ID
- Worker ID
- Redacted inbox identifier
- Message ID
- Sender
- Subject
- Request timestamp
- Message arrival timestamp
- Submission timestamp

### Avoid logging:
- OTP value
- Password
- API token
- Magic link
- Reset link
- Full authentication email

A browser screenshot or trace can also contain sensitive values, so configure test artifacts carefully.

---

## Handling OTP API Failures

The [Email API](/email-api) is another external dependency. It can experience:
- Temporary network failure
- HTTP 5xx responses
- Rate limits
- Authentication failures
- Service outages

Not every failure should trigger a full test retry. For example, retrying an email retrieval request can be reasonable. But automatically rerunning the entire OTP request can generate another OTP and create ambiguity.

A better strategy is:
`OTP requested ↓ Email API temporarily unavailable ↓ Retry retrieval ↓ Message found ↓ Continue`

rather than:
`OTP requested ↓ API error ↓ Request another OTP ↓ Two codes now exist ↓ Parser selects wrong message`

---

## Security and Data Cleanup

OTP messages contain authentication information. Even in staging, treat them as sensitive test data.

### Store credentials securely
Use CI secrets for:
- `EMAIL_API_KEY`
- `EMAIL_API_TOKEN`
- `TEST_PASSWORD`
- `STAGING_BASE_URL`

Do not commit these values into source code.

### Use scoped credentials
If your email provider supports different permission levels, use a token that can access only the test resources it needs. The test should not have unnecessary access to unrelated mailboxes.

### Clean up test accounts
After the test finishes:
1. Delete test user
2. Delete inbox
3. Delete temporary data

Use teardown logic that also runs after failures.

### Keep retention short
If your [Email API](/email-api) supports mailbox expiration, configure a short lifetime for temporary test inboxes.

---

## Handling Rate Limits and CAPTCHA Challenges in Test Environments

Security controls should not simply be disabled because CI tests are inconvenient. Instead, create an explicitly controlled staging strategy:
- Use a dedicated staging domain.
- Use test-specific accounts.
- Configure appropriate test-environment limits.
- Use controlled test fixtures where appropriate.
- Keep any test-only bypass mechanism restricted to staging.
- Protect test-only credentials with secrets.
- Never expose staging bypass credentials in browser code.

This keeps automation practical without weakening production authentication.

---

## Email Template Changes and Test Maintenance

Email templates change frequently. A marketing team may change:
`Your verification code is:` to `Use this code to verify your account:`

If your test depends on the exact sentence, it may fail even though the OTP system still works.

A better approach is a stable selector:
```html
<span data-testid="otp-code">482913</span>
```
Then the test can look for `data-testid="otp-code"` rather than a complete sentence. This also helps with localization.

---

## Email API vs IMAP vs Mock SMTP

| Method | Best Use | Advantages | Trade-offs |
| :--- | :--- | :--- | :--- |
| **[Email API](/email-api)** | CI/CD E2E | Programmatic access, isolated inboxes | External dependency |
| **IMAP** | Corporate mail testing | Real mailbox infrastructure | More setup and polling |
| **Mock SMTP** | Local testing | Fast and isolated | No real delivery validation |
| **Webhooks** | High-speed CI | Event-driven, low polling | More infrastructure |

### When to use Email API
- You need automated inbox access.
- CI tests run in parallel.
- You want temporary inboxes.
- You want programmatic message retrieval.

### When to use Mock SMTP
- You need very fast local tests.
- You are testing email generation.
- Real delivery is outside the test scope.

### When to use IMAP
- The mailbox infrastructure itself is part of what you need to validate.
- Your organization already has controlled test accounts.
- You specifically need mailbox-level behavior.

---

## Common OTP Testing Problems and Fixes

| Problem | Likely Cause | Recommended Fix |
| :--- | :--- | :--- |
| **OTP not found** | Email still processing | Use bounded polling |
| **Wrong OTP** | Shared inbox | Unique inbox per worker |
| **OTP expired** | Test took too long | Improve retrieval and timeout strategy |
| **Parser finds wrong number** | Raw HTML contains other numbers | Use DOM parsing or labeled pattern |
| **CI exposes credentials** | Secrets committed to code | Use CI secret storage |
| **Duplicate messages** | Resend behavior | Filter by time/message ID |
| **Test hangs** | No retrieval timeout | Use bounded retries |
| **Local test works but CI fails** | Environment differences | Use controlled staging inboxes |
| **Test fails after email redesign** | Fragile parser | Add stable HTML selectors |
| **Parallel tests interfere** | Shared mailbox | Unique address per test |

---

## A Practical CI Test Architecture

A maintainable system can be structured like this:

```
                  CI Pipeline
                       │
       ┌───────────────┴───────────────┐
       │                               │
    Worker 1                        Worker 2
  Unique Inbox                    Unique Inbox
       │                               │
       └───────────────┬───────────────┘
                       │
                   Email API
                       │
                  Staging App
                 (OTP Generator)
```

Each test worker owns its email context. The [Email API](/email-api) provides the test with the message. The browser automation framework controls the user journey. This separation makes failures easier to diagnose and reduces test collisions.

---

## Local Development vs CI/CD

Your local environment and CI environment do not have to use exactly the same email infrastructure.

### Developer laptop
A mock SMTP server or local mail catcher can provide extremely fast feedback:
`Application ↓ Local SMTP ↓ Local inbox ↓ Test`

### CI
CI can use an isolated [Email API](/email-api):
`Application ↓ Staging email service ↓ Dedicated test inbox ↓ Email API ↓ Playwright/Cypress/Selenium`

### Pre-release testing
Before a release, run a smaller number of full E2E tests against the staging email infrastructure. This gives you a balance between speed during development and realistic validation before release.

---

## A Simple CI Checklist for OTP Email Tests

Before adding an OTP test to a CI pipeline, verify the following:
- [x] Is the test running against staging or sandbox infrastructure?
- [x] Does every test have a unique email address?
- [x] Is the Email API credential stored as a secret?
- [x] Does the retrieval helper have a maximum timeout?
- [x] Does the parser identify the correct message?
- [x] Can the test handle HTML and plain-text email?
- [x] Are OTP values excluded from logs?
- [x] Are screenshots and traces checked for sensitive data?
- [x] Are test accounts cleaned up?
- [x] Are temporary inboxes deleted or expired?
- [x] Can multiple workers run without reading each other's messages?
- [x] Does the final assertion prove successful verification?

If the answer to all of these is yes, the test is much more likely to remain stable as CI load increases.

---

## Choosing the Right Level of OTP Coverage

Not every pipeline needs the complete email flow on every commit. A layered testing strategy can be more efficient:

### Unit tests
Use unit tests for:
- OTP generation
- OTP length
- Expiration calculations
- Randomness rules
- Single-use behavior

These tests should be extremely fast.

### Integration tests
Use integration tests for:
- Email creation
- Email template generation
- Email-service integration
- Verification state changes

### E2E tests
Use E2E tests for:
`Registration → OTP email → Email retrieval → OTP entry → Successful verification`

### Scheduled tests
A scheduled or pre-release suite can cover:
- Multiple locales
- Resend
- Expiration
- Magic links
- Different browsers
- Full staging email infrastructure

This prevents every pull request from having to run every possible email test.

---

## Testing Multiple Browsers

If your product supports multiple browsers, the OTP test can be included in your cross-browser suite:
- Chromium → OTP verification
- Firefox → OTP verification
- WebKit → OTP verification

The email retrieval layer should remain independent of the browser:
`Playwright Browser ↓ Shared Email Helper ↓ Email API`
rather than creating a separate email implementation for every browser. This reduces duplication.

---

## Testing Mobile and Responsive Verification Flows

If the application has a responsive verification page, the OTP email test can also validate the flow at mobile viewport sizes:
- **Desktop:** `Desktop ↓ OTP email ↓ Verification`
- **Mobile:** `Mobile ↓ OTP email ↓ Verification`

The mailbox layer does not need to change. Only the browser configuration changes. This makes the same email automation reusable across desktop and mobile E2E scenarios.

---

## Testing Email Delivery Failures

A strong test suite should also consider what happens when email delivery fails:
`Application requests OTP ↓ Email unavailable ↓ Application shows useful error ↓ User can retry`

The exact behavior depends on the product. The test should verify the expected UX rather than assuming every email failure should become a generic timeout.

Useful assertions might include:
- Retry option appears.
- User receives an understandable error.
- Verification page remains available.
- No incorrect success state is shown.
- A new OTP can be requested when appropriate.

---

## Testing Spam and Filtering Behavior

For a staging environment, spam filtering may still affect automated email testing. If a test email is consistently filtered:
1. Check the staging sender configuration.
2. Check the test domain.
3. Confirm the [Email API](/email-api) sees the message.
4. Verify whether filtering occurs before or after the test inbox.
5. Avoid depending on a consumer mailbox when the purpose is application E2E testing.

The objective is to keep the test environment predictable.

---

## Testing Email Subjects and Sender Information

The email body is not the only thing worth validating. An E2E email test can also verify:
- `From`: expected sender
- `To`: test user
- `Subject`: expected subject
- `Body`: contains OTP

This is particularly useful when email branding or notification routing is part of the acceptance criteria. However, don't make every test assert every presentation detail. Use dedicated email-template tests for visual and copy requirements and keep the core OTP E2E test focused on verification.

---

## Avoiding Overly Fragile Assertions

Avoid assertions like:
```javascript
expect(body).toContain("Your verification code is 482913");
```

The OTP itself changes every run. Instead:
```javascript
expect(body).toMatch(/verification code/i);
```
and separately extract the OTP. Even better, if the email template provides a stable selector, use that selector to locate the code.

The principle is: **Assert stable behavior, not accidental implementation details.**

---

## What a Good OTP Test Should Look Like

A clean test should be easy for another developer to understand. Conceptually:

```javascript
test("user can verify their email", async ({ page }) => {
  const inbox = await createTestInbox();
  await registerUser(page, inbox.email);
  const message = await waitForVerificationEmail(inbox);
  const otp = extractOtpFromEmail(message);
  await submitOtp(page, otp);
  await expectVerified(page);
});
```

The implementation details live inside reusable helpers. This makes the test read like the user journey rather than like an email API tutorial.

---

## Frequently Asked Questions

### What is OTP email testing?
OTP email testing verifies that an application generates, delivers, retrieves, and accepts a one-time password sent by email. It can be performed manually, but automation is useful for CI/CD because it allows every deployment to verify the complete authentication flow.

### How do you automate OTP verification?
Create an isolated test inbox, trigger the OTP flow, retrieve the email through an [Email API](/email-api) or controlled mailbox, extract the code, submit it in the browser, and verify the resulting application state.

### How do you test OTP emails in Playwright?
Use [Playwright](https://playwright.dev/) for browser actions and an [Email API](/email-api) or controlled test inbox for email retrieval. Create a unique inbox for the test worker, retrieve the expected message, extract the OTP, and submit it through the browser.

### How do you test OTP emails in Cypress?
Use a [Cypress](https://www.cypress.io/) command or task to communicate with the [Email API](/email-api). Retrieve the test email, extract the OTP, return it to the browser test, and submit the code.

### How do you test OTP emails in Selenium?
Use [Selenium](https://www.selenium.dev/) to control the browser and an HTTP client such as Python requests to retrieve the OTP from an [Email API](/email-api).

### Can you test OTP emails without Gmail?
Yes. You can use dedicated [Email APIs](/email-api), temporary test inboxes, mock SMTP, controlled corporate mailboxes, IMAP, and webhook-based email delivery. A personal Gmail account is not required.

### What is the best approach for CI/CD OTP testing?
For full E2E staging tests, an authenticated [Email API](/email-api) with isolated test inboxes is a practical option. For local integration tests, mock SMTP is usually faster and simpler.

### How do you prevent OTP tests from interfering with each other?
Give each test worker or test run a unique email address or mailbox. Do not use one shared static inbox for parallel tests.

### How do you test OTP resend?
Trigger the first OTP, request a resend, retrieve the newest matching message, and verify the expected behavior of both the old and new codes. If the application invalidates the first OTP, verify that the first code is rejected and the new code succeeds.

### How do you test expired OTPs?
Use a controlled staging expiration configuration or test clock where available. Avoid making CI wait several real-world minutes for an OTP to expire.

### How do you test magic links?
Retrieve the email, extract the expected application URL, validate the domain, open the link through the browser test, and verify the resulting authenticated state.

### How do you test localized OTP emails?
Run the verification flow under each required locale and prefer stable HTML selectors or structured message fields instead of relying entirely on translated text.

### How do you keep OTP test data secure?
Use staging-only accounts and domains, short mailbox retention, scoped API tokens, CI secret storage, automatic cleanup, and safe logging. Never expose OTP values, API tokens, passwords, or authentication links in CI logs.

### Should OTP tests use fixed delays?
No. Prefer a bounded polling or event-driven mechanism that waits for the expected email to arrive. Fixed delays are slower and can still fail when delivery takes longer than expected.

### Should every CI run test real email delivery?
Not necessarily. A layered strategy is usually better:
`Unit tests ↓ Integration tests ↓ E2E OTP tests ↓ Scheduled/pre-release tests`
This keeps everyday CI fast while still providing complete coverage before release.

### How do you prevent an old OTP from being selected?
Filter messages using multiple attributes such as recipient, sender, subject, timestamp, message ID, and test-specific identifiers. Do not simply select the first message returned by the inbox.

### How do you debug an OTP test that works locally but fails in CI?
Check:
1. CI network access
2. Email API credentials
3. Test inbox creation
4. Message delivery time
5. Parallel worker isolation
6. OTP expiration
7. Environment variables
8. Email parsing
9. CI secret configuration
10. Staging email service availability

The failure should be narrowed down to the specific stage rather than solved by blindly increasing the timeout.

---

## Bottom line

For reliable CI/CD OTP testing, use isolated test inboxes, retrieve messages programmatically, keep parallel workers separated, use stable email parsing, and protect test credentials. Use mock SMTP for fast local integration tests and a controlled staging email flow for full end-to-end verification.

---

## Related Reading

- **[Formspree migration guide](/blog/migrate-from-formspree)** — a practical guide to moving from legacy form backends to developer APIs.
- **[Formspree alternative for developers and AI agents](/blog/formspree-alternative)** — patterns for structured API-driven automation.
- **[OllaStack form backend features](/)** — developer features for form submission, email notification, and automated validation.
- **[Zero-trust forms infrastructure guide](/blog/can-ai-agents-submit-forms-safely)** — security and authorization patterns for web submissions.
