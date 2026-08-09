# SEW Templates Extension — Enhancements Design

**Date:** 2026-08-09
**Status:** Approved

## Goal

Добавить в расширение SEW Templates Automation пять изменений: импорт/экспорт шаблонов, дубликат и порядок карточек (drag-and-drop), обработку ошибок chrome.*, сужение host_permissions до домена SEW и иконки в manifest.

## Constraints

- Vanilla JS, Manifest V3, без сборки и зависимостей. Стиль кода — существующий.
- Все изменения должны сохранять обратную совместимость данных: формат `sew_templates` (массив `{id, name, preset, fields}`) не меняется.
- UI-элементы — в стиле M3 уже используемом в options/popup, уведомления — через `showToast` (существующий).

---

## Feature 1: Импорт/экспорт шаблонов (options page)

**UI:**
- В шапке (`top-bar`) options-страницы добавить две кнопки: «Импорт» и «Экспорт» (иконки + текст).
- Экспорт: создать `<a download>` с Blob JSON. Имя файла: `sew-templates-<ГГГГ-ММ-ДД>.json`.
- Импорт: скрытый `<input type="file" accept=".json,application/json">`; по выбору файла — парсинг.

**Формат файла:** массив шаблонов в формате `sew_templates` (валидация: `Array`, каждый элемент — `{id: string, name: string, fields: object}`; невалидные элементы пропускаются и считаются).

**Мягкое слияние:**
- Новые id — добавляются.
- Существующие id — пропускаются (Не перезаписываются).
- Результат сохранять в `chrome.storage.local.set({sew_templates}).`
- Toast: «Импортировано: +N, пропущено: M» (при N=0 «Не найдено новых шаблонов»).
- Toast об ошибке невалидного файла.

## Feature 4: Дубликат и порядок карточек

**Дубликат:**
- Новая иконка-кнопка «копия» на каждой `.template-card` (`data-action="duplicate"`).
- Создаёт шаблон с `name = <оригинал> (копия)`, теми же `fields` и `preset`, новый `id = Date.now().toString()`.
- Сохранение через `chrome.storage.local.set`, toast «Шаблон скопирован».

**Порядок (drag-and-drop):**
- Карточкам `.template-card` — `draggable="true"`.
- HTML5 drag events: начало, над элементом (подсветка класса `.drag-over`), drop.
- При drop — перестановка элементов в массиве `templates`, сохранение в storage.
- Новый порядок автоматически используется popup и FAB (оба читают `sew_templates` в порядке массива).

## Feature 8: Обработка ошибок

- **popup.js:** при `chrome.tabs.sendMessage` — проверка `chrome.runtime.lastError` и показать его в error-state списка.
- **options.js:** проверки `chrome.runtime.lastError` во всех `storage.get/set` (вместо молчаливого `catch(e){}` — Toast с текстом ошибки).
- **content.js:** безопасная обёртка вокруг вызовов `chrome.storage.local`; перехватывать «Extension context invalidated», на странице показать тост «Расширение перезапущено — обновите страницу».

## Feature 10: permissions (manifest.json)

- `host_permissions`: `["https://sew.mvideoeldorado.ru/*"]`
- `content_scripts[0].matches`: `["https://sew.mvideoeldorado.ru/*"]`
- Оставить: `storage`, `scripting`, `activeTab`.
- Ожидаемо: контент-скрипт, FAB и панель выбора работают только на домене SEW.

## Feature 12: Иконки расширения

- Источник: SVG, предоставленный пользователем (document-icon, svgrepo).
- Сохранить исходный SVG в `icons/icon-source.svg`.
- Сгенерировать PNG `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` (рендеринг SVG через Playwright-скриншот, `scale=device` для резкости).
- `manifest.json`: блок `"icons": {"16": "...", "32": "...", "48": "...", "128": "..."}`.

## Files to modify

- `manifest.json` — icons + permissions.
- `options/options.html` — кнопки импорт/экспорт, иконка дубликата, стили drag/dn drop, hint.
- `options/options.js` — логика импорта/экспорта/дубликата/перестановки, обработка lastError.
- `popup/popup.js` — обработка lastError sendMessage.
- `content/content.js` — оборачиваем chrome-вызовы, toast об invalidated context.
- `icons/*` — новые PNG.

## Testing

- `node --check` для всех JS-файлов (проект без npm-скриптов).
- Ручная проверка на странице chrome://extensions / на домене SEW.