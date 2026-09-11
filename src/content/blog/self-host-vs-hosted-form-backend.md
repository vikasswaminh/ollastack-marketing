---
title: "Self-host vs hosted form backend: how to choose"
description: "Run your own form backend or use a hosted one? A clear framework — control, compliance, cost vs operational burden — and why you may not have to pick one."
date: 2026-09-02
updated: 2026-09-02
tags: ["self-host", "architecture", "decision", "guide"]
author: "Ollastack"
readingTime: 7
faq:
  - q: "Should I self-host a form backend?"
    a: "Default to hosted unless a hard requirement (data residency, compliance, air-gap, or a real cost crossover) forces self-hosting. The operational burden is usually worth more spent on your product."
  - q: "Is the decision reversible?"
    a: "With Ollastack, yes — the hosted service and the self-hostable instance share the same endpoints and API, so you can start hosted and move later without re-integrating."
  - q: "What does self-hosting actually cost?"
    a: "Operations: uptime, backups, deliverability (SPF/DKIM/DMARC, reputation), spam tuning, and scaling — paid in engineering time, not just dollars."
---

"Just use a hosted form backend" is good advice until it isn't — until a compliance requirement, a data-residency rule, or a cost curve pushes you toward running it yourself. Here's how to decide without over- or under-engineering it.

## The honest default: use the hosted version

For the large majority of teams, a hosted form backend is the right call, and it's not close. You get spam filtering, deliverability, webhooks, and an inbox without operating any of it. The engineering time you'd spend self-hosting is almost always worth more spent on your actual product. Start hosted; only move if a specific, concrete reason appears.

## The reasons that justify self-hosting

Move to self-hosted when one of these is a hard requirement, not a preference:

- **Data residency / sovereignty.** Submissions must physically live in a specific region or on infrastructure you control (regulatory, government, healthcare).
- **Compliance you can't delegate.** You need to own the full data path for an audit, or your DPA forbids a third-party processor for this data.
- **Air-gapped or VPC-only.** The form lives behind your firewall and can't talk to a SaaS.
- **Cost at extreme scale.** Past some volume, per-submission pricing exceeds what a VM costs you. This threshold is higher than most teams think — do the math before assuming you're past it.
- **Deep customization** of the pipeline that a hosted product won't expose.

If none of these apply, self-hosting is buying operational burden you don't need.

## What self-hosting actually costs you

Be clear-eyed about the bill, which is paid in operations, not dollars:

- **Uptime is yours.** Backups, restores, patching, monitoring, and the 2 a.m. page.
- **Deliverability is yours.** SPF/DKIM/DMARC, sender reputation, bounce handling — the stuff a hosted provider amortizes across everyone.
- **Spam is yours.** Maintaining and tuning the filter, including the false-positive problem that's easy to get catastrophically wrong (see [why a form backend should fail open](/blog/ml-quarantine-explained)).
- **Scaling is yours.** The ingest path under a traffic spike, connection limits, the works.

Self-hosting trades a predictable subscription for unpredictable operational time. Sometimes that trade is clearly correct. Often it's a hobby disguised as a cost saving.

## A decision checklist

Answer these honestly:

1. Is there a **regulatory or contractual** requirement that submissions live on infrastructure you control? → lean self-host.
2. Do you have the **operational capacity** (on-call, backups, deliverability know-how) to run it well? → if no, hosted, regardless of #1's appeal.
3. Have you **actually computed** the cost crossover, or are you guessing? → compute it.
4. Is the customization you need **real and specific**, or "might want someday"? → someday isn't a reason.

If you're not landing firmly on self-host for #1 or #3, use the hosted version.

## You may not have to choose forever

The architecture matters here. A form backend that is *both* a clean hosted product and self-hostable on a single VM lets you start hosted and move later without re-integrating — the endpoint contract, the API, and the data model are the same either way. That removes the scariest part of the decision: lock-in. You can begin on the hosted service, and if a compliance requirement appears in year two, stand up your own instance against the same API rather than rewriting your forms.

Ollastack is built this way — a hosted service you can sign up for today, and a self-hostable monorepo you can run on your own VM with the same endpoints and API. So the pragmatic path is usually: **start hosted, keep the option open.**

## The summary

- **Default to hosted.** It's the right call for most teams, and the engineering you save is worth more elsewhere.
- **Self-host for a hard requirement** — residency, compliance, air-gap, or a real (computed) cost crossover — not for a feeling of control.
- **Pick a backend that supports both**, so the decision is reversible and lock-in isn't part of it.

[Start hosted](https://login.ollastack.com/register) and keep the self-host option open — same API either way.
