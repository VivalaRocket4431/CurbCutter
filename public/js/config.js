// App-wide settings you may want to change.
// The app lives at https://curbcutter.org (see render.yaml and docs/DEPLOY.md), with plain
// privacy and support pages at /privacy/ and /support/.
// Storage names inside the code (the 'curbcut' database, settings key, and cache prefix) keep the
// original short name on purpose. Renaming them would make phones lose the reports they already saved.

export const APP = {
  name: 'CurbCutter',
  tagline: 'Speak up for access in Texas',
  version: '0.1.0',
  // Receives feedback, wrong-number reports, and success stories (forwarded by Porkbun).
  // Leave empty to hide those buttons.
  feedbackEmail: 'hello@curbcutter.org',
};
