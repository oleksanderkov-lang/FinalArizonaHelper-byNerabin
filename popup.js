document.addEventListener('DOMContentLoaded', () => {
    const defaultSettings = {
        nickname: "Nick Name", organization: "LSPD", signature: "byNerabin", discordWebhook: "",
        themeColor: "#3498db", themeTextColor: "#ffffff", pColor: "#3498db",
        blurEnabled: false, blurIntensity: 15, particlesEnabled: true, customBgEnabled: true, 
        pFading: true, oldStyleEnabled: false, pLines: true, pCount: 70, pSpeed: 0.5, pSize: 3,
        threadCols: 2, transparency: 15, hotkeyF1: "inReview", hotkeyF2: "transferred", hotkeyF3: "wrongFormat", 
        hotkeyF4: "verdict", hotkeyF5: "refuse",
        pendingForms: [], totalChecked: 0, customRefuseReasons: [], customTemplates: [], confirmOfftopDelete: true
    };

    const textFields = ['nickname', 'organization', 'signature', 'discordWebhook'];
    const checkFields = ['blurEnabled', 'customBgEnabled', 'particlesEnabled', 'pFading', 'oldStyleEnabled', 'pLines', 'confirmOfftopDelete'];
    const rangeFields = ['pSize', 'pCount', 'pSpeed', 'threadCols', 'blurIntensity', 'transparency'];
    const colorFields = ['themeColor', 'themeTextColor', 'pColor'];
    const hotkeysIds = ['hotkeyF1', 'hotkeyF2', 'hotkeyF3', 'hotkeyF4', 'hotkeyF5'];
    
    let currentHotkeys = {};

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    function buildHotkeysDropdowns(items) {
        const categories = [
            { label: "👑 Администратор", items: [{val: "verdict", text: "Форма Вердикта"}, {val: "refuse", text: "Отказ жалобы"}, {val: "jbadm", text: "Ответ ЖБАДМ"}, {val: "inReview", text: "ЖБ на рассмотрении"}, {val: "requestProof", text: "Запрос опровержения"}, {val: "wrongFormat", text: "Не по форме"}, {val: "transferred", text: "Передано ст. адм"}] },
            { label: "⚖️ Суд", items: [{val: "takeLawsuit", text: "Принятие иска"}, {val: "requestExplanations", text: "Запрос опры (Суд)"}, {val: "courtVerdictDefault", text: "Вердикт (Обычный)"}] },
            { label: "🚓 ПД / 👤 Адвокат", items: [{val: "pdDefault", text: "Опра в иске (ПД)"}, {val: "playerDefault", text: "Подать исковое заявление"}, {val: "lawyerPetition", text: "Ходатайство от адвоката"}] },
            { label: "🏛 Лидер/Зам (Гос)", items: [{val: "otchetzamaGOV", text: "Отчёт заместителя (Гос)"}, {val: "AntiBlatGOV", text: "Подать анти-блат"}] },
            { label: "🔫 Лидер/Зам (Нелегалы)", items: [{val: "otchetlideraNelegal", text: "Отчёт лидера (Гетто)"}, {val: "NelegalMoroz", text: "Взять мороз"}] },
            { label: "📂 Остальное", items: [{val: "ghettoDefault", text: "Написать ЖБ на игрока"}] }
        ];

        const containerHTML = document.getElementById('hotkeys-container');
        containerHTML.innerHTML = '';

        hotkeysIds.forEach(id => {
            currentHotkeys[id] = items[id] || "none";
            
            let wrapper = document.createElement('div');
            wrapper.className = 'row custom-select';
            wrapper.id = 'custom-' + id;
            
            let labelHtml = `<span style="font-size:13px; font-weight:600;">Клавиша ${id.replace('hotkey', '')}</span>`;
            let selectHtml = `<div class="select-selected" style="width: 220px;"><span>-- Отключить --</span><span>▼</span></div><div class="select-items"></div>`;
            
            wrapper.innerHTML = labelHtml + `<div style="position:relative;">${selectHtml}</div>`;
            containerHTML.appendChild(wrapper);

            const selectedSpan = wrapper.querySelector('.select-selected span:first-child');
            const itemsDiv = wrapper.querySelector('.select-items');
            
            let optHtml = `<div class="opt" data-val="none">-- Отключить --</div>`;
            
            categories.forEach(cat => {
                optHtml += `<div class="opt-group">${cat.label}</div>`;
                cat.items.forEach(t => {
                    optHtml += `<div class="opt" data-val="${t.val}">${t.text}</div>`;
                    if (t.val === currentHotkeys[id]) selectedSpan.textContent = t.text;
                });
            });

            if (items.customTemplates && items.customTemplates.length > 0) {
                optHtml += `<div class="opt-group">🛠 Свои формы</div>`;
                items.customTemplates.forEach(t => {
                    let val = "custom_" + t.title;
                    optHtml += `<div class="opt" data-val="${val}">🛠 ${t.title}</div>`;
                    if (val === currentHotkeys[id]) selectedSpan.textContent = "🛠 " + t.title;
                });
            }

            itemsDiv.innerHTML = optHtml;

            wrapper.querySelector('.select-selected').addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-select').forEach(el => { if (el !== wrapper) el.classList.remove('active'); });
                wrapper.classList.toggle('active');
            });

            itemsDiv.querySelectorAll('.opt').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentHotkeys[id] = opt.dataset.val;
                    selectedSpan.textContent = opt.textContent;
                    wrapper.classList.remove('active');
                });
            });
        });

        let f6Wrapper = document.createElement('div');
        f6Wrapper.className = 'row';
        f6Wrapper.style.marginTop = '15px';
        f6Wrapper.style.paddingTop = '15px';
        f6Wrapper.style.borderTop = '1px dashed var(--border)';
        f6Wrapper.innerHTML = `
            <span style="font-size:13px; font-weight:600; color: var(--text-muted);">Клавиша F6</span>
            <div style="width: 220px; background: rgba(0,0,0,0.5); border: 1px solid var(--border); color: #888; padding: 10px 12px; border-radius: 8px; font-size: 12px; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;">
                <span>🔒 Главное меню</span>
                <span style="font-size: 10px; opacity: 0.5;">(Вшито)</span>
            </div>
        `;
        containerHTML.appendChild(f6Wrapper);

        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('active'));
        });

        
    }

    chrome.storage.local.get(defaultSettings, function(items) {
        buildHotkeysDropdowns(items);

        textFields.forEach(id => {
            const el = document.getElementById(id);
            if (el && items[id] !== undefined) el.value = items[id];
        });

        checkFields.forEach(id => {
            const el = document.getElementById(id);
            if (el && items[id] !== undefined) el.checked = !!items[id];
        });

        rangeFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = items[id] !== undefined ? items[id] : el.min;
                const valDisp = document.getElementById(id + 'Val');
                if (valDisp) valDisp.textContent = el.value;

                el.addEventListener('input', e => {
                    if (valDisp) valDisp.textContent = e.target.value;
                });
            }
        });

        colorFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = items[id] || '#ffffff';
                const disp = document.getElementById(id + 'Display');
                if (disp) disp.textContent = el.value.toUpperCase();
                
                if (id === 'themeColor') document.documentElement.style.setProperty('--accent', el.value);

                // Живое обновление текста цвета
                el.addEventListener('input', e => {
                    if (disp) disp.textContent = e.target.value.toUpperCase();
                    if (id === 'themeColor') document.documentElement.style.setProperty('--accent', e.target.value);
                });
            }
        });

        document.getElementById('pendingCountDisp').textContent = items.pendingForms ? items.pendingForms.length : 0;
        document.getElementById('totalCheckedDisp').textContent = items.totalChecked || 0;
    });

    document.getElementById('saveBtn').addEventListener('click', e => {
        const btn = e.target;
        const data = {};
        
        hotkeysIds.forEach(id => { data[id] = currentHotkeys[id]; });

        textFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) data[id] = el.value.trim();
        });

        checkFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) data[id] = el.checked; 
        });

        rangeFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) {
                let val = parseFloat(el.value);
                data[id] = isNaN(val) ? 0 : val;
            }
        });

        colorFields.forEach(id => { 
            const el = document.getElementById(id);
            if (el) data[id] = el.value.trim();
        });

        chrome.storage.local.set(data, () => {
            btn.textContent = 'УСПЕШНО СОХРАНЕНО!';
            btn.classList.add('success');
            
            setTimeout(() => { btn.textContent = 'СОХРАНИТЬ НАСТРОЙКИ'; btn.classList.remove('success'); }, 2000);
        });
    });

    const colorResetLogic = [
        { id: 'themeColor', btnId: 'reset_themeColor', def: defaultSettings.themeColor },
        { id: 'themeTextColor', btnId: 'reset_themeTextColor', def: defaultSettings.themeTextColor },
        { id: 'pColor', btnId: 'reset_pColor', def: defaultSettings.pColor }
    ];

    colorResetLogic.forEach(item => {
        const btn = document.getElementById(item.btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const el = document.getElementById(item.id);
                const disp = document.getElementById(item.id + 'Display');
                
                if (el) el.value = item.def;
                if (disp) disp.textContent = item.def.toUpperCase();
                if (item.id === 'themeColor') document.documentElement.style.setProperty('--accent', item.def);
                
                let updateData = {}; updateData[item.id] = item.def;
                chrome.storage.local.set(updateData, () => {});

                btn.style.transform = 'rotate(-180deg)';
                btn.style.color = '#e74c3c';
                setTimeout(() => { btn.style.transform = 'none'; btn.style.color = ''; }, 400);
            });
        }
    });

    const globalResetBtn = document.getElementById('globalResetBtn');
    if (globalResetBtn) {
        globalResetBtn.addEventListener('click', () => {
            if (confirm("Сбросить все ползунки, эффекты и цвета до заводских?")) {
                const visualDefaults = {
                    themeColor: defaultSettings.themeColor, themeTextColor: defaultSettings.themeTextColor, pColor: defaultSettings.pColor,
                    blurEnabled: defaultSettings.blurEnabled, blurIntensity: defaultSettings.blurIntensity, particlesEnabled: defaultSettings.particlesEnabled,
                    customBgEnabled: defaultSettings.customBgEnabled, pFading: defaultSettings.pFading, pLines: defaultSettings.pLines,
                    pCount: defaultSettings.pCount, pSpeed: defaultSettings.pSpeed, pSize: defaultSettings.pSize, threadCols: defaultSettings.threadCols, 
                    oldStyleEnabled: defaultSettings.oldStyleEnabled, transparency: defaultSettings.transparency
                };

                chrome.storage.local.set(visualDefaults, () => {
                    globalResetBtn.textContent = 'СБРОШЕНО!';
                    chrome.tabs.query({url: "*://forum.arizona-rp.com/*"}, tabs => tabs.forEach(t => { try{chrome.tabs.reload(t.id)}catch(err){} }));
                    setTimeout(() => window.location.reload(), 1000);
                });
            }
        });
    }

    const btnSend = document.getElementById('btnSendDiscord');
    if (btnSend) {
        btnSend.addEventListener('click', () => {
            chrome.storage.local.get(['pendingForms', 'discordWebhook'], async function(data) {
                if (!data.discordWebhook || !data.discordWebhook.startsWith("http")) return alert("Укажите ссылку на Discord Webhook во вкладке 'Основа'!");
                if (!data.pendingForms || data.pendingForms.length === 0) return alert("Очередь форм пуста!");

                btnSend.textContent = "ОТПРАВКА..."; btnSend.style.pointerEvents = 'none';
                const chunks = data.pendingForms.join('\n').match(/[\s\S]{1,1900}(?=\n|$)/g) || [data.pendingForms.join('\n')];

                try {
                    for (let chunk of chunks) {
                        await fetch(data.discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "```\n" + chunk + "\n```" }) });
                    }
                    chrome.storage.local.set({ pendingForms: [] }, () => {
                        btnSend.textContent = "ОТПРАВЛЕНО!"; btnSend.style.background = "#2ecc71";
                        document.getElementById('pendingCountDisp').textContent = "0";
                        setTimeout(() => { btnSend.textContent = "Отправить логи в Discord"; btnSend.style.background = ""; btnSend.style.pointerEvents = 'auto'; }, 2000);
                    });
                } catch (e) {
                    alert("Ошибка отправки! Проверьте ссылку.");
                    btnSend.textContent = "Отправить логи в Discord"; btnSend.style.pointerEvents = 'auto';
                }
            });
        });
    }

    const btnDownload = document.getElementById('btnDownloadLog');
    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            chrome.storage.local.get(['pendingForms'], function(data) {
                if (!data.pendingForms || data.pendingForms.length === 0) return alert("Сохранять нечего!");
                
                const blob = new Blob([data.pendingForms.join('\n')], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `Arizona_Logs_${new Date().toLocaleDateString()}.txt`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                
                if(confirm("Очистить очередь в расширении?")) {
                    chrome.storage.local.set({ pendingForms: [] }, () => { document.getElementById('pendingCountDisp').textContent = "0"; });
                }
            });
        });
    }
});