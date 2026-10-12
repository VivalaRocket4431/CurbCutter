# Getting CurbCutter into Google Play and the App Store

## Phase 1: installable web app (now)

CurbCutter already installs on iPhone and Android from curbcutter.org, works offline, and updates itself. This costs nothing and doesn't need store review. Most of what people need is here on day one.

## Already in place for both stores

- **The address.** Store packages are tied to the app's web address, so build them only after `https://curbcutter.org` works (see [DEPLOY.md](DEPLOY.md), step 5).
- **Privacy policy:** `https://curbcutter.org/privacy/`. Apple requires a privacy policy link for every iPhone app, both in the store listing and inside the app, and the app's About screen links to it. Google Play requires one for many apps.
- **Support page:** `https://curbcutter.org/support/`, with hello@curbcutter.org as the way to reach you. Apple asks that the Support URL include an easy way to contact you.

## Phase 2: Google Play

Google Play accepts installable web apps through a **Trusted Web Activity**, a thin Android wrapper around the same site.

1. Create a [Google Play Console](https://play.google.com/console) developer account (a one-time registration fee).
2. Go to [PWABuilder](https://www.pwabuilder.com/), enter `https://curbcutter.org`, and choose **Android** to download a ready-made package.
3. PWABuilder gives you an `assetlinks.json` file. Put it at `public/.well-known/assetlinks.json` and deploy, so it appears at `https://curbcutter.org/.well-known/assetlinks.json`. This proves the app and the website belong together.
4. Upload the package in Play Console and fill in the store listing. Use `https://curbcutter.org/privacy/` as the privacy policy, and answer the data safety form: CurbCutter collects no data.

Updates to the website reach the Android app automatically, with no new store submission.

## Phase 3: Apple App Store

1. Join the [Apple Developer Program](https://developer.apple.com/programs/) (yearly fee). Apple waives the fee for some nonprofit organizations, so check eligibility if CurbCutter becomes part of a nonprofit.
2. Wrap the app with [Capacitor](https://capacitorjs.com/) or PWABuilder's iOS package. iOS builds need a Mac. Without one, a cloud build service can do it.
3. **Plan for review.** Apple rejects apps that are "just a website." CurbCutter's case for approval is that it works fully offline, uses the camera and share sheet, and is a complete tool rather than a web page. In the privacy section, select "Data Not Collected." Use `https://curbcutter.org/privacy/` and `https://curbcutter.org/support/` for the Privacy Policy and Support URLs.

## What stays the same

All three versions run the same code from `public/`. Fix something once and every platform gets it.
