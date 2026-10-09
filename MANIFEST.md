# Manifest guide

`manifest.json` must remain strict JSON for Chrome to load the extension, so it
cannot include comments. This guide explains its readable sections.

- **Name and version** identify the extension in `chrome://extensions`.
- **Permissions** let NUTSHELL open from the toolbar, inspect the current page,
  store its settings, add the selected-text menu item, and open a compact
  fallback window when a page cannot host the sidebar.
- **Host permissions** allow the page-reading and approved autofill actions on
  regular websites. Browser internal pages cannot be read by any extension.
- **Background** starts `background.js`, which opens the sidebar or its full
  workspace fallback.
- **Web-accessible resources** permit the injected sidebar to load its own UI
  files on a page.
- **Action and icons** control the toolbar button and its image.
