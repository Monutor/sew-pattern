# SEW Templates Extension — Agent Notes

## Project at a glance

Chrome Manifest V3 extension. Vanilla JS, no build step, no dependencies. Injects into `https://sew.mvideoeldorado.ru/*` (SEW platform) to auto-fill Angular forms using user-created templates.

**Root:** `J:\Front-end-projects\AIDevelops\web-extension\SEW-Pattern\`

---

## Architecture

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest — permissions, CSP, content_scripts entry |
| `content/content.js` | Content script: MutationObserver detects modals, injects template selector UI, fills Angular form fields |
| `popup/popup.html + popup.js` | Extension icon popup — lists templates, clicking one sends `applyTemplate` message to content script |
| `options/options.html + options.js` | Template CRUD page (create/edit/delete/duplicate/import/export). Saved in `chrome.storage.local.sew_templates` |
| `styles/styles.css` | Shared styles used by content script injected UI and options page |

**Data shape:** `chrome.storage.local.get('sew_templates')` → array of `{id: string, name: string, preset: 'trn', fields: {fieldName: value}}`. Must remain backward-compatible — never change this format.

---

## Development commands

```bash
# Syntax check all JS files (no npm/lint setup)
node --check content/content.js && node --check popup/popup.js && node --check options/options.js
```

**Loading in Chrome:** `chrome://extensions` → Enable "Developer mode" → "Load unpacked" → select the repo root. Reload after every change.

---

## Angular form-filling rules (content.js)

SEW is an Angular app. Setting `.value = ...` alone does **not** update Angular's internal state. Every `setFieldValue()` call must dispatch events in this order with `{bubbles: true}`:
1. `input` event
2. `change` event
3. `CustomEvent('ngModelChange', {detail: value})`
4. Direct call to `ngControl.viewToModelUpdate(value)` if available

Date inputs need special handling: `formatDateRU()` converts between `YYYY-MM-DD` (stored) and `DD.MM.YYYY` (display). Never skip this for `[type="date"]` or fields with date-like placeholders/labels.

---

## Storage API — always check runtime errors

The codebase moved from silent `catch(e){}` to checking `chrome.runtime.lastError` on every `storage.get` / `storage.set` call (see feature 8 spec). New storage interactions must follow the same pattern:

```js
chrome.storage.local.get(['sew_templates'], (result) => {
    if (chrome.runtime.lastError) { /* show toast or log */ return; }
    // use result.sew_templates
});
```

---

## Context invalidation handling (content.js)

If the content script's context is invalidated (page navigates, extension reloads), `chrome.storage` calls throw with "context invalidated". Wrap all such calls and show the toast:
> «Расширение перезапущено — обновите страницу»

---

## Style conventions

- **No frameworks.** Plain DOM APIs only.
- Use existing M3 design tokens from `styles/styles.css` (`--md-sys-color-*`, `--md-sys-shape-corner-*`). Do not invent new token names without updating CSS too.
- All UI text is in Russian. Don't add English strings to user-facing elements.
- SVG icons are inline in HTML/JS (no icon font, no external sprite). Copy the existing viewBox patterns when adding new icons.
- Popup width: fixed 320px. Options page: full-width responsive.

---

## Modal detection logic (content.js)

`MutationObserver` on `document.body` watches for:
- `.mat-drawer.mat-drawer-opened` — Angular Material drawer (most common)
- `.mat-dialog-container` with SEW form inputs inside
- `.cdk-overlay-pane` with SEW form inputs inside

Injected selector is guarded by checks for `[formcontrolname]`, `[class*="shp-"]`, or `form.main`. Don't inject into arbitrary modals — the guard prevents noise.

---

## Where specs live

Design and enhancement docs are in `docs/superpowers/specs/` and `docs/superpowers/plans/`. They describe features already implemented; reference them when extending existing functionality.
