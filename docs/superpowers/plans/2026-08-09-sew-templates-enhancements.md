# SEW Templates Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить пять улучшений в расширение SEW Templates Automation: импорт/экспорт шаблонов, дубликат и перестановку карточек (drag-and-drop), обработку ошибок chrome.*, сужение host_permissions до домена SEW, иконки в manifest.

**Architecture:** Vanilla JS MV3. Основные изменения в `options/options.js`/`options.html` (импорт/экспорт, дубликат, порядок), `popup/popup.js` и `content/content.js` (обработка lastError), `manifest.json` (permissions + icons). PNG-иконки генерируются из предоставленного SVG через Playwright (canvas-растеризация) и сохраняются в `icons/`.

**Tech Stack:** Vanilla JavaScript, Chrome Manifest V3, HTML/CSS, Playwright (только для генерации иконок), PowerShell (base64-декодирование PNG).

## Global Constraints

- Format данных `sew_templates` (массив `{id, name, preset, fields}`) менять НЕЛЬЗЯ.
- Проект — vanilla JS, без сборки, ЦД, npm-скриптов и git-репозитория. Команда верификации — `node --check <file>`.
- Уведомления в UI — через существующий `showToast(message)` в `options.js`.
- UI-элементы — в стиле M3 (переменные `--md-sys-*`), язык интерфейса — русский.
- `id` нового шаблона всегда `Date.now().toString()`, `preset` — `'trn'` (как в существующем коде).

---

### Task 1: Иконки расширения (SVG → PNG + manifest)

**Files:**
- Create: `icons/icon-source.svg`
- Create: `icons/icon16.png`, `icons/icon32.png`, `icons/icon48.png`, `icons/icon128.png`
- Modify: `manifest.json`

**Interfaces:**
- Consumes: SVG-файл (источник из-под репозитория, «feature 12» дизайн-спеки).
- Produces: `icons/icon16.png` … `icons/icon128.png` + блок `"icons"` в `manifest.json`.

- [ ] **Step 1: Сохранить исходный SVG**

Создать `icons/icon-source.svg` с содержимым:

```xml
<?xml version="1.0" encoding="utf-8"?>
<svg width="800px" height="800px" viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M899.984 19.873h-3.452c-26.123 0-47.296 21.172-47.296 47.296v888.508c0 26.127 21.173 47.298 47.296 47.298h3.452c26.119 0 47.297-21.171 47.297-47.298V67.169c0-26.124-21.177-47.296-47.297-47.296z" fill="#4A5699" /><path d="M132.643 19.873h-3.449c-26.12 0-47.296 21.172-47.296 47.296v888.508c0 26.127 21.177 47.298 47.296 47.298h3.449c26.123 0 47.299-21.171 47.299-47.298V67.169c0-26.124-21.176-47.296-47.299-47.296z" fill="#C45FA0" /><path d="M899.463 19.873H129.194c-26.12 0-47.296 21.172-47.296 47.296v3.377c0 26.12 21.177 47.299 47.296 47.299h770.269c26.123 0 47.296-21.179 47.296-47.299v-3.377c0-26.124-21.173-47.296-47.296-47.296z" fill="#6277BA" /><path d="M899.463 905.006H129.194c-26.12 0-47.296 21.17-47.296 47.29v3.381c0 26.127 21.177 47.298 47.296 47.298h770.269c26.123 0 47.296-21.171 47.296-47.298v-3.381c0-26.12-21.173-47.29-47.296-47.29z" fill="#C45FA0" /><path d="M717.962 543.153H542.047c-26.121 0-47.298 21.175-47.298 47.297v3.724c0 26.123 21.177 47.293 47.298 47.293h175.915c26.121 0 47.297-21.17 47.297-47.293v-3.724c0-26.122-21.176-47.297-47.297-47.297z" fill="#E5594F" /><path d="M689.268 198.849H513.355c-26.122 0-47.298 21.175-47.298 47.297v3.722c0 26.12 21.176 47.297 47.298 47.297h175.912c26.122 0 47.298-21.177 47.298-47.297v-3.722c0-26.122-21.175-47.297-47.297-47.297z" fill="#F0D043" /><path d="M757.789 353.081H261.17c-26.121 0-47.297 21.172-47.297 47.296v3.377c0 26.121 21.177 47.299 47.297 47.299h496.619c26.121 0 47.296-21.178 47.296-47.299v-3.377c0-26.125-21.175-47.296-47.296-47.296z" fill="#E5594F" /><path d="M762.638 726.225h-496.62c-26.12 0-47.294 21.18-47.294 47.301v3.377c0 26.12 21.174 47.3 47.294 47.3h496.62c26.122 0 47.296-21.18 47.296-47.3v-3.377c0-26.122-21.174-47.301-47.296-47.301z" fill="#6277BA" /><path d="M355.734 543.328H281.41c-26.122 0-47.297 21.17-47.297 47.293v3.378c0 26.118 21.175 47.297 47.297 47.297h74.324c26.123 0 47.296-21.179 47.296-47.297v-3.378c0-26.123-21.174-47.293-47.296-47.293z" fill="#F39A2B" /><circle cx="334.85" cy="248.006" r="48.986" fill="#F39A2B" /></svg>
```

- [ ] **Step 2: Сгенерировать PNG через Playwright (canvas)**

Использовать `playwright_browser_run_code_unsafe` с такой функцией (отдаёт объект `{size: dataURL}`):

```javascript
async (page) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path d="M899.984 16.873h-3.452c-26.123 0-47.296 21.172-47.296 47.296v888.508c0 26.127 21.173 47.298 47.296 47.298h3.452c26.119 0 47.297-21.171 47.297-47.297V67.169c0-26.124-21.177-47.296-47.297-47.296z" fill="#4A5699"/><path d="M132.643 16.873h-3.449c-26.12 0-47.296 21.172-47.296 47.296v888.508c0 26.127 21.177 47.298 47.296 47.298h3.449c26.123 0 47.299-21.171 47.299-47.298V22.169c0-26.124-21.176-47.296-47.299-47.296z" fill="#C45FA0"/><path d="M899.463 19.873H129.194c-26.12 0-47.296 21.172-47.296 47.296v3.377c0 26.12 21.177 47.299 47.296 47.299h770.269c26.123 0 47.296-21.179 47.296-47.299v-3.377c0-26.124-21.173-47.296-47.296-47.296z" fill="#6277BA"/><path d="M899.463 905.006H129.194c-26.12 0-47.296 21.17-47.296 47.29v3.381c0 26.122 21.177 47.298 47.296 47.298h770.269c26.123 0 47.296-21.171 47.296-47.298v-3.381c0-26.122-21.173-47.29-47.296-47.29z" fill="#C45FA0"/><path d="M717.962 543.153H542.047c-26.121 0-47.298 21.175-47.298 47.297v3.724c0 26.123 21.177 47.293 47.298 47.293h175.915c26.121 0 47.297-21.17 47.297-47.293v-3.724c0-26.122-21.176-47.297-47.297-47.297z" fill="#E5594F"/><path d="M689.268 198.849H513.355c-26.122 0-47.298 21.175-47.298 47.297v3.722c0 26.123 21.176 47.297 47.298 47.297h175.912c26.122 0 47.298-21.177 47.298-47.297v-3.722c0-26.122-21.175-47.297-47.297-47.297z" fill="#F0D043"/><path d="M757.789 353.081H261.17c-26.121 0-47.297 21.172-47.297 47.296v3.377c0 26.121 21.172 47.299 47.297 47.299h496.619c26.121 0 47.296-21.178 47.296-47.299v-3.377c0-26.125-21.175-47.296-47.296-47.296z" fill="#E5594F"/><path d="M762.638 726.225h-496.62c-26.12 0-47.294 21.18-47.294 47.301v3.377c0 26.122 21.175 47.3 47.294 47.3h496.62c26.122 0 47.296-21.18 47.296-47.3v-3.377c0-26.122-21.174-47.301-47.296-47.301z" fill="#6277BA"/><path d="M355.734 543.328H281.41c-26.122 0-47.297 21.17-47.297 47.293v3.378c0 26.124 21.175 47.297 47.297 47.297h74.324c26.123 0 47.296-21.179 47.296-47.297v-3.378c0-26.123-21.174-47.293-47.296-47.293z" fill="#F39A2B"/><circle cx="334.852" cy="248.006" r="48.986" fill="#F39A2B"/></svg>`;
  const out = {};
  for (const size of [16, 32, 48, 128]) {
    await page.setContent(`<body style="margin:0"></body>`);
    out[size] = await page.evaluate(async ({ svg, size }) => {
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
      const c = document.createElement('canvas'); c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      return c.toDataURL('image/png');
    }, { svg, size });
  }
  return out;
}
```

- [ ] **Step 3: Декодировать PNG в `icons/`**

Для каждого размера убрать префикс `data:image/png;base64,` и сохранить бинарник. Пример для извлечённого base64 (PowerShell, файл должен быть строго PNG):

```powershell
$b64 = "<base64 из результата для 16>"
[IO.File]::WriteAllBytes("J:\Front-end-projects\AIDevelops\web-extension\test\icons\icon16.png", [Convert]::FromBase64String($b64))
```

Повторить для 32/48/128.

- [ ] **Step 4: Проверить PNG**

```powershell
Get-ChildItem icons\*.png | Select-Object Name, Length
[IO.File]::ReadAllBytes(...)[0..1] -join ','   # должно быть ... 137,80 (PNG magic)
```

Переименовать/убедиться, что преамбула `89 50 4E 47`.

- [ ] **Step 5: Добавить `icons` в manifest.json**

```json
"icons": {
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
},
```

- [ ] **Step 6: Syntax-check**

`node --check` не нужен (строки), но убедиться, что `manifest.json` валиден JSON (через `Get-Content -Raw | ConvertFrom-Json`).

---

### Task 2: Сужение разрешений до домена SEW (manifest.json)

**Files:**
- Modify: `manifest.json`

**Interfaces:**
- Produces: контент-скрипт и host-права только на `https://sew.mvideoeldorado.ru/*`.

- [ ] **Step 1: Заменить `host_permissions`**

```json
"host_permissions": ["https://sew.mvideoeldorado.ru/*"]
```

- [ ] **Step 2: Заменить `content_scripts[0].matches`**

```json
"matches": ["https://sew.mvideoeldorado.ru/*"]
```

- [ ] **Step 3: Проверка**

`ConvertFrom-Json` без ошибок; убедиться, что остались `storage`, `scripting`, `activeTab`, `options_ui`, `action`.

---

### Task 3: Импорт/экспорт шаблонов (options)

**Files:**
- Modify: `options/options.html` (кнопки в шапке + скрытый file input)
- Modify: `options/options.js`

**Interfaces:**
- Consumes: существующие `loadTemplates()`, `showToast(text)`, `templates` (глобальная переменная).
- Produces: функции `exportTemplates()`, `handleImportFile(file)`, `isValidTemplate(t)`, элементы `#exportBtn`, `#importBtn`, `#importFileInput`.

- [ ] **Step 1: Разметка в `options.html`**

В `top-bar` заменить строку `<span class="top-bar-title">Управление шаблонами</span>` на:

```html
<span class="top-bar-title">Управление шаблонами</span>
<div class="topbar-actions">
  <button type="button" class="btn-outlined topbar-btn" id="importBtn" title="Импорт шаблонов">Импорт</button>
  <button type="button" class="btn-outlined topbar-btn" id="exportBtn" title="Экспорт шаблонов">Экспорт</button>
  <input type="file" id="importFileInput" accept=".json,application/json" hidden>
</div>
```

И стили (в `<style>`):

```css
.topbar-actions { display: flex; gap: 8px; margin-left: 16px; }
.topbar-btn { height: 32px; padding: 0 12px; font-size: 13px; }
```

- [ ] **Step 2: Логика экспорта и импорта в `options.js`**

Внутри `DOMContentLoaded` (после `loadTemplates();`):

```javascript
function isValidTpl(t) {
    return !!t && typeof t === 'object' && typeof t.id === 'string' && t.id &&
           typeof t.name === 'string' && t.fields && typeof t.fields === 'object';
}

function exportTemplates() {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    a.href = url;
    a.download = `sew-templates-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        let parsed;
        try {
            parsed = JSON.parse(reader.result);
        } catch (e) {
            showToast('Ошибка: неверный файл JSON');
            return;
        }
        if (!Array.isArray(parsed)) { showToast('Ошибка: в файле нет списка шаблонов'); return; }
        const existingIds = new Set(templates.map(t => t.id));
        let added = 0;
        parsed.forEach(t => {
            if (isValidTpl(t) && !existingIds.has(t.id)) {
                templates.push(t);
                existingIds.add(t.id);
                added++;
            }
        });
        const skipped = parsed.length - added;
        chrome.storage.local.set({ sew_templates: templates }, () => {
            if (chrome.runtime.lastError) { showToast('Ошибка сохранения'); return; }
            loadTemplates();
            showToast(added > 0 ? `Импортировано: +${added}, пропущено: ${skipped}` : 'Не найдено новых шаблонов');
        });
    };
    reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportTemplates);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
document.getElementById('importFileInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleImportFile(f);
    e.target.value = '';
});
```

- [ ] **Step 3: Проверка**

`node --check options/options.js` и ручное: в `chrome://extensions` открыть options, создать/изменить шаблон, экспорт (файл приходит), импорт того же файла → toast «Не найдено новых шаблонов».

---

### Task 4: Дубликат и drag-and-order (options)

**Files:**
- Modify: `options/options.html` (стили `.drag-over`, `.dragging`)
- Modify: `options/options.js`

**Interfaces:**
- Consumes: `templates`, `renderTemplateList()`, `showToast()`, `chrome.storage.local`.
- Produces: кнопка дубликата (`data-action="duplicate"`), обработчики drag`dragging`/`drag-over` на `.template-card`.

- [ ] **Step 1: Стили drag-and-drop в `options.html`**

```css
.template-card[draggable="true"] { cursor: grab; }
.template-card.dragging { opacity: 0.5; }
.template-card.drag-over { outline: 2px dashed var(--md-sys-color-primary); outline-offset: -2px; }
```

- [ ] **Step 2: Кнопка дубликата в карточке (`options.js` — `renderTemplateList`)**

В шаблоне `.card-actions` (перед кнопкой `delete`) добавить:

```html
<button class="icon-btn duplicate" data-action="duplicate" title="Копировать" aria-label="Дублировать шаблон">
    <svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>
</button>
```

В карточке выставить `card.draggable = true;` и добавить hint над списком (в разделе пустого состояния не мешает, можно добавить строку вверху списка в `renderTemplateList`):

```html
<div class="drag-hint">Перетащите карточку, чтобы изменить порядок</div>
```

со стилем `.drag-hint { font-size: 12px; color: var(--md-sys-color-on-surface-variant); padding: 4px 16px; }`.

- [ ] **Step 3: Drag-обработчики и дубликат (`options.js`)**

В `renderTemplateList` после `templateList.appendChild(card)` добавить:

```javascript
const idx = i;
card.draggable = true;
card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
});
card.addEventListener('dragend', () => card.classList.remove('dragging'));
card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isInteger(from) || from === idx) return;
    const moved = templates.splice(from, 1)[0];
    templates.splice(idx, 0, moved);
    try {
        chrome.storage.local.set({ sew_templates: templates }, () => {
            if (chrome.runtime.lastError) { showToast('Ошибка сохранения порядка'); return; }
            renderTemplateList();
        });
    } catch (err) { showToast('Ошибка сохранения порядка'); }
});
```

В делегированный обработчик кликов (в `renderTemplateList`), в ветке `iconBtn.dataset.action === 'edit' ...` добавить:

```js
else if (iconBtn.dataset.action === 'duplicate') {
    duplicateTemplate(id);
}
```

И добавить функцию:

```js
function duplicateTemplate(id) {
    const src = templates.find(t => t.id === id);
    if (!src) return;
    const copy = {
        id: Date.now().toString(),
        name: (src.name || 'Без имени') + ' (копия)',
        preset: src.preset || 'trn',
        fields: Object.assign({}, src.fields || {})
    };
    templates.push(copy);
    chrome.storage.local.set({ sew_templates: templates }, () => {
        if (chrome.runtime.lastError) { showToast('Ошибка сохранения'); return; }
        loadTemplates();
        showToast('Шаблон скопирован');
    });
}
```

- [ ] **Step 4: Проверка**

`node --check options/options.js`; в options создать 2 шаблона, продублировать (появилась копия), перетащить карточки — порядок меняется и сохраняется после перезагрузки страницы options.

---

### Task 5: Обработка ошибок (popup, options, content)

**Files:**
- Modify: `popup/popup.js`
- Modify: `options/options.js`
- Modify: `content/content.js`

**Interfaces:**
- Consumes: `chrome.runtime.lastError`, существующие `showToast`.
- Produces: `handleStorageError(lastError)` в content (показывает страничный тост).

- [ ] **Step 1: popup.js — `sendMessage` lastError**

Заменить вызов `chrome.tabs.sendMessage(tabs[0].id, {...});` на:

```js
chrome.tabs.sendMessage(tabs[0].id, { action: 'applyTemplate', templateId: id }, function() {
    if (chrome.runtime.lastError) {
        templateList.innerHTML = '<div class="error-state">' + escapeHtml(chrome.runtime.lastError.message) + '</div>';
    }
});
```

- [ ] **Step 2: options.js — lastError в `storage`**

- `loadTemplates()`: в колбэке `chrome.storage.local.get` вместо `if (chrome.runtime.lastError) return;` добавить `if (chrome.runtime.lastError) { showToast('Ошибка загрузки: ' + chrome.runtime.lastError.message); return; }`.
- `saveTemplate()`, `deleteTemplate()`: в колбэк `chrome.storage.local.set` добавить `if (chrome.runtime.lastError) { showToast('Ошибка сохранения'); return; }` перед `closeModals()/loadTemplates()`.

- [ ] **Step 3: content.js — helper + тосты**

В начале content.js добавить:

```js
function handleStorageError(err) {
    if (err && /context\s*invalidated/i.test(err.message)) {
        showContextRestartToast();
    } else {
        console.warn('SEW: chrome.storage error', err && err.message);
    }
}

function showContextRestartToast() {
    const t = document.createElement('div');
    t.className = 'sew-context-toast';
    t.textContent = 'Расширение перезапущено — обновите страницу';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#323232;color:#fff;padding:12px 16px;border-radius:8px;font:500 14px/1.4 Roboto,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    document.body.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}
```

И в трёх местах (внутри колбэков `chrome.storage.local.get` в `loadTemplatesIntoDropdown`, `applyTemplate`, `openFABPanel`) заменить строку `if (chrome.runtime.lastError) return;` на:

```js
if (chrome.runtime.lastError) { handleStorageError(chrome.runtime.lastError); return; }
```

- [ ] **Step 4: Проверка**

`node --check popup/popup.js`, `node --check options/options.js`, `node --check content/content.js`. Мануально: перезагрузить расширение на открытой вкладке SEW → страница показывает тост (произвольный) при следующем обращении к storage; popup на несовместимой странице показывает сообщение об ошибке.

---

### Task 6: Финальная сверка

**Files:**
- Нет (только проверка).

- [ ] **Step 1: Синтаксис всех JS**

```powershell
node --check content/content.js; node --check popup/popup.js; node --check options/options.js
```

- [ ] **Step 2: Валидность manifest**

```powershell
Get-Content -Raw manifest.json | ConvertFrom-Json | Out-Null; echo "manifest OK"
```

- [ ] **Step 3: Сверка со спецёй**

Проверить по пунктам: экспорт/импорт → мягкое слияние; дубликат name+функ flag; drag-перестановка сохраняется; `lastError` в popup/options/content + тост invalidated; host_permissions и matches только `sew.mvideoeldorado.ru`; в manifest есть `icons` 16/32/48/128 и файлы PNG существуют.

- [ ] **Step 4: Ручное smoke-тест по сценарию**

На `chrome://extensions` → «Обновить»; открыть options; создать шаблон, экспорт, удалить, импорт обратно → шаблон появился; дубль → копия; перетащить → порядок меняется; icons видны в toolbar.

---

## Self-Review

- Spec coverage: Feature1 → Task3; Feature4 → Task4; Feature5 (error handling) → не путать: Feature8 → Task5; Feature10 → Task2; Feature12 → Task1. Covered.
- Номера задач последовательные 1..6.
- No placeholders: код во всех шагах приведён целиком (кроме длинных SVG-строк — они вставлены в Task 1).
- Типы согласованы: `templates` (массив), `isValidTpl`, `duplicateTemplate`, `showToast`, `handleStorageError` — имена/сигнатуры совпадают между задачами.