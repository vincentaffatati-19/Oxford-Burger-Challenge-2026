# Oxford Burger Battle

A mobile-first burger scorecard designed for free hosting on GitHub Pages.

## Files

- `index.html` — app markup
- `styles.css` — app styles
- `app.js` — scoring, local saves, dialogs, and Google Sheets submission
- `Code.gs` — optional Google Apps Script backend for central review storage
- `.nojekyll` — tells GitHub Pages to serve files directly

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload all files from this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save.
7. Open the published site URL.

## Local saves

The app saves reviews to browser local storage on the same device.

## Optional central sync with Google Sheets

1. Create a Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `Code.gs`.
4. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID.
5. Deploy as a **Web app**.
6. Set access to **Anyone with the link**.
7. Copy the web app URL.
8. In the app, open **Sync**, paste the URL, and save it.
9. Use **Submit** to send the current review to the sheet.
