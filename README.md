# Kyyinfinite SEO-ready files

## Included
- `index.html`: SEO metadata is already included.
- `public/sitemap.xml`: homepage sitemap.
- `public/robots.txt`: crawl rules and sitemap location.

## Important
The `index.html` in this package is a minimal template, not your original portfolio page. Replacing your current `index.html` with it will replace the page markup and may affect your existing design. To preserve your current portfolio, merge the `<head>` metadata into your original `index.html` instead.

The Open Graph image currently points to `https://www.kyyinfinite.my.id/og-image.jpg`. Add a real image at that public path or change/remove the image metadata.

This package uses `https://www.kyyinfinite.my.id/` as the canonical URL. Change it consistently in all files if you choose the non-www domain as canonical.

After deploying, verify the sitemap and robots files, then add `kyyinfinite.my.id` as a Domain property in Google Search Console and verify using the exact DNS TXT record Google provides.
