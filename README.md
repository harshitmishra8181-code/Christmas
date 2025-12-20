Shareable Code Runner
=====================

This is a small static site that lets you edit and run HTML, CSS, JavaScript, and simple Python (via Pyodide) in the browser. Perfect for sharing quick examples with friends.

Files
- `index.html` — main editor and preview UI
- `style.css` — styling
- `runner.js` — client-side runner and share helpers

Run locally
---------

1. Start a simple HTTP server from the repository root (recommended):

```bash
python3 -m http.server 8000
```

2. Open http://localhost:8000 in your browser.

Notes
- Use the mode selector to pick HTML/CSS/JS/Python.
- For Python, the first run will download Pyodide (WebAssembly) from a CDN — it may take a few seconds.
- Click "Share" to copy a link with the code encoded in the URL hash. Paste and share that URL with friends.

Deploy to GitHub Pages
---------------------

1. Commit and push the repo to GitHub.
2. In the repository settings, enable GitHub Pages from the `main` branch (root). The site will be served at `https://<your-user>.github.io/<repo>/`.

Security
--------

This project runs arbitrary JavaScript in an iframe; do not load untrusted external scripts. The Python support runs in Pyodide inside the browser sandbox.
