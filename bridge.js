const defaultSettings = {
    gender: "Male",
    nickname: "Nick Name",
    organization: "LSPD",
    signature: "byNerabin",
    discordWebhook: "",
    themeColor: "#3498db",
    themeTextColor: "#ffffff",
    tagTextColor: "#ffffff",
    pColor: "#3498db",
    blurEnabled: false,
    oldStyleEnabled: false,
    blurIntensity: 15,
    particlesEnabled: true,
    customBgEnabled: true,
    pFading: true,
    pShape: "circle",
    pEmojiText: "🌸,✨,🔥",
    pLines: true,
    pCount: 70,
    pSpeed: 0.5,
    pSize: 3,
    transparency: 15,
    threadCols: 2,
    hotkeyF1: "inReview",
    hotkeyF2: "transferred",
    hotkeyF3: "wrongFormat",
    hotkeyF4: "verdict",
    hotkeyF5: "refuse",
    customTemplates: [],
    punishmentHistory: [],
    pendingForms: [],
    totalChecked: 0,
    customRefuseReasons: [],
    confirmOfftopDelete: true
};

chrome.storage.local.get(defaultSettings, function(items) {
    const script = document.createElement('script');
    script.id = 'arizona-ext-config';
    script.type = 'application/json';
    script.textContent = JSON.stringify(items);
    (document.head || document.documentElement).appendChild(script);
});

window.addEventListener('AH_SAVE_CONFIG', function(e) {
    let newData = e.detail;

    if (newData.newPendingForm || newData.incrementChecked) {
        chrome.storage.local.get(['pendingForms', 'totalChecked'], function(current) {
            if (newData.newPendingForm) {
                let currentForms = current.pendingForms || [];
                currentForms.push(newData.newPendingForm);
                newData.pendingForms = currentForms;
                delete newData.newPendingForm;
            }
            if (newData.incrementChecked) {
                newData.totalChecked = (current.totalChecked || 0) + 1;
                delete newData.incrementChecked;
            }
            chrome.storage.local.set(newData);
        });
    } else {
        chrome.storage.local.set(newData);
    }
});

// Синхронизация изменений между всеми открытыми вкладками
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        let update = {};
        for (let [key, { newValue }] of Object.entries(changes)) {
            update[key] = newValue;
        }
        window.dispatchEvent(new CustomEvent('AH_UPDATE_FROM_STORAGE', { detail: update }));
    }
});