# Sagar Flower Shop

A mobile-first florist portfolio, built with semantic HTML, CSS and vanilla JavaScript. No build step, framework, subscription or paid hosting is required.

Live website: https://sagarflowershopparli.github.io/sagar-flower-shop/

## GitHub Pages deployment checklist

1. Push `index.html`, `styles.css`, `app.js`, `.nojekyll`, and `assets/` to the repository's `main` branch.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose **main** and **/(root)**, then save.
5. Wait for the Pages deployment to finish. The URL above will serve the site over HTTPS.
6. Push future edits to `main`; GitHub Pages publishes them automatically.

The repository is public so GitHub Pages can host it on GitHub Free. The site does not use paid APIs or services.

## Preview locally

Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`.

## Content maintenance

- Edit shop information and service copy in `index.html`.
- Portfolio cards are rendered in HTML for search engines and work without JavaScript. Update cards' titles, categories, image paths and WhatsApp links together.
- Phone numbers and WhatsApp destination appear in `index.html` and `app.js`.
- `assets/source-content.json` catalogs the eight original Google Sites pages.
- `assets/source-catalog.json` records downloaded source photos; `assets/portfolio.json` catalogs the displayed collection.
- Source: https://sites.google.com/view/sagar-flower-shop/home
- Original product titles were not supplied, so descriptive English portfolio titles were added after reviewing the photographs.
- The original source lists nearby delivery and advance booking for special garlands. Prices, guaranteed lead times, and opening hours were not published, so customers are directed to enquire.
- The original banner identifies Parli, Maharashtra; the page text identifies the landmark near Maharashtra Shoe Mart. The map is a search link, not a verified coordinate pin.
- WhatsApp uses the site's primary published telephone number, +91 7620644158; account registration cannot be verified without opening a conversation.
- Some Google-hosted assets returned HTTP 403. Downloaded photos are local WebP files; no broken remote image references are used. The original source catalog retains the unavailable URLs.

## Features

Responsive two-column mobile gallery, category filtering, accessible native-dialog lightbox with keyboard and swipe navigation, product-specific WhatsApp links, scroll-aware bottom navigation, passive/rAF scroll updates, reduced-motion support, lazy responsive images, local assets, Florist JSON-LD, Open Graph metadata, and a skip link.
