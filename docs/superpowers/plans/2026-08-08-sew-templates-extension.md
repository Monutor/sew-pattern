# SEW Templates Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Chrome extension that allows users to create and apply templates for automatically filling document fields in the SEW (Единое рабочее место) platform.

**Architecture:** The extension uses Manifest V3 with an options page for template management, a popup for quick access, and a content script that injects a template selector into SEW's Angular modals using `MutationObserver` and dispatches `input`, `change`, and `blur` events to ensure Angular registers the changes.

**Tech Stack:** Vanilla JavaScript, Chrome Extension Manifest V3, HTML/CSS for UI components.

## Global Constraints

- Use Chrome Extension Manifest V3.
- Templates are stored in `chrome.storage.local` with key `sew_templates`.
- Content script must handle Angular forms by dispatching `input`, `change`, `blur` events with `bubbles: true`.
- UI follows the design in `demo-design.html` and the spec document.

---

### Task 1: Project Setup and Manifest V3 Configuration

**Files:**
- Create: `manifest.json`
- Create: `popup/popup.html`
- Create: `popup/popup.js`
- Create: `options/options.html`
- Create: `options/options.js`
- Create: `content/content.js`
- Create: `styles/styles.css`

**Interfaces:**
- Produces: Extension structure with manifest, popup, options, and content script entry points.

- [ ] **Step 1: Create manifest.json**

Create `manifest.json` with Manifest V3, including permissions: `storage`, `scripting`, `activeTab`. Define host permissions for web pages. Define `options_page`, `popup`, `content_scripts`.

```json
{
  "manifest_version": 3,
  "name": "SEW Templates Automation",
  "version": "1.0",
  "description": "Automate document field filling in SEW platform using templates.",
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "options_page": "options/options.html",
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "SEW Templates"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["styles/styles.css"]
    }
  ]
}
```

- [ ] **Step 2: Create popup.html and popup.js**

Create `popup/popup.html` with a link to the options page and a list of recent templates (or a button to open options). Create `popup/popup.js` to load templates from `chrome.storage.local` and display them or show "No templates yet. Go to Options".

- [ ] **Step 3: Create options.html and options.js**

Create `options/options.html` with the UI for managing templates (list of templates, create/edit form). Create `options/options.js` to handle CRUD operations for templates in `chrome.storage.local`.

- [ ] **Step 4: Create content.js and styles.css**

Create `content/content.js` as the base content script. Create `styles/styles.css` with basic styles for the injected template selector.

### Task 2: Options Page - Template Management UI and Logic

**Files:**
- Modify: `options/options.html`
- Modify: `options/options.js`

**Interfaces:**
- Consumes: None (initial setup)
- Produces: UI and logic for creating, editing, deleting templates. Stores data in `chrome.storage.local` with key `sew_templates`.

- [ ] **Step 1: Write the options.html UI**

Include a header with "Управление шаблонами" and a "+ Создать шаблон" button. Include a container for the template list (`#template-list`). Include a modal or form for creating/editing templates (name, fields mapping).

- [ ] **Step 2: Write the options.js logic - storage and list rendering**

Implement `loadTemplates()` to read from `chrome.storage.local` key `sew_templates`. Render the list in `#template-list`. Implement `saveTemplate(template)` and `deleteTemplate(templateId)`.

- [ ] **Step 3: Test options page locally**

Verify that templates can be created, edited, deleted, and persisted in `chrome.storage.local`.

### Task 3: Content Script - MutationObserver for Modal Detection and UI Injection

**Files:**
- Modify: `content/content.js`
- Modify: `styles/styles.css`

**Interfaces:**
- Consumes: `chrome.storage.local` to read templates.
- Produces: Detection of SEW data filling modals via `MutationObserver`, injection of template selector dropdown into or near the modal.

- [ ] **Step 1: Implement MutationObserver in content.js**

Set up `MutationObserver` to watch for changes in the DOM, specifically looking for modal containers (e.g., elements with classes like `modal`, `dialog`, or Angular-specific selectors).

- [ ] **Step 2: Inject template selector UI**

When a modal is detected, inject a dropdown element (`<select class="sew-template-selector">`) with options loaded from `chrome.storage.local` templates. Position it appropriately (e.g., in the modal header or body).

- [ ] **Step 3: Handle template selection event**

When the user selects a template from the dropdown, trigger the field population logic via message passing or direct function call.

### Task 4: Content Script - Field Population with Angular Event Dispatching

**Files:**
- Modify: `content/content.js`

**Interfaces:**
- Consumes: Selected template data (fields mapping).
- Produces: Setting values into input/textarea fields in the modal and dispatching `input`, `change`, `blur` events with `bubbles: true`.

- [ ] **Step 1: Implement field population logic**

Function `applyTemplateFields(templateData, modalElement)` that iterates over `templateData.fields` (e.g., `{fieldName: 'value'}` or mapping by input placeholders/names/formControlName).

- [ ] **Step 2: Dispatch Angular-compatible events**

For each input found, set `input.value = fieldValue`, then dispatch:
```javascript
const eventKeys = ['input', 'change', 'blur'];
eventKeys.forEach(key => {
  const ev = new Event(key, { bubbles: true });
  input.dispatchEvent(ev);
});
```

- [ ] **Step 3: Verify field population logic**

Ensure the events are correctly dispatched and Angular forms would register the changes in a real SEW environment.

### Task 5: Fallback UI - Floating Action Button (FAB)

**Files:**
- Modify: `content/content.js`
- Modify: `styles/styles.css`

**Interfaces:**
- Produces: A floating button "Шаблоны" that opens the popup or a side panel if modal injection fails.

- [ ] **Step 1: Implement FAB injection in content.js**

Inject a floating button as a persistent element on pages matching the content script matches, outside Angular rendering zones if possible (using `document.body.appendChild`).

- [ ] **Step 2: Handle FAB click to open template selection**

On click, show a list of templates or open the extension popup with template selection via `chrome.action.openPopup()`.
