# MDC2 → Material Design 3 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Material Components for Web (MDC2) + hand-written MDC-mimicking CSS with native `<md-*>` web components from `@material/web` via CDN importmap across all three extension pages.

**Architecture:** Each page gets an HTML importmap pointing to `https://esm.run/@material/web/`. Custom div-based MDC2 structures are replaced with semantic `<md-*>` components. ~400 lines of hand-written CSS are removed; only M3 token overrides remain where custom layout is needed.

**Tech Stack:** Chrome Extension MV3, Material Web Components (`@material/web` v1+ via esm.run CDN), vanilla JS, CSS custom properties (M3 tokens)

## Global Constraints

- Use `https://esm.run/@material/web/` via HTML `<script type="importmap">` — no npm bundler
- Default M3 theme (indigo primary); no custom color palette
- Preserve all existing JS logic (loadTemplates, saveTemplate, deleteTemplate, applyTemplate, etc.)
- Update CSP in manifest.json to allow `https://esm.run` for both script-src and style-src
- No MDC2 classes or CDN links should remain after migration
- All text in Russian preserved verbatim

---

### Task 1: Update manifest.json CSP

**Files:**
- Modify: `manifest.json`

**Interfaces:**
- Produces: CSP that allows `https://esm.run` for scripts and styles

- [ ] **Step 1: Update content_security_policy in manifest.json**

Replace the existing `content_security_policy` block with:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' https://esm.run; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://esm.run"
}
```

- [ ] **Step 2: Verify manifest.json is valid JSON**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('manifest.json','utf8')))"`  
Expected: Parsed object with updated CSP values

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "chore: update CSP to allow esm.run for M3 migration"
```

---

### Task 2: Migrate options.html — Modal, buttons, and importmap

**Files:**
- Modify: `options/options.html` (lines 1-10, lines 385-611)

**Interfaces:**
- Consumes: None (standalone HTML structure change)
- Produces: `<md-dialog id="templateModal">` with slot-based structure; `<md-filled-button>` and `<md-outlined-button>` components

- [ ] **Step 1: Replace MDC2 CDN link with importmap**

In the `<head>` section, replace this line:
```html
<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet">
```
With:
```html
<script type="importmap">
  { "imports": { "@material/web/": "https://esm.run/@material/web/" } }
</script>
<script type="module" src="options.js"></script>
```

Also remove the existing `<script src="options.js"></script>` at the bottom of the file (line 613) since it's now loaded as a module in the head. Remove the second `<script>` block (lines 614-650) that handles MDC text field focus/blur — this will be handled differently after migration.

- [ ] **Step 2: Replace the modal overlay structure**

Replace the entire `<div class="modal-overlay" id="templateModal">...</div>` block (lines 386–611) with:

```html
<md-dialog id="templateModal">
  <span class="modal-title" slot="headline" id="modalTitle">Создать шаблон</span>
  <form slot="content" id="templateForm">
    <input type="hidden" id="templateId">

    <div class="modal-body">
      <!-- Template name -->
      <div style="margin-bottom:16px">
        <md-outlined-text-field
          label="Название шаблона *"
          required
          maxlength="50"
          id="templateName"
          name="templateName"
          style="width:100%">
        </md-outlined-text-field>
        <span class="mdc-text-field-character-counter" id="nameCounter">0/50</span>
      </div>

      <!-- Preset selector -->
      <div class="preset-selector">
        <div class="preset-options">
          <div class="preset-option active" data-preset="trn">ТрН</div>
        </div>
      </div>

      <!-- ТрН fields — all 12 fields as md-outlined-text-field -->
      <div id="preset-fields-trn" class="preset-fields-container">
        <div class="field-group-title">Сотрудник, разрешивший отпуск товара</div>
        <div class="field-grid">
          <md-outlined-text-field label="Ф.И.О." name="approvedEmployeeName" data-field="approvedEmployeeName" placeholder="Ф.И.О." style="width:100%"></md-outlined-text-field>
          <md-outlined-text-field label="Должность" name="approvedEmployeePosition" data-field="approvedEmployeePosition" placeholder="Должность" style="width:100%"></md-outlined-text-field>
        </div>

        <div class="field-group-title">Сотрудник, производящий отпуск товара</div>
        <div class="field-grid">
          <md-outlined-text-field label="Ф.И.О." name="performEmployeeName" data-field="performEmployeeName" placeholder="Ф.И.О." style="width:100%"></md-outlined-text-field>
          <md-outlined-text-field label="Должность" name="performEmployeePosition" data-field="performEmployeePosition" placeholder="Должность" style="width:100%"></md-outlined-text-field>
        </div>

        <div class="field-group-title">Сотрудник, осуществляющий транспортировку товара</div>
        <div class="field-grid">
          <md-outlined-text-field label="Ф.И.О." name="agentFullName" data-field="agentFullName" placeholder="Ф.И.О." style="width:100%"></md-outlined-text-field>
          <md-outlined-text-field label="Должность" name="agentPosition" data-field="agentPosition" placeholder="Должность" style="width:100%"></md-outlined-text-field>
        </div>

        <div class="field-group-title">Удостоверительные документы</div>
        <div class="field-grid">
          <md-outlined-text-field label="Удостоверение" name="agentLicense" data-field="agentLicense" placeholder="Удостоверение" style="width:100%"></md-outlined-text-field>
          <md-outlined-text-field label="Номер доверенности" name="attorneyPowerNumber" data-field="attorneyPowerNumber" placeholder="Номер доверенности" style="width:100%"></md-outlined-text-field>
        </div>
        <div class="field-grid">
          <md-outlined-text-field label="Кем выдана" name="attorneyPowerGaveOut" data-field="attorneyPowerGaveOut" placeholder="Кем выдана" style="width:100%"></md-outlined-text-field>
          <md-outlined-text-field label="Дата выдачи" name="attorneyPowerDate" data-field="attorneyPowerDate" type="date" style="width:100%"></md-outlined-text-field>
        </div>

        <div class="field-group-title">Транспортное средство</div>
        <div class="field-grid">
          <md-outlined-text-field label="Марка ТС" name="carModel" data-field="carModel" placeholder="Марка ТС" style="width:100%"></md-outlined-text-field>
        </div>
      </div>
    </div>
  </form>
  <div slot="actions">
    <md-outlined-button id="cancelBtn">Отмена</md-outlined-button>
    <md-filled-button type="submit" form="templateForm">Сохранить</md-filled-button>
  </div>
</md-dialog>
```

- [ ] **Step 3: Keep unchanged** — The template list HTML (lines 374–383 with FAB button), the top app bar, and all CSS styles that are NOT MDC-specific (card styles, empty state, preset selector, etc.) must remain as-is.

- [ ] **Step 4: Verify no MDC2 classes remain in options.html**

Search for `mdc-` in the file. Only allowed matches: none (all should be removed).  
Expected: 0 occurrences of `mdc-`

- [ ] **Step 5: Commit**

```bash
git add options/options.html
git commit -m "feat: replace MDC2 modal and buttons with md-dialog and md-button components"
```

---

### Task 3: Clean up options.html CSS — remove ~250 lines of MDC-mimicking CSS

**Files:**
- Modify: `options/options.html` (style block, lines 10–358)

**Interfaces:**
- Consumes: New `<md-outlined-text-field>` components from Task 2 (which handle their own styling internally)
- Produces: Clean stylesheet with only non-MDC custom styles remaining

- [ ] **Step 1: Remove these CSS blocks entirely:**
  - `.modal-body .mdc-text-field` (lines 127–129)
  - `.mdc-text-field--outlined` through `.mdc-text-field__icon--trailing:hover` (lines 131–340 — the entire outlined text field implementation including notched outline, floating labels, leading icons, character counter, trailing icons)
  - `.modal-full-width` utility (line 343)

- [ ] **Step 2: Keep these CSS blocks unchanged:**
  - Top app bar styles (lines 19–20)
  - Card list and card styles (lines 22–75)
  - Empty state, error state styles (lines 78–83)
  - FAB wrap styles (line 86)
  - Modal overlay positioning (lines 89–110 — keep the overlay backdrop and modal box shadow; md-dialog handles its own overlay but we keep the page-level modal wrapper if needed, or remove entirely since md-dialog is self-contained)
  - Field group title styles (lines 113–118)
  - Field grid styles (line 121–122)
  - Preset selector styles (lines 349–357)

- [ ] **Step 3: Remove the entire `.modal-overlay` / `.modal` block** (lines 89–110) since `<md-dialog>` is self-contained and doesn't need a wrapper overlay.

- [ ] **Step 4: Verify styles.css still has all non-MDC styles**

Check that card, empty-state, preset-selector, field-group-title, and fab-wrap styles are preserved.  
Expected: ~100 lines of CSS remain (down from ~350)

- [ ] **Step 5: Commit**

```bash
git add options/options.html
git commit -m "feat: remove hand-written MDC2 CSS, rely on md-outlined-text-field built-in styles"
```

---

### Task 4: Update options.js for md-dialog API

**Files:**
- Modify: `options/options.js`

**Interfaces:**
- Consumes: `<md-dialog id="templateModal">` from Task 2
- Produces: Dialog open/close using `.show()` and `.close()` instead of classList toggling

- [ ] **Step 1: Replace modal open calls**

In `openCreateModal()` (line 122), replace:
```javascript
templateModal.classList.add('active');
```
With:
```javascript
document.getElementById('templateModal').show();
```

In `openEditModal()` (line 134), replace:
```javascript
templateModal.classList.add('active');
```
With:
```javascript
document.getElementById('templateModal').show();
```

- [ ] **Step 2: Replace modal close calls**

In `closeModals()` (lines 143–145), replace:
```javascript
function closeModals() {
    templateModal.classList.remove('active');
}
```
With:
```javascript
function closeModals() {
    document.getElementById('templateModal').close();
}
```

- [ ] **Step 3: Replace the overlay click handler**

Replace lines 206–210:
```javascript
templateModal.addEventListener('click', (e) => {
    if (e.target === templateModal) {
        closeModals();
    }
});
```
With:
```javascript
document.getElementById('templateModal').addEventListener('close', () => {
    // dialog was closed
});
```

- [ ] **Step 4: Update getFieldsFromForm to query md-outlined-text-field inputs**

Replace lines 37–46:
```javascript
function getFieldsFromForm() {
    const fields = {};
    document.querySelectorAll('.preset-input').forEach(input => {
        const val = input.value.trim();
        if (val) {
            fields[input.dataset.field] = val;
        }
    });
    return fields;
}
```
With:
```javascript
function getFieldsFromForm() {
    const fields = {};
    document.querySelectorAll('md-outlined-text-field').forEach(field => {
        const input = field.querySelector('input');
        if (!input) return;
        const val = input.value.trim();
        if (val) {
            fields[field.dataset.field] = val;
        }
    });
    return fields;
}
```

- [ ] **Step 5: Update setFormValues to target md-outlined-text-field inputs**

Replace lines 48–53:
```javascript
function setFormValues(fields) {
    document.querySelectorAll('.preset-input').forEach(input => {
        const key = input.dataset.field;
        input.value = fields[key] || '';
    });
}
```
With:
```javascript
function setFormValues(fields) {
    document.querySelectorAll('md-outlined-text-field').forEach(field => {
        const key = field.dataset.field;
        const input = field.querySelector('input');
        if (input) input.value = fields[key] || '';
    });
}
```

- [ ] **Step 6: Verify all other logic is unchanged**

Confirm: loadTemplates, renderTemplateList, saveTemplate, deleteTemplate, updateCounter, preset selector handler, event listeners for createTemplateBtn/closeModalBtn/cancelBtn/templateForm — all remain identical.

- [ ] **Step 7: Commit**

```bash
git add options/options.js
git commit -m "feat: update options.js for md-dialog API and md-outlined-text-field selectors"
```

---

### Task 5: Migrate popup.html — importmap, top bar, list items

**Files:**
- Modify: `popup/popup.html`

**Interfaces:**
- Consumes: None (standalone)
- Produces: Importmap for material-web; `<md-list>` / `<md-list-item>` structure

- [ ] **Step 1: Replace MDC2 CDN link with importmap**

Replace lines 7–9:
```html
<!-- Material Design 2 -->
<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```
With:
```html
<script type="importmap">
  { "imports": { "@material/web/": "https://esm.run/@material/web/" } }
</script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace top app bar with simple M3-styled flexbar**

Replace lines 108–124 with:
```html
<div style="display:flex;align-items:center;height:48px;padding:0 16px;background:var(--md-sys-color-surface,#fafafa);color:var(--md-sys-color-on-surface,#212121);font-size:14px;font-weight:500;">
  <span style="flex:1">Шаблоны</span>
  <md-icon-button id="openOptions" title="Настройки" aria-label="Открыть настройки">
    <md-icon>settings</md-icon>
  </md-icon-button>
</div>
```

- [ ] **Step 3: Replace card list container — keep the div but update CSS**

Keep `<div id="templateList" class="template-card-list"></div>` as-is. The JS (Task 7) will create `<md-list-item>` elements inside it. Update the CSS for `.template-card-list` on line 26 to:
```css
.template-card-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 360px; overflow-y: auto; }
```

- [ ] **Step 4: Add minimal M3 icon button styles**

Add after line 105 (before `</style>`):
```css
md-icon-button { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; color: var(--md-sys-color-on-surface, #212121); display: flex; align-items: center; justify-content: center; }
md-icon-button:hover { background: rgba(0,0,0,0.08); }
md-icon { font-size: 24px; }
```

- [ ] **Step 5: Commit**

```bash
git add popup/popup.html
git commit -m "feat: replace MDC2 with importmap and md-components in popup"
```

---

### Task 6: Update popup.js for md-list-item

**Files:**
- Modify: `popup/popup.js`

**Interfaces:**
- Consumes: `<md-list>` container from Task 5
- Produces: DOM created with `<md-list-item clickable>` instead of `.template-card.mdc-elevation--z2`

- [ ] **Step 1: Replace card creation in the template loop**

Replace lines 29–50:
```javascript
for (var i = 0; i < templates.length; i++) {
    var tpl = templates[i];
    var card = document.createElement('div');
    card.className = 'template-card mdc-elevation--z2';
    card.dataset.templateId = tpl.id;
    card.innerHTML =
        '<div class="card-row">' +
            '<div class="card-icon-wrap"><span class="material-icons" aria-hidden="true">assignment</span></div>' +
            '<span class="card-text">' + escapeHtml(tpl.name || 'Без имени') + '</span>' +
        '</div>';
    card.addEventListener('click', function() {
        var id = this.dataset.templateId;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applyTemplate',
                    templateId: id
                });
            }
        });
    });
    templateList.appendChild(card);
}
```

With:
```javascript
for (var i = 0; i < templates.length; i++) {
    var tpl = templates[i];
    var item = document.createElement('md-list-item');
    item.setAttribute('clickable', '');
    item.dataset.templateId = tpl.id;
    item.innerHTML =
        '<span slot="headline">' + escapeHtml(tpl.name || 'Без имени') + '</span>';
    item.addEventListener('click', function() {
        var id = this.dataset.templateId;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applyTemplate',
                    templateId: id
                });
            }
        });
    });
    templateList.appendChild(item);
}
```

- [ ] **Step 2: Wrap list items in <md-list>**

Update line 28 (`templateList.innerHTML = '';`) to:
```javascript
templateList.innerHTML = '<md-list></md-list>';
var mList = templateList.querySelector('md-list');
```
Then in the for loop (step 1), change `templateList.appendChild(item)` to `mList.appendChild(item)`.

- [ ] **Step 3: Update empty state to use md-list-item**

Replace lines 20–25:
```javascript
templateList.innerHTML =
    '<div class="empty-state">' +
        '<span class="material-icons" aria-hidden="true">description</span>' +
        '<p>Нет шаблонов.<br>Откройте настройки для создания.</p>' +
    '</div>';
```
With:
```javascript
templateList.innerHTML =
    '<md-list><md-list-item><span slot="headline" style="color:#757575;font-size:13px">Нет шаблонов.<br>Откройте настройки для создания.</span></md-list-item></md-list>';
```

- [ ] **Step 4: Commit**

```bash
git add popup/popup.js
git commit -m "feat: use md-list and md-list-item in popup.js"
```

---

### Task 7: Update styles.css with M3 tokens

**Files:**
- Modify: `styles/styles.css`

**Interfaces:**
- Consumes: Existing class names (sew-fab, template-selector, sew-fab-panel-*) unchanged
- Produces: CSS using `--md-sys-color-*` tokens instead of hardcoded colors

- [ ] **Step 1: Update .sew-fab background color**

Replace line 54:
```css
    background-color: #3498db;
```
With:
```css
    background-color: var(--md-sys-color-primary, #0061a4);
```

Replace line 68:
```css
    background-color: #2980b9;
```
With:
```css
    background-color: var(--md-sys-color-primary-dark, #00479b);
```

- [ ] **Step 2: Update .template-selector colors**

Replace lines 4–5:
```css
    background: #fff3cd;
    border: 1px solid #ffc107;
```
With:
```css
    background: var(--md-sys-color-secondary-container, #e8f0fe);
    border: 1px solid var(--md-sys-color-on-secondary-container, #001d35);
```

Replace line 16:
```css
    color: #856404;
```
With:
```css
    color: var(--md-sys-color-on-secondary-container, #001d35);
```

- [ ] **Step 3: Update .template-dropdown focus**

Replace lines 33–34:
```css
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
```
With:
```css
    border-color: var(--md-sys-color-primary, #0061a4);
    box-shadow: 0 0 0 3px rgba(0, 97, 164, 0.1);
```

- [ ] **Step 4: Update .sew-fab-panel-item hover**

Replace lines 122–124:
```css
.sew-fab-panel-item:hover {
    background-color: #eaf4fd;
    color: #2980b9;
}
```
With:
```css
.sew-fab-panel-item:hover {
    background-color: var(--md-sys-color-hover, rgba(0,0,0,0.08));
    color: var(--md-sys-color-primary, #0061a4);
}
```

- [ ] **Step 5: Add M3 shape and elevation tokens at top of file**

Add after line 1 (`/* SEW Templates Extension Styles */`):
```css
/* M3 Design Tokens */
:root {
  --md-sys-color-primary: #0061a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #d3e5ff;
  --md-sys-color-on-primary-container: #001d35;
  --md-sys-color-secondary: #526070;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #d6e4f2;
  --md-sys-color-on-secondary-container: #0e1d2a;
  --md-sys-color-surface: #fafafa;
  --md-sys-color-on-surface: #212121;
  --md-sys-color-surface-variant: #e1e2ec;
  --md-sys-color-on-surface-variant: #44474f;
  --md-sys-color-outline: #74777f;
  --md-sys-color-hover: rgba(0,0,0,0.08);
  --md-sys-color-focus: rgba(0,0,0,0.12);
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
}
```

- [ ] **Step 6: Commit**

```bash
git add styles/styles.css
git commit -m "feat: update styles.css with M3 design tokens"
```

---

### Task 8: Final verification — load all pages and check for errors

**Files:**
- No file changes
- Manual verification only

**Interfaces:**
- Consumes: All previous tasks complete

- [ ] **Step 1: Load options.html in Chrome with extension loaded**

Open `chrome://extensions`, enable Developer Mode, click "Reload" on the SEW Templates extension. Then open options page via "Details → Extension options".  
Expected: Page loads without console errors; modal opens when clicking FAB; form fields render as M3 outlined text fields; save/delete works.

- [ ] **Step 2: Test create template flow**

Click FAB → "Шаблон"; fill in name and at least one field; click "Сохранить".  
Expected: Dialog closes; card appears in list with correct name and field count.

- [ ] **Step 3: Test edit template flow**

Click on an existing card; verify all fields pre-fill correctly; modify a field; save.  
Expected: Changes persist; field count updates.

- [ ] **Step 4: Load popup.html**

Click the extension icon.  
Expected: Popup opens; top bar shows "Шаблоны" with settings gear; template list uses md-list-item; clicking a template sends message to content script.

- [ ] **Step 5: Verify no MDC2 references remain**

Run: `grep -r "mdc-" options/ popup/`  
Expected: 0 matches (or only in comments/docs, not in live code)

- [ ] **Step 6: Commit any fixups**

```bash
git add -u
git commit -m "chore: final verification fixes for M3 migration"
```
