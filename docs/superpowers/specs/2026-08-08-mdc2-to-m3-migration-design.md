# MDC2 → Material Design 3 Migration

**Date:** 2026-08-08  
**Status:** Approved  
**Scope:** All three extension pages (options, popup, content)

---

## Goal

Replace Material Components for Web (MDC2) + custom CSS with native Material Design 3 web components from `@material/web` via CDN importmap. Remove ~400 lines of hand-written MDC-mimicking CSS. Preserve all existing JS logic.

---

## Approach: Component-Based Migration

Full replacement of custom div-based MDC2 structures with `<md-*>` web components. No bundler — CDN via importmap.

**Library:** `@material/web` v1+  
**Delivery:** `https://esm.run/@material/web/` via HTML importmap  
**Theme:** Default M3 (indigo primary, no custom palette)

---

## Changes by File

### manifest.json

Add `https://esm.run` to CSP:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' https://esm.run; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://esm.run"
}
```

---

### options/options.html

**Remove:**
- `<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css">`
- All custom CSS for `.mdc-text-field--outlined`, `.mdc-floating-label`, `.mdc-notched-outline`, `.mdc-text-field-character-counter`, `.mdc-top-app-bar` (~250 lines)

**Add (in `<head>`):**
```html
<script type="importmap">
  { "imports": { "@material/web/": "https://esm.run/@material/web/" } }
</script>
```

**Replace HTML structures:**

| Component | Before | After |
|---|---|---|
| Template name field | `<div class="mdc-text-field mdc-text-field--outlined mdc-text-field--with-leading-icon ...">` with notched-outline, floating label, leading icon, character counter | `<md-outlined-text-field label="Название шаблона *" required maxlength="50" id="templateName" name="templateName"></md-outlined-text-field>` + separate `<span id="nameCounter">0/50</span>` for counter |
| Each preset field (12 total) | Same MDC2 div pattern with notched-outline, floating label, leading icon | `<md-outlined-text-field label="..." name="fieldName" data-field="fieldName"></md-outlined-text-field>` |
| Cancel button | `<button class="mdc-button mdc-button--outlined" id="cancelBtn">` | `<md-outlined-button id="cancelBtn">Отмена</md-outlined-button>` |
| Save button | `<button class="mdc-button mdc-button--raised mdc-button--primary">` | `<md-filled-button type="submit">Сохранить</md-filled-button>` |
| Modal overlay + modal div | `<div class="modal-overlay" id="templateModal"><div class="modal">...<form id="templateForm">...</form></div></div>` | `<md-dialog id="templateModal"><span slot="headline" id="modalTitle">Создать шаблон</span><form slot="content" id="templateForm">...</form><div slot="actions"><md-outlined-button id="cancelBtn">Отмена</md-outlined-button><md-filled-button type="submit" form="templateForm">Сохранить</md-filled-button></div></md-dialog>` |

**Keep unchanged:**
- Preset selector (`.preset-selector`, `.preset-options`, `.preset-option`) — no M3 equivalent needed, custom pill-style is fine
- Field group titles (`.field-group-title`) — plain text headers
- `.card-row`, `.card-icon-wrap`, `.card-text`, `.card-meta`, `.icon-btn` styles for template list cards
- `.empty-state`, `.error-state` styles
- FAB button styling

---

### options/options.js

**Changes (~10 lines):**

```javascript
// Before:
templateModal.classList.add('active');
// After:
document.getElementById('templateModal').show();

// Before:
templateModal.classList.remove('active');
// After:
document.getElementById('templateModal').close();
```

All other logic (loadTemplates, saveTemplate, deleteTemplate, setFormValues, getFieldsFromForm, updateCounter) — unchanged.

---

### popup/popup.html

**Remove:**
- MDC2 CSS link
- Custom `.mdc-top-app-bar` styles (~15 lines)
- All custom card styles that duplicate MDC behavior

**Add (in `<head>`):**
```html
<script type="importmap">
  { "imports": { "@material/web/": "https://esm.run/@material/web/" } }
</script>
```

**Replace:**
| Before | After |
|---|---|
| MDC2 top app bar div structure | Flexbox top bar using `--md-sys-color-surface` / `--md-sys-color-on-surface` tokens |
| `.template-card.mdc-elevation--z2` with custom JS click handlers | `<md-list><md-list-item clickable>...</md-list-item></md-list>` |

**Minimal CSS needed:** top bar height, list padding, M3 color tokens.

---

### popup/popup.js

**Changes (~5 lines):** Replace `card.className = 'template-card mdc-elevation--z2'` with `<md-list-item clickable>` creation. All other logic unchanged.

---

### content/content.js

**No JS changes.** Logic preserved as-is.

---

### styles/styles.css

Update color tokens to M3 system colors:

```css
/* Before */
.sew-fab { background-color: #3498db; }
.template-selector { background: #fff3cd; border: 1px solid #ffc107; }
.sew-fab-panel-item:hover { background-color: #eaf4fd; color: #2980b9; }

/* After */
.sew-fab { background-color: var(--md-sys-color-primary, #0061a4); }
.template-selector { background: var(--md-sys-color-secondary-container, #e8f0fe); border-color: var(--md-sys-color-on-secondary-container, #001d35); }
.sew-fab-panel-item:hover { background-color: var(--md-sys-color-hover, rgba(0,0,0,0.08)); }
```

Keep all structural/layout CSS (positioning, sizing, transitions) unchanged.

---

## What Stays Custom

- **Preset selector pills** — no M3 chip component needed for this simple use case
- **Field group titles** — plain `.field-group-title` headers
- **Template list cards** in popup — custom layout is intentional, not MDC-dependent
- **FAB panel** in content.js — dynamic DOM injection, keep current structure with updated tokens
- **Template selector banner** in content.js — context-specific styling for SEW platform

---

## Verification Checklist

- [ ] `options.html` loads without console errors
- [ ] Modal opens/closes correctly (create + edit)
- [ ] Character counter updates on name input
- [ ] Form validation works (empty name, no fields)
- [ ] Templates save to `chrome.storage.local` and persist
- [ ] Edit pre-fills all 12 fields correctly
- [ ] `popup.html` renders template list with clickable items
- [ ] Content script FAB and panel work on target pages
- [ ] No MDC2 classes remain in HTML
- [ ] CSP allows esm.run scripts/styles
