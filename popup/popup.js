(function() {
    var templateList = document.getElementById('templateList');
    var openOptionsBtn = document.getElementById('openOptions');

    if (openOptionsBtn) {
        openOptionsBtn.addEventListener('click', function() {
            window.open(chrome.runtime.getURL('options/options.html'), '_blank');
        });
    }

    // SVG icons used inline in popup
    var ICON_NOTE_ALT = '<svg viewBox="0 0 24 24"><path d="M14.86 3H9c-.55 0-1 .45-1 1v12H5V4c0-.55-.45-1-1-1S2 3.45 2 4v16c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-9.14L16.86 3z"/><path d="M17 3l-4 4h4z"/></svg>';
    var ICON_DESCRIPTION = '<svg viewBox="0 0 24 24"><path d="M14.86 3H9c-.55 0-1 .45-1 1v12H5V4c0-.55-.45-1-1-1S2 3.45 2 4v16c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-9.14L16.86 3z"/><path d="M17 3l-4 4h4z"/></svg>';
    var ICON_SETTINGS = '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>';

    chrome.storage.local.get(['sew_templates'], function(result) {
        if (chrome.runtime.lastError) {
            templateList.innerHTML = '<div class="error-state">Ошибка: ' + escapeHtml(chrome.runtime.lastError.message) + '</div>';
            return;
        }

        var templates = result.sew_templates || [];

        if (templates.length === 0) {
            templateList.innerHTML =
                '<div class="empty-state">' +
                    '<div class="empty-state-icon">' + ICON_NOTE_ALT + '</div>' +
                    '<p>Нет шаблонов.<br><button id="openOptionsBtn" type="button">Создать шаблон</button></p>' +
                '</div>';

            var btn = document.getElementById('openOptionsBtn');
            if (btn) {
                btn.addEventListener('click', function() {
                    window.open(chrome.runtime.getURL('options/options.html'), '_blank');
                });
            }
            return;
        }

        templateList.innerHTML = '';
        for (var i = 0; i < templates.length; i++) {
            var tpl = templates[i];
            var fieldCount = tpl.fields ? Object.keys(tpl.fields).length : 0;
            var presetName = tpl.preset === 'trn' ? 'ТрН' : (tpl.preset || 'ТрН');

            var item = document.createElement('div');
            item.className = 'template-card';
            item.dataset.templateId = tpl.id;
            item.innerHTML =
                '<div class="card-icon-wrap">' + ICON_NOTE_ALT + '</div>' +
                '<div class="card-text">' +
                    '<div class="card-name">' + escapeHtml(tpl.name || 'Без имени') + '</div>' +
                    '<div class="card-meta">' + presetName + ' · ' + fieldCount + ' полей</div>' +
                '</div>';

            item.addEventListener('click', function() {
                var id = this.dataset.templateId;
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'applyTemplate', templateId: id }, function() {
                    var err = chrome.runtime.lastError;
                    if (err) {
                        var url = tabs[0] && tabs[0].url;
                        var onSew = url && /sew\.mvideoeldorado\.ru\//.test(url);
                        templateList.innerHTML = '<div class="error-state">' +
                            '<div class="card-icon-wrap" style="margin-bottom:0.75rem;">⚠️</div>' +
                            '<p><strong>Расширение работает только на SEW</strong></p>' +
                            '<p>' + (onSew ? 'Страница обновилась — нужна перезагрузка.' : 'Откройте документ в SEW для автозаполнения.') + '</p>' +
                        '</div>';
                    }
                });
                    }
                });
            });
            templateList.appendChild(item);
        }
    });

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
