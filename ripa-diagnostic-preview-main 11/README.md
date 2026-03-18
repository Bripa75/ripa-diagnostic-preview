# Ripa Diagnostic Preview

A lightweight (static) diagnostic test web app (Grades 2–8) that delivers an **instant report** with:
- estimated Math + ELA performance level
- strengths & priority strands
- a simple 1–2 week action plan

## How it works
- Runs fully in the browser (GitHub Pages friendly).
- Uses a short adaptive path: **10 Math → 10 English**.
- Generates an on-page report and supports:
  - **Download/Print as PDF** (via the browser print dialog)
  - **Email to parent** (opens the user's email client via `mailto:`)

> Note: The “email to parent” feature uses the user’s mail app (because this is a static site). If you later want server‑side delivery, add a small backend.

## Privacy
- The diagnostic runs in the browser.
- Only minimal analytics (optional) can be collected via Formspree (currently: grade + summary + optional name/email).
- No sensitive student data is stored on a server by default.

## Local dev
Open `index.html` in a browser (or serve the folder).

## Deploy
This repo is ready for GitHub Pages deployment.

## Roadmap (next)
- Add a paid “Detailed Report” step
- Add abuse protection (CAPTCHA / server-side rate limiting) if you enable automated email delivery
