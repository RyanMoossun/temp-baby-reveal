# Gender Reveal Countdown

A small static website that counts down to a set time, then reveals "It's a Boy!" or "It's a Girl!" with confetti.

## Set it up

Edit `config.js`:

- `revealAt`: when the reveal happens, e.g. `"2026-12-01T18:00:00+00:00"`. Include an offset (`+00:00`, `-05:00`, …) so every guest counts down to the same moment. Without one, each viewer's local time is used.
- `gender`: `"Ym95"` for boy, `"Z2lybA=="` for girl. These are base64 so the answer isn't visible at a glance. You can make them yourself in a browser console with `btoa("boy")` or `btoa("girl")`. This only discourages casual peeking; a determined guest can still decode it.
- `title`, `subtitle`, `babyName` (optional): text shown on the page.

## Try it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

To test the reveal without changing the date, add `?preview=1` to the URL (`index.html?preview=1`). It runs a 10-second countdown and then shows the reveal set in `config.js`.

If the page is opened after the reveal time, it shows the reveal straight away.

## Host it

These are plain static files with no build step. Upload the folder to GitHub Pages, Netlify (drag and drop), Cloudflare Pages, or any web host.
