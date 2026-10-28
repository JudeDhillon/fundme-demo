# Fund Me demo

This is a static prototype reconstructed from the supplied hosting handoff because the original site source was not included. It is not the original implementation and is not production-ready.

## What is here

- `index.html`: responsive product landing page.
- `app.html`: interactive founder/investor demo.
- `styles.css`, `script.js`, `app.css`, `app.js`: page styling and interactions.
- `CNAME`: intended GitHub Pages custom domain (`fundme.in.net`).

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that publishes the `outputs` folder. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The first deployment may take a few minutes. The `CNAME` file requests the custom domain, but the domain will not work until its DNS is configured at the registrar.

For `fundme.in.net`, add the DNS records GitHub Pages currently specifies for a subdomain: a `CNAME` record for host `fundme` pointing to the GitHub Pages hostname assigned to this repository. Do not replace existing DNS records blindly. Check the domain provider's current DNS records and GitHub's Pages settings/verification before changing them. Enable HTTPS in Pages after DNS has propagated.

## Important limitations

- All pitch, saved-list, and introduction data is kept only in the current browser's local storage. It is not shared between users or devices and has no authentication or access control.
- The role switch is a demo control, not authentication or authorization.
- The signup form from the handoff is not implemented as a working registration endpoint.
- There is no video upload, backend, investor verification, moderation, or real introduction service.
- Do not enter real, sensitive, or confidential information or represent demo actions as real investment introductions.

Use this only to preview the concept. A real service needs a reviewed backend, identity and access controls, secure storage, privacy terms, consent, abuse handling, and operational/legal review before accepting real users or investment-related information.
