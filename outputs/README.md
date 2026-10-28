# Fund Me demo

This is a static prototype reconstructed from the supplied hosting handoff because the original site source was not included. It is not the original implementation and is not production-ready.

## What is here

- `index.html`: responsive product landing page.
- `app.html`: interactive founder/investor demo.
- `styles.css`, `script.js`, `app.css`, `app.js`: page styling and interactions.
- `CNAME`: intended GitHub Pages custom domain (`fundme.in.net`).

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that publishes the `outputs` folder. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The first deployment may take a few minutes. The custom domain is not enabled yet because its DNS has not been configured; this keeps the default GitHub Pages address working.

To connect `fundme.in.net` later, first add a `CNAME` record at the DNS provider with host/name `fundme` and target `judedhillon.github.io` (some providers expect the full host `fundme.in.net`). Do not replace existing DNS records blindly. After DNS resolves to GitHub Pages, set `fundme.in.net` as the custom domain in repository Pages settings and enable **Enforce HTTPS** when the certificate is ready.

## Important limitations

- All pitch, saved-list, and introduction data is kept only in the current browser's local storage. It is not shared between users or devices and has no authentication or access control.
- The role switch is a demo control, not authentication or authorization.
- The signup form from the handoff is not implemented as a working registration endpoint.
- There is no video upload, backend, investor verification, moderation, or real introduction service.
- Do not enter real, sensitive, or confidential information or represent demo actions as real investment introductions.

Use this only to preview the concept. A real service needs a reviewed backend, identity and access controls, secure storage, privacy terms, consent, abuse handling, and operational/legal review before accepting real users or investment-related information.
