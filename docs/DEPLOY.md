# Deploying CurbCutter

CurbCutter is a static site, the same kind of Render service as The Electoral Record. There is no server to keep running and no database to expire.

**curbcutter.org opens the app directly.** Render hosts it for free. The privacy and support pages are part of the same site, at `curbcutter.org/privacy/` and `curbcutter.org/support/`. The domain is registered at Porkbun, which is also where its DNS records live. WordPress isn't needed.

## One-time setup (about 30 minutes, plus waiting for DNS)

### 1. Turn on hello@curbcutter.org (1 minute)

The app and its pages list this address, so it has to work before launch.

1. In Porkbun, open **Domain Management** and click the envelope icon under **EMAIL** for curbcutter.org.
2. Under **Create a New Forwarding Address**, type `hello` in the first box and your Gmail address in the second, then click **Create Email Forward**.

Porkbun's email forwarding is free. Replies you send from Gmail show your Gmail address.

### 2. Put the folder on GitHub

**Recommended: GitHub Desktop.** It uploads the whole folder exactly as it is, and later updates take two clicks.

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in as `VivalaRocket4431`.
2. **File > Add local repository**, choose `E:\Projects\AccessibilityAdvocatePlatform`. When it says this isn't a repository yet, click **create a repository**.
3. Leave the Name as it is (changing it makes a new, empty folder). Leave **Git ignore** and **License** set to **None**, then click **Create repository**.
4. Click **Publish repository**. Name it `curbcutter`, uncheck **Keep this code private**, and click **Publish repository**. Public is fine because the app has no secrets, and it lets people see your work.

### 3. Turn on the automatic tests (optional, 2 minutes)

The test workflow has to live in a folder named `.github/workflows`, which Claude can't create on your computer, so this one file is added by hand:

1. On GitHub, open the `curbcutter` repository and choose **Add file > Create new file**.
2. In the name box, type `.github/workflows/ci.yml` (typing the slashes creates the folders).
3. Open `setup/github-actions-ci.yml` from your project folder, copy everything, and paste it into the big box.
4. Click **Commit changes**. The **Actions** tab will show the tests running.

From then on, GitHub runs every test, including the accessibility and offline checks, each time you push. It also checks every outside link on the 1st of each month.

### 4. Create the site on Render

1. In Render, click **New > Blueprint**, pick the `curbcutter` repository, and click **Apply**. If it isn't listed, click **Configure GitHub** and give Render access to the new repository. Render reads `render.yaml` and sets up the `public` folder, the security headers, the `curbcutter.org` address, and a build step that runs the content and logic tests before anything goes live.
2. Wait for the first deploy to finish. Render also gives the site a temporary address such as `curbcutter.onrender.com` (with extra letters if that name is taken). It's shown at the top of the site's page in Render. You need it in the next step.

You can also ask Claude to watch the deploy with the Render connector.

### 5. Point curbcutter.org at Render

**Do this before you share the app with anyone.** A phone keeps CurbCutter's reports under the exact web address it was opened from, so the app should only ever be used at curbcutter.org.

1. In Porkbun, open **Domain Management** and click **DNS** under curbcutter.org.
2. Delete the records that send the domain to the WordPress hosting: any `A`, `AAAA`, `ALIAS`, or `CNAME` record whose Host is blank or `www`. Keep the `MX` and `TXT` records, because they run the email forwarding.
3. Click **Add Record** and add these two:

   | Type | Host | Answer |
   |---|---|---|
   | `ALIAS` | leave it blank | `curbcutter.onrender.com` |
   | `CNAME` | `www` | `curbcutter.onrender.com` |

   Use the onrender.com address from step 4 if Render gave you a different one. Leave TTL at its default.
4. In Render, open the site, go to **Settings > Custom Domains**, and click **Verify** next to `curbcutter.org`. DNS changes take anywhere from a few minutes to a few hours. Render sets up HTTPS (the lock icon) on its own and sends `www.curbcutter.org` to `curbcutter.org`.
5. When `https://curbcutter.org` opens the app with the lock icon, turn off the temporary address so the app has only one: in `render.yaml`, change `renderSubdomainPolicy: enabled` to `disabled`, then commit and push. Change it in `render.yaml` rather than in Render's settings, because Render can switch a setting back to match `render.yaml` on the next update.

If you cancel the WordPress plan at Porkbun later, check these DNS records again afterward.

### 6. Check it on your phone

- **iPhone:** open `https://curbcutter.org` in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open it in Chrome and tap **Install app** when it appears.
- Turn on airplane mode and open CurbCutter from the Home Screen. It should still work.

## Every update after that

1. Edit files in the folder (or ask Claude to).
2. In GitHub Desktop: write a short summary, click **Commit to main**, then **Push origin**.
3. Render runs the content and logic tests and deploys only if they pass. If they fail, the live site stays as it was. If you set up step 3, GitHub runs the full test suite at the same time and emails you if anything fails.
   - Optional, stricter: in `render.yaml`, change `autoDeployTrigger: commit` to `autoDeployTrigger: checksPass`. Render will then wait for the full GitHub suite to pass before deploying. Only do this after step 3, because Render won't deploy at all if a commit has no GitHub checks.
4. That's all. The next time anyone opens CurbCutter, they get your changes, with no message and nothing to do. Their phones also save the new copy in the background, for times with no signal.

## If something goes wrong

- **Tests failed:** in GitHub, open the **Actions** tab, then the failed run, to read which check failed. In Render, a failed build shows under **Events**. Either way, the live site is not affected.
- **Render never deploys:** if you switched to `checksPass`, make sure step 3 is done. Otherwise switch back to `commit`.
- **curbcutter.org won't verify:** wait an hour, then click **Verify** again. Make sure no old `A`, `AAAA`, `ALIAS`, or `CNAME` records remain for the blank host or `www`. If the domain has `CAA` records, add ones for `letsencrypt.org` and `pki.goog`.
- **You still see the old WordPress page:** DNS changes take time to reach every network. Try again in an hour, or on your phone's cellular data.
- **"Not found" after turning off the temporary address:** that page is the old onrender.com address. Use `https://curbcutter.org`. If you saved test reports at the old address, turn it back on for a minute, download a backup in **Settings**, and restore it at curbcutter.org.
- **Need to undo a deploy:** in Render, open **Events**, find the last good deploy, and choose **Rollback**.
- **The monthly link check failed:** see [CONTENT.md](CONTENT.md). It means a contact page moved, not that the app broke.
