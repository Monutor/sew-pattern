# Web Extension for SEW Templates Automation - Design Document

**Date:** 2026-08-08  
**Topic:** Chrome Extension for automating document field filling in SEW (Единое рабочее место) platform using templates.

## 1. Architecture and Components

### 1.1 Manifest V3 (`manifest.json`)
- Permissions: `storage` (for template management), `scripting`/`activeTab` (for page interaction and content script injection).
- Host permissions for the SEW platform domain(s).

### 1.2 Options Page (`options.html`, `options.js`)
- Full interface for creating, editing, and deleting templates.
- Each template contains a name and a set of "field - value" pairs.
- Data is saved to `chrome.storage.local`.

### 1.3 Popup (`popup.html`, `popup.js`)
- Quick menu when clicking the extension icon with a list of recent templates or a link to the options page.

### 1.4 Content Script (`content.js`)
- Script injected into SEW platform pages.
- Tracks the appearance of data filling modals using `MutationObserver`.
- Manages template application UI and field population logic.

## 2. Integration Approach with Angular (SEW Platform)

Since SEW is built on Angular, simply setting `element.value = '...'` may not work — Angular won't "see" the changes and won't update the form state.

### Primary Approach: UI Injection into Modal + Angular Events
- The content script uses `MutationObserver` to track the appearance of the data filling modal in the DOM.
- Upon detecting the modal, the script injects a control element (e.g., a dropdown "Select Template") into the modal's header or footer, or as a floating panel above it.
- **Field Population:** The script finds inputs/textarea in the modal by selectors (`[formControlName="..."]`, `[name="..."]`, `input[type="text"]`) and sets the values. To ensure Angular reacts, after setting the value, the script sequentially generates events: `input`, `change`, `blur` with the flag `bubbles: true`.

### Fallback Approach: Floating Action Button (FAB) + Popup
- If injection into the Angular modal is technically impossible due to component isolation or Shadow DOM, the content script adds a floating button "Templates" outside the Angular rendering zone on the SEW page.
- Upon clicking, it opens a side panel or uses the extension's standard `popup`, where the user selects a template. The script then attempts to fill fields based on currently focused elements or the current modal's structure.

## 3. Storage and Template Management

- Templates are stored locally in the browser via `chrome.storage.local`.
- On the `options.html` page, the user sees a list of templates, can open any for editing fields and values, save a new one, or delete an existing template.
- Each template entry includes:
  - Template Name (string)
  - Fields mapping (object/array of `{fieldName: "value"}`)

## 4. Data Flow

1. User creates/edits templates via `options.html`. Data is saved to `chrome.storage.local`.
2. User navigates to SEW platform page with a data filling modal.
3. `content.js` detects the modal via `MutationObserver`.
4. `content.js` injects the template selector UI into or near the modal.
5. User selects a template from the dropdown.
6. `content.js` reads the selected template's data from `chrome.storage.local` (or via message passing if stored in extension context).
7. `content.js` locates the target input fields in the modal and applies the values, dispatching necessary events (`input`, `change`, `blur`) for Angular to register the changes.
8. User confirms/fills remaining data and saves via SEW's native "Save" button.

## 5. Error Handling and Edge Cases

- **Modal not detected:** Fallback to FAB or manual popup selection.
- **Angular state not updated:** Ensure event dispatching includes `bubbles: true` and `detail` properties if required by Angular forms (`ngModelChange`, `onChange`).
- **Template not found or corrupted storage:** Show notification in options page or fallback to empty fields.
- **Multiple modals open:** `MutationObserver` should target the currently active or recently opened modal.
