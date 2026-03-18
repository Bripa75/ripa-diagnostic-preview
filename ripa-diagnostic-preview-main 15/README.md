# Ripa Diagnostics

Cleaned deployment version of the student baseline exam site.

## What was optimized
- removed duplicate nested project folders from the deploy package
- removed old zip archives from the live site package
- kept only the files needed for the web app to run
- improved the landing page copy and calls to action
- added a dedicated `start.html` entry page for a cleaner user flow
- kept the existing test, admin page, and domain setup intact

## Main files
- `index.html` → homepage
- `start.html` → cleaner entry page before the exam
- `diagnostic-test.html` → live test page
- `admin.html` → admin code generation page
- `app.js` → exam logic
- `bank.js` → question bank
- `styles.css` → styling
- `supabase-config.js` → Supabase config
- `CNAME` → custom domain

## Recommended next upgrades
- connect the final report to a "Book a Session" button
- add a parent-facing results summary page
- add analytics for exam starts and completions
- add CAPTCHA or rate limiting if access-code abuse becomes a problem
