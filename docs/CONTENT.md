# Keeping CurbCutter accurate

People act on what CurbCutter tells them, so every fact has to be right and traceable.

## Where the content lives

| File | What it holds |
|---|---|
| `public/js/data/sources.js` | Every official source, with the date a person last checked it |
| `public/js/data/barriers.js` | Each barrier: plain-language rule, how firm it is, suggested fix, photo tips, sources |
| `public/js/data/contacts.js` | Statewide agencies and local contacts for each metro area |
| `public/js/data/rights.js` | The "Know your rights" articles |
| `public/js/lib/letters.js` | Letter templates |

## Rules for adding or changing anything

1. **Use primary sources.** Federal regulations (eCFR), ADA.gov, the U.S. Access Board, Texas statutes, TDLR, or the organization's own website. No blogs and no AI answers.
2. **Confirm it yourself.** Open the page and find the exact sentence or number.
3. **Record the date.** Update the `checked` date on the source, and `CONTENT_CHECKED` at the top of `sources.js` when you finish a review. Update `CHECKED` in `contacts.js` when you re-check contacts.
4. **Keep the strength label honest.** If a rule applies only to new or remodeled buildings, use `built`, not `required`.
5. **Run the tests** (`npm run test:unit`). They catch missing sources, bad phone formats, and letters that print "undefined."

## Review schedule

| When | What |
|---|---|
| Monthly (automatic) | GitHub checks every link on the 1st. A failure means a page moved: find the new address on the organization's site. Sites that block automated checks are listed as "check by hand." |
| Every 3 months | Call or open each phone number and newsroom contact page in `contacts.js`. |
| After each Texas legislative session | The Legislature meets in odd-numbered years, and most new laws take effect September 1. Re-check Transportation Code Chapter 681 (parking), Government Code Chapter 469 (architectural barriers), and TDLR's rules. |
| When ADA.gov announces changes | Re-check the federal rules and the tax-incentive amounts. |

## Verification log

Add a line each time you review.

| Date | What was checked | Who |
|---|---|---|
| 2026-10-11 | All sources, rules, and contacts in v0.1.0 | Claude, with Michael Potiska |

## Adding a city or metro area

Add the city to the right area in `LOCAL` in `contacts.js`. Fill in `report` (311), `ada` (the city's ADA or disability office), and `council` (how to find your council member), using only the city's own website. Then run the tests.

## Spanish

Spanish is the next language to add. Have a fluent speaker translate, and have a second person review the legal text. Don't publish machine translation of rules without review.
