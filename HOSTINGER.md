# Deploying to Hostinger

## Publish the website design

This website uses plain HTML, CSS, and JavaScript. There is no npm installation or build command.

The public document root must contain `index.html`, `styles.css`, `script.js`, `favicon.svg`, and `assets/`. These are the contents of this repository's `public/` directory.

For a manual upload, extract the separately prepared `old-world-proof-hostinger.zip` into your website's `public_html` directory using Hostinger File Manager. The ZIP already has index.html at its top level. Preserve any existing live site before replacing it.

## GitHub deployment

Hostinger's Git integration is available for custom HTML/PHP websites on supported web and cloud hosting plans. In the website dashboard, open Advanced → Git, connect GitHub, select the repository and `main` branch, then choose a deployment destination.

IMPORTANT: Hostinger's “Root directory” is the destination folder on the hosting account, not a source-subfolder selector. This repository includes backend source alongside `public/`. Do not deploy the whole repository into a public document root. Use a deployment workflow that publishes only `public/`, or use the prepared static ZIP. If cloning the full repo, place it outside public_html and copy only public/ contents into public_html. Hosting plan capabilities determine whether shell-based deployment is available.

Official instructions: https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/

## Features that still need setup

1. Gumroad: supply the final ebook product link and connect the “I want this” button.
2. OTP signup: the included Python script is for local preview. A production backend, SMTP credentials, HTTPS, private persistent storage, and routing for `/api/signup/request` and `/api/signup/verify` are needed. Uploading HTML files does not enable this service. Choose an implementation compatible with your Hostinger plan before enabling live signup.
3. Replace the sample ebook details and example reviews with approved launch content.
4. Supply the Instagram link if it should be live.

Do not place the `private/` directory, databases, or email credentials in public_html or GitHub. No such files are in this package.
