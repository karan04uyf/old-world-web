# Old World Proof

Latest responsive ebook storefront: city hero, custom gold logo, featured ebook, expandable creator questions, interactive history topics, review carousel, and community signup interface.

## Files

- `public/`: website HTML, CSS, JavaScript, favicon, phone preview, and all artwork.
- `local-preview/server.py`: Python local preview with SMTP verification and private SQLite storage. Not a production application server.
- `HOSTINGER.md`: deployment instructions and remaining connections.

No signup database, member records, SMTP credentials, passwords, or API keys are included.

## Local preview

Run `python local-preview/server.py`, then visit http://127.0.0.1:8767/. The phone layout can be viewed at `/mobile-preview.html`.

SMTP_HOST, SMTP_PORT (default 587), SMTP_FROM, SMTP_USER, and SMTP_PASSWORD must be set in the process environment to send verification emails. Use encrypted STARTTLS SMTP. Do not put credentials in public files. Verified records are created in the ignored `private/` directory. There is no public admin route. Codes expire after ten minutes and have limited attempts.

## Current content and connections

- Facebook: https://www.facebook.com/oldworldproof
- YouTube: https://www.youtube.com/@oldworldprooforg
- Contact: oldworldproof@gmail.com
- The featured ebook's final title, cover, price, and release date are pending.
- The “I want this” button still opens a placeholder message. A real Gumroad product URL must be added before checkout can work.
- Email delivery is unconfigured. Static hosting alone cannot run the signup API.
- Instagram URL is pending.
- Reviews and portraits are explicitly labeled illustrative examples, not real customer testimonials.
- Hero and portrait artwork were generated; the city image is illustrative, not a historical source photograph.

Only deploy the contents of `public/` as publicly accessible website files. Keep backend source, environment settings, and private records outside the public document root.
