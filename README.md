# CurbCutter

**A free, private app that helps people with disabilities get accessibility barriers fixed at Texas businesses.**

It lives at **curbcutter.org**, with plain privacy and support pages at curbcutter.org/privacy/ and curbcutter.org/support/.

CurbCutter walks a person through four moves, one question per screen:

1. **Document it.** Where it is, what's wrong, photos, and a parking count. CurbCutter does the ADA parking math.
2. **Ask for the fix.** CurbCutter drafts a polite letter from the report. The person reads it, changes any wording, and sends it in their own name.
3. **Follow up.** Calendar reminders and a dated record of every step.
4. **Escalate if needed.** The property owner (found through the county appraisal district), a TDLR or U.S. Department of Justice complaint (text prepared for each form), the city council member, and local newsrooms.

It covers the Dallas–Fort Worth, Houston, San Antonio, and Austin areas with checked local contacts, and the statewide rules and agencies apply everywhere in Texas.

## Why people can trust it

- **Every rule is sourced.** Each barrier, article, and letter points to the regulation, standard, or statute it comes from, with the date a person last checked it (`public/js/data/sources.js`).
- **Letters never overclaim.** Each barrier is labeled *Required*, *Required when built or remodeled*, *Must be kept working*, *A fair request*, or *The city's job*.
- **No AI in the letters.** Fixed templates turn the same facts into the same text, so everything can be checked.
- **The person has the last word.** Every letter is a draft they can change, and nothing is sent until they send it from their own email or phone.
- **A record of what was sent.** When someone marks a letter as sent, CurbCutter saves its exact text with the date, so they can reread or copy it later.
- **Tests guard the content.** Unit tests fail if a barrier cites a missing source, a contact has a malformed phone number, the TDLR summary goes over the state form's 1,000-character limit, or a published page still has a drafting note or placeholder in it.

## Why it keeps working

- **No server, no account, no database to go down.** It's a static site. Reports live on the person's phone (IndexedDB), with backup and restore.
- **Works offline.** A service worker keeps a complete copy of the app on the phone, so it works in a parking garage with no signal.
- **Readable in any phone browser.** If a phone's browser is set to show desktop sites, which shrinks every page onto the small screen, CurbCutter notices and zooms itself back to phone size. Nobody has to find a browser setting.
- **Always current.** Each time CurbCutter opens, the service worker asks curbcutter.org (one small request) whether the copy on the phone is the current one. If the site has changed, CurbCutter opens straight from the site, and the phone saves the new copy in the background. With no signal, or no answer within 3 seconds, it opens from the copy on the phone. Nobody is ever asked to update, and nothing reloads in the middle of a report.
- **Tested before it deploys.** Render runs 42 content and logic tests on every build and won't publish if one fails. GitHub Actions also runs 32 end-to-end tests on two phone sizes. Those include axe-core WCAG 2.2 AA scans of 31 screens in light, dark, and high-contrast modes, offline and always-current checks, and layout checks at extra-large text on phones as narrow as 320 pixels.
- **Link checking.** A monthly job checks every outside link and phone directory URL.

## Built for brain injury and other disabilities

One question per screen, autosave, "Save and finish later," plain language, error messages that say how to fix the problem, large tap targets, three text sizes, high contrast, dark mode, reduced motion, read-aloud on every screen, and a **Show this to staff** screen for people who find talking hard. Body text is set in Atkinson Hyperlegible Next, a typeface designed by the Braille Institute for legibility.

## Project layout

```
public/                 The app (this folder is what gets deployed)
  index.html, sw.js, manifest.webmanifest
  privacy/, support/    Plain pages for the privacy policy and help (no JavaScript needed)
  assets/               CSS, fonts (SIL Open Font License), icons
  js/data/              Content: barriers, sources, contacts, rights articles
  js/lib/               Logic: parking math, letters, escalation, storage, calendar
  js/screens/           One file per screen
  js/ui/                Shared interface pieces
scripts/                Service worker stamp, local server, link checker, preview build
tests/unit/             Node tests (no browser needed)
tests/e2e/              Playwright tests: flows, accessibility, offline
docs/                   Deploying, keeping content accurate, app stores, roadmap
render.yaml             Render hosting setup
setup/                  GitHub Actions workflow to copy into .github/workflows/ (see docs/DEPLOY.md)
```

## Run it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```
npm install
npm run serve        # then open http://localhost:4173
npm run test:unit    # fast checks
npx playwright install chromium   # first time only
npm run test:e2e     # full browser tests
```

## Next steps

- **Deploy:** [docs/DEPLOY.md](docs/DEPLOY.md)
- **Keep the information accurate:** [docs/CONTENT.md](docs/CONTENT.md)
- **Google Play and the App Store:** [docs/APP-STORES.md](docs/APP-STORES.md)
- **What comes after version 1:** [docs/ROADMAP.md](docs/ROADMAP.md)

CurbCutter shares general information, not legal advice.
