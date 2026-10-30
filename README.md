# Gender Reveal Countdown

A small static website that counts down to a set time, then reveals "It's a Boy!" or "It's a Girl!" with confetti.

## Set it up

Edit `config.js`:
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
