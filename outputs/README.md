# Fund Me

Fund Me is a responsive, static founder/investor concept demo built with plain HTML, CSS, and JavaScript. No framework, package install, API server, or credentials are required to preview it. This is a reconstruction from the supplied feature brief, not the missing original app.

## Run locally

From the repository root, serve the `outputs` directory:

```sh
npx --yes serve outputs
```

Open the local URL printed by the command. The GitHub Pages workflow also validates JavaScript syntax with `node --check outputs/app.js` and deploys the contents of `outputs` on pushes to `main`.

## Main journeys

- **Explore:** browse sample startup cards, search and filter, save pitches, and open the pitch details.
- **Create a profile:** choose founder or investor. In demo mode, the name and role are stored in this browser only. “Use saved profile” switches back to a profile saved in this browser; it is not authentication.
- **Create a pitch:** founders fill in four short steps—basics, story, media, and preview. Text drafts and the current step are saved in local storage so the form can be resumed in the same browser.
- **Add media:** select up to four JPG, PNG, or WebP photos (5 MB each) and one MP4, WebM, or MOV video (100 MB). Files are validated and previewed locally. The browser does not upload them; file selections are lost when the page is closed or refreshed.
- **Contact a founder:** send a sample, permission-based request. The inbox can accept or decline requests made in this browser. No private contact details are exchanged.

## Demo-mode and privacy limits

The published Pages site is a front-end demonstration, not a real account, investment, or messaging service. Profiles, draft text, saved pitches, and requests stay in the current browser's local storage and are not shared across visitors or devices. Anyone using the same browser profile can access this demo data. Do not enter real private, sensitive, financial, or confidential information. Pitches are not public on the internet in this demo.

## What is needed for a real service

Before representing accounts, pitches, media, or contact requests as shared/live, connect:

1. **Authentication and database:** a trusted identity provider and server-side API/database with access controls. Add only public profile fields to investor-visible data; keep contact details private until the founder consents.
2. **Media storage:** private object storage with server-issued, short-lived upload URLs, file-size/type validation, malware scanning, moderation, access controls, and deletion support. Never place service credentials or secret keys in frontend code.
3. **Contact workflow:** server-side request records, founder accept/decline actions, abuse prevention, notifications, and a policy for when contact details may be revealed.
4. **Operations and compliance:** privacy notice, terms, consent, retention/deletion policies, backups, monitoring, and legal review appropriate to the markets where the service operates.

Provide public frontend configuration only where appropriate (for example, an auth project URL and publishable client key); keep service-role keys, database passwords, and storage secrets in server-side environment variables. No backend credentials are currently configured.

## Deploy

The repository's GitHub Actions workflow publishes `outputs` to GitHub Pages whenever changes are pushed to `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** once for a new repository. The public demo is hosted at `https://judedhillon.github.io/fundme-demo/`. The custom domain is intentionally not configured until its DNS is pointed at GitHub Pages.
