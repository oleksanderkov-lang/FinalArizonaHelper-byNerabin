// --- ИНТЕГРАЦИЯ С ДВИЖКОМ XENFORO ---

function insertHtmlIntoEditor(html) {
    const editor = document.querySelector('.fr-element');
    if (!editor) return false;
    
    try {
        if (typeof XF !== 'undefined' && XF.getEditorInContainer) {
            const xfEditor = XF.getEditorInContainer(document.body);
            if (xfEditor && xfEditor.ed) {
                xfEditor.ed.events.focus(true);
                xfEditor.ed.selection.restore();
                xfEditor.ed.html.insert(html);
                return true;
            }
        }
    } catch (e) {}

    editor.focus(); 
    const beforeContent = editor.innerHTML;
    try { document.execCommand('insertHTML', false, html); } catch(e) {}
    
    if (editor.innerHTML === beforeContent) {
        if (editor.innerHTML.trim() === '<p><br></p>' || editor.innerHTML.trim() === '<br>') {
            editor.innerHTML = html;
        } else {
            editor.insertAdjacentHTML('beforeend', html);
        }
    }
    
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function createButtons() {
    const btn = document.getElementById('quick_reply');
    if (btn) btn.remove();
}

function moveFilters() {
    const filterBar = document.querySelector('.filterBar');
    const btnGroup = document.querySelector('.p-body-pageContent .block-outer-opposite .buttonGroup');
    if (filterBar && btnGroup && !btnGroup.contains(filterBar)) {
        btnGroup.appendChild(filterBar);
    }
    const blockFilterBar = document.querySelector('.block-filterBar');
    if (blockFilterBar && blockFilterBar.children.length === 0) {
        blockFilterBar.style.display = 'none';
    }
}

function enhanceXenForoMenus(targetNode) {
    targetNode.querySelectorAll('.menu-content').forEach(function(menu) {
        const header = menu.querySelector('.menu-header');
        if (header && header.textContent.includes('Дополнительно') && !menu.dataset.ahInit) {
            menu.dataset.ahInit = 'true';
            
            const editLink = menu.querySelector('a[href*="/edit"]');
            if (!editLink) return; 

            const section = document.createElement('div');
            section.innerHTML = `
                <h4 class="menu-header" style="color: var(--ah-accent);">Arizona Helper</h4>
                <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="17">✅ Рассмотрено (Закрыть)</a>
                <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="18">❌ Отказано (Закрыть)</a>
                <a href="javascript:void(0)" class="menu-linkRow ah-quick-prefix" data-prefix="15">⏳ На рассмотрении</a>
            `;
            const footer = menu.querySelector('.menu-footer');
            if (footer) menu.insertBefore(section, footer); else menu.appendChild(section);
            
            section.querySelectorAll('.ah-quick-prefix').forEach(function(btn) {
                btn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    const button = e.currentTarget; const prefixId = button.dataset.prefix; 
                    const ogText = button.textContent; button.textContent = '⏳...'; button.style.pointerEvents = 'none';
                    try {
                        const response = await fetch(editLink.href); const html = await response.text(); const doc = new DOMParser().parseFromString(html, 'text/html');
                        const token = doc.querySelector('input[name="_xfToken"]').value;
                        
                        const formData = new URLSearchParams();
                        formData.append('_xfToken', token);
                        formData.append('title', doc.querySelector('input[name="title"]').value);
                        formData.append('prefix_id', prefixId);
                        
                        // Обязательные маркеры для XenForo
                        formData.append('_xfSet[discussion_open]', '1');
                        formData.append('_xfSet[sticky]', '1');

                        if (prefixId === '15') { 
                            // На рассмотрении: открыть и закрепить
                            formData.append('discussion_open', '1');
                            formData.append('sticky', '1');
                        } else if (prefixId === '17' || prefixId === '18') { 
                            // Рассмотрено / Отказано: закрыть и открепить
                        } else {
                            formData.append('discussion_open', '1');
                        }
                        
                        const postResp = await fetch(editLink.href, { method: 'POST', body: formData, headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest' } });
                        
                        if (postResp.ok) { 
                            button.textContent = '✅'; 
                            setTimeout(function() { location.reload(); }, 500); 
                        } else {
                            throw new Error();
                        }
                    } catch (err) { 
                        button.textContent = '❌'; 
                        setTimeout(function() { button.textContent = ogText; button.style.pointerEvents = 'auto'; }, 2000); 
                    }
                });
            });
        }
    });
}

function initSmartNav() {
    const isThreadList = document.querySelector('.structItemContainer-group');

    // 1. УМНЫЙ ФИЛЬТР ТЕМ
    if (isThreadList && !document.getElementById('ah-live-filter')) {
        const filterStyle = document.createElement('style');
        filterStyle.textContent = `
            .ah-filter-panel { display: flex; gap: 10px; margin-bottom: 24px; padding: 12px; background: var(--ah-surface); border: 1px solid var(--ah-border-fallback); border-radius: 12px; backdrop-filter: blur(10px); flex-wrap: wrap; align-items: center; }
            .ah-filter-input { flex: 1; min-width: 200px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 10px 15px; border-radius: 8px; outline: none; font-size: 14px; font-family: inherit; transition: 0.3s; }
            .ah-filter-input:focus { border-color: var(--ah-accent); box-shadow: 0 0 10px var(--ah-glow); background: rgba(0, 0, 0, 0.2); }
            .ah-f-btn { background: rgba(255, 255, 255, 0.05); color: #aaa; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .ah-f-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--ah-accent); transform: translateY(-2px); color: #fff; }
            .ah-f-btn.active { background: var(--ah-btn-h); border-color: var(--ah-accent); box-shadow: 0 4px 12px var(--ah-glow); color: var(--ah-accent); }
        `;
        document.head.appendChild(filterStyle);

        const filterHtml = `
            <div id="ah-live-filter" class="ah-filter-panel">
                <input type="text" id="ah-f-search" class="ah-filter-input" placeholder="Поиск...">
                <button class="ah-f-btn active" data-filter="all">Все</button>
                <button class="ah-f-btn" data-filter="На рассмотрении">На рассмотрении</button>
                <button class="ah-f-btn" data-filter="none">Новые</button>
            </div>
        `;
        isThreadList.insertAdjacentHTML('beforebegin', filterHtml);

        const searchInp = document.getElementById('ah-f-search');
        const btns = document.querySelectorAll('.ah-f-btn');
        let cFilter = 'all';

        const threads = document.querySelectorAll('.structItem--thread');
        
        threads.forEach(item => {
            item._ahText = item.innerText.toLowerCase();
            item._ahLabels = Array.from(item.querySelectorAll('.label')).map(l => l.innerText.toLowerCase());
            
            // Точный парсинг даты из первого тега time (дата создания)
            item._ahCreationTime = Date.now() / 1000; 
            const timeEls = item.querySelectorAll('time');
            if (timeEls.length > 0) {
                const firstTime = timeEls[0]; 
                if (firstTime.hasAttribute('data-timestamp')) {
                    item._ahCreationTime = parseInt(firstTime.getAttribute('data-timestamp'), 10);
                }
            }
        });

        function apply() {
            const q = searchInp.value.toLowerCase();
            const currentSec = Date.now() / 1000;
            const ONE_MONTH_SEC = 30 * 24 * 60 * 60; // 30 дней

            threads.forEach(item => {
                const mt = item._ahText.includes(q);
                let ml = true;
                
                if (cFilter === 'none') {
                    // Ищем админские теги
                    const stopTags = ['рассмотрен', 'отказан', 'на рассмотрении', 'ожидает', 'закрыто', 'решено', 'информация', 'важно'];
                    const hasStopTag = item._ahLabels.some(label => stopTags.some(status => label.includes(status)));
                    
                    if (hasStopTag) {
                        ml = false; // Уже проверено админами
                    } else {
                        // Проверяем ТОЛЬКО возраст! Если теме больше 30 дней - это старый закреп с правилами
                        if ((currentSec - item._ahCreationTime) > ONE_MONTH_SEC) {
                            ml = false;
                        } else {
                            ml = true; // Теме меньше 30 дней и нет админ-тега - показываем 100%!
                        }
                    }
                }
                else if (cFilter === 'На рассмотрении') {
                    ml = item._ahLabels.some(l => l.includes('на рассмотрении') || l.includes('на рассмотрение га'));
                } 
                else if (cFilter !== 'all') {
                    ml = item._ahLabels.some(l => l.includes(cFilter.toLowerCase()));
                }

                if (mt && ml) {
                    item.style.display = ''; 
                } else {
                    item.style.setProperty('display', 'none', 'important');
                }
            });

            const sep = document.querySelector('.ah-sticky-separator');
            if (sep) {
                if (q !== '' || cFilter !== 'all') {
                    sep.style.display = 'none';
                } else {
                    sep.style.display = '';
                }
            }
        }

        searchInp.addEventListener('input', apply);
        btns.forEach(b => {
            b.addEventListener('click', e => {
                cFilter = e.target.dataset.filter;
                btns.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                apply();
            });
        });
    }

    // 2. РАЗДЕЛИТЕЛЬ ЗАКРЕПЛЕННЫХ ТЕМ
    if (isThreadList && !document.querySelector('.ah-sticky-separator')) {
        const threadList = document.querySelectorAll('.structItem--thread');
        let lastSticky = null;
        let firstNormal = null;

        for (let i = 0; i < threadList.length; i++) {
            const thread = threadList[i];
            const isSticky = thread.querySelector('.structItem-status--sticky, .fa-thumbtack, [title*="Закреплено"]');
            
            if (isSticky) {
                lastSticky = thread;
            } else if (lastSticky && !isSticky) {
                firstNormal = thread;
                break;
            }
        }

        if (lastSticky && firstNormal) {
            const sep = document.createElement('div');
            sep.className = 'ah-sticky-separator';
            
            // МАГИЯ СЕТКИ: Заставляем разделитель игнорировать колонки и растянуться на 100% ширины
            sep.style.gridColumn = '1 / -1';
            sep.style.width = '100%';
            
            sep.innerHTML = `
                <div style="display: flex; align-items: center; text-align: center; margin: 25px 0 15px 0;">
                    <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15));"></div>
                    <div style="padding: 0 15px; color: var(--ah-accent, #3498db); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9;">Обычные темы</div>
                    <div style="flex: 1; height: 1px; background: linear-gradient(270deg, transparent, rgba(255,255,255,0.15));"></div>
                </div>
            `;
            firstNormal.parentNode.insertBefore(sep, firstNormal);
        }
    }
}

function executeTemplate(template) {
    const processTemplate = function(...args) {
        const finalHtml = typeof template.text === 'function' ? template.text(...args, getUTC3Time(), getLawsuitNumber(), getMonday()) : template.text;
        insertHtmlIntoEditor(finalHtml);
        const closeOverlay = document.querySelector('.overlay-close');
        if (closeOverlay) closeOverlay.click();
    };
    
    if (template.needsVerdictForm) { 
        showVerdictPrompt(function(punishmentsArray, punishmentsHtml, finalRuleText, logLine, selectedPrefix) {
            const shortToggle = document.getElementById('ah-short-reply');
            const isShort = shortToggle ? shortToggle.checked : false;

            if (template.text.length === 5) {
                const p = punishmentsArray[0];
                let fullPun = "";
                if (p.type === 'jailoff') fullPun = p.time ? `ТСР ${p.time}-го уровня` : "ТСР";
                else if (p.type === 'muteoff') fullPun = p.time ? `мут на ${p.time} минут` : "мут";
                else if (p.type === 'banoff') fullPun = p.time ? `бан на ${p.time} дней` : "бан";
                else if (p.type === 'warnoff') fullPun = "варн";
                else if (p.type === 'driverbanoff') fullPun = p.time ? `бан вождения на ${p.time} дней` : "бан вождения";
                else if (p.type === 'gunbanoff') fullPun = p.time ? `бан оружия на ${p.time} дней` : "бан оружия";
                else if (p.type === 'banfa') fullPun = "бан ФА";
                
                processTemplate(p.player, fullPun, p.reason, finalRuleText, logLine, isShort);
            } 
            else {
                processTemplate(punishmentsHtml, finalRuleText, logLine, isShort);
            }

            if (selectedPrefix && selectedPrefix !== '0') {
                window.AH_changeThreadState(selectedPrefix);
            }
        }); 
    } 
    else if (template.needsRefuseForm) { 
        showRefusePrompt(function(r, rt, selectedPrefix) { 
            processTemplate(r, rt); 
            if (selectedPrefix && selectedPrefix !== '0') {
                window.AH_changeThreadState(selectedPrefix);
            }
        }); 
    }
    else if (template.needsOpraForm) { 
        showOpraPrompt(extractTargetNickname(), function(tn, opraType) { 
            let finalHtml = typeof template.text === 'function' ? template.text(tn, getUTC3Time(), getLawsuitNumber(), getMonday()) : template.text;

            if (opraType === 'full') {
                finalHtml = finalHtml.replace(/опровержение/i, 'полное опровержение').replace(/опру/i, 'полную опру');
            } else if (opraType === 'moment') {
                finalHtml = finalHtml.replace(/опровержение/i, 'опровержение момента').replace(/опру/i, 'опру момента');
            }
            
            insertHtmlIntoEditor(finalHtml);
            const closeOverlay = document.querySelector('.overlay-close');
            if (closeOverlay) closeOverlay.click();

            if (window.AH_changeThreadState) {
                window.AH_changeThreadState('15');
            }
        }); 
    }
    else if (template.needsSecondDate) { showCustomDatePrompt(function(sd) { processTemplate(sd); }); } 
    else { processTemplate(); }
}

window.AH_changeThreadState = async function(prefixId) {
    try {
        const threadMatch = window.location.href.match(/threads\/(?:.*?\.)?(\d+)/i);
        if (!threadMatch) return;
        const threadId = threadMatch[1];
        const editUrl = `/threads/${threadId}/edit`;

        const response = await fetch(editUrl);
        if (!response.ok) return;
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const token = doc.querySelector('input[name="_xfToken"]');
        if (!token) return;

        const formData = new URLSearchParams();
        formData.append('_xfToken', token.value);
        formData.append('title', doc.querySelector('input[name="title"]').value);
        formData.append('prefix_id', prefixId);
        
        // Обязательные служебные маркеры XenForo (чтобы чекбоксы сработали)
        formData.append('_xfSet[discussion_open]', '1');
        formData.append('_xfSet[sticky]', '1');

        if (prefixId === '15') { 
            // 15 - На рассмотрении (оставить открытой и закрепить)
            formData.append('discussion_open', '1');
            formData.append('sticky', '1');
        } else if (prefixId === '17' || prefixId === '18') { 
            // 17 / 18 - Рассмотрено / Отказано 
            // Не передаем ключи discussion_open и sticky -> XenForo закрывает и открепляет тему
        } else {
            // По дефолту оставляем открытой
            formData.append('discussion_open', '1');
        }
        
        fetch(editUrl, { 
            method: 'POST', 
            body: formData, 
            headers: { 
                'Accept': 'application/json, text/javascript, */*; q=0.01', 
                'X-Requested-With': 'XMLHttpRequest' 
            } 
        });
    } catch (e) {
        console.error("Arizona Helper: Ошибка фонового изменения статуса темы", e);
    }
};

// --- УДАЛЕНИЕ ОФФТОПА В ОДИН КЛИК ---
function addOfftopButtons(targetNode) {
    targetNode.querySelectorAll('.message').forEach(function(message) {
        // Защита от дублирования кнопок
        if (message.dataset.ahOfftopInit) return;
        message.dataset.ahOfftopInit = 'true';

        const warnBtn = message.querySelector('a.actionBar-action--warn');
        const deleteBtn = message.querySelector('a.actionBar-action--delete');
        
        // Достаем ID сообщения из соседних кнопок
        let postId = null;
        if (deleteBtn && deleteBtn.href) {
            let match = deleteBtn.href.match(/posts\/(\d+)\/delete/i);
            if (match) postId = match[1];
        } else if (warnBtn && warnBtn.href) {
            let match = warnBtn.href.match(/posts\/(\d+)\/warn/i);
            if (match) postId = match[1];
        }
        
        if (!postId) return;
        
        const internalBar = message.querySelector('.actionBar-set--internal');
        if (!internalBar) return;
        
        // Создаем кнопку стандартного вида
        const offtopBtn = document.createElement('a');
        offtopBtn.href = "javascript:void(0)";
        offtopBtn.className = "actionBar-action actionBar-action--menuItem";
        offtopBtn.innerHTML = "Удалить оффтоп";
        offtopBtn.style.color = "#e74c3c"; // Слегка красим в красный для безопасности
        
        offtopBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            if (CONFIG.confirmOfftopDelete !== false) {
                if (!confirm("Удалить это сообщение с причиной «Оффтоп»?")) return;
            }
            
            const ogText = offtopBtn.innerText;
            offtopBtn.innerText = "Удаление...";
            offtopBtn.style.pointerEvents = "none";
            
            try {
                // Достаем токен безопасности XenForo
                const tokenInput = document.querySelector('input[name="_xfToken"]');
                const csrfToken = document.querySelector('html').getAttribute('data-csrf') || (tokenInput ? tokenInput.value : '');
                
                const formData = new URLSearchParams();
                formData.append('_xfToken', csrfToken);
                formData.append('reason', 'Оффтоп');
                formData.append('hard_delete', '0');
                formData.append('_xfResponseType', 'json');
                
                // Тихий фоновый запрос на удаление
                const response = await fetch(`/posts/${postId}/delete`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    // Плавно скрываем сообщение с экрана
                    message.style.transition = 'all 0.3s ease';
                    message.style.opacity = '0';
                    message.style.transform = 'scale(0.9)';
                    setTimeout(() => message.remove(), 300);
                } else {
                    throw new Error();
                }
            } catch(err) {
                offtopBtn.innerText = "Ошибка!";
                setTimeout(() => {
                    offtopBtn.innerText = ogText;
                    offtopBtn.style.pointerEvents = "auto";
                }, 2000);
            }
        });

        if (warnBtn) {
            warnBtn.parentNode.insertBefore(offtopBtn, warnBtn.nextSibling);
        } else if (deleteBtn) {
            deleteBtn.parentNode.insertBefore(offtopBtn, deleteBtn.nextSibling);
        } else {
            internalBar.appendChild(offtopBtn);
        }
    });
}