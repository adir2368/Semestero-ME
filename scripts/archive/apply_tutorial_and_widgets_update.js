const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

// 1. Update index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Replace #btn-open-widgets with #btn-open-interactive-tour in HUD header
const widgetBtnRegex = /<a href="widgets\.html" class="btn-hud-bell" id="btn-open-widgets"[\s\S]*?<\/a>/;
const compassBtnHtml = `<button type="button" class="btn-hud-bell" id="btn-open-interactive-tour" onclick="if(window.openTutorialHubModal) window.openTutorialHubModal(); else if(window.startInteractiveTour) window.startInteractiveTour();" title="מדריך מערכת וסיור אינטראקטיבי בכל הפיצ'רים (Tutorial) 🧭" aria-label="מדריך וסיור אינטראקטיבי">
                        <span class="bell-icon">🧭</span>
                    </button>`;

if (widgetBtnRegex.test(html)) {
    html = html.replace(widgetBtnRegex, compassBtnHtml);
    console.log('✓ Replaced btn-open-widgets with btn-open-interactive-tour in index.html HUD');
}

// Make #settings-card-widgets visible in Settings
html = html.replace('id="settings-card-widgets" style="display: none;', 'id="settings-card-widgets" style="display: block;');
console.log('✓ Made settings-card-widgets visible in Settings in index.html');

fs.writeFileSync(indexHtmlPath, html, 'utf8');

// 2. Update app.js
const appJsPath = path.join(rootDir, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Adjust lines 2631-2638
const targetAppSnippet = `    const btnWidgetsEl = document.getElementById('btn-open-widgets');
    if (btnWidgetsEl) {
        btnWidgetsEl.style.display = isDirectPhoneApp ? 'inline-flex' : 'none';
    }
    const cardWidgetsEl = document.getElementById('settings-card-widgets');
    if (cardWidgetsEl) {
        cardWidgetsEl.style.display = isDirectPhoneApp ? 'block' : 'none';
    }`;

const replacementAppSnippet = `    const btnWidgetsEl = document.getElementById('btn-open-widgets');
    if (btnWidgetsEl) {
        btnWidgetsEl.style.display = 'none'; // Moved to Settings per user directive
    }
    const cardWidgetsEl = document.getElementById('settings-card-widgets');
    if (cardWidgetsEl) {
        cardWidgetsEl.style.display = 'block'; // Always accessible in Settings
    }`;

if (appJs.includes(targetAppSnippet)) {
    appJs = appJs.replace(targetAppSnippet, replacementAppSnippet);
    console.log('✓ Updated widgets visibility logic in app.js');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');

// 3. Update ui_enhancements.js
const uiPath = path.join(rootDir, 'ui_enhancements.js');
let uiJs = fs.readFileSync(uiPath, 'utf8');

// Add act-tour to actions
if (!uiJs.includes('act-tour')) {
    uiJs = uiJs.replace(
        `{ id: 'act-audit', title: 'בדיקת זכאות לתואר ודרישות סיום (Graduation Audit)'`,
        `{ id: 'act-tour', title: 'מדריך מערכת וסיור אינטראקטיבי (Tutorial Academy)', icon: '🧭', shortcut: 'T', action: () => (window.openTutorialHubModal ? window.openTutorialHubModal() : window.startInteractiveTour && window.startInteractiveTour()) },\r\n            { id: 'act-audit', title: 'בדיקת זכאות לתואר ודרישות סיום (Graduation Audit)'`
    );
    console.log('✓ Added act-tour to Command Palette actions in ui_enhancements.js');
}

// Add closeTutorialHubModal to Escape handler
if (!uiJs.includes('closeTutorialHubModal')) {
    uiJs = uiJs.replace(
        `if (window.closeKeyboardShortcutsModal) window.closeKeyboardShortcutsModal();`,
        `if (window.closeKeyboardShortcutsModal) window.closeKeyboardShortcutsModal();\r\n                    if (window.closeTutorialHubModal) window.closeTutorialHubModal();`
    );
    console.log('✓ Added closeTutorialHubModal to Escape handler in ui_enhancements.js');
}

// Add 'T' / 't' key shortcut
if (!uiJs.includes("e.key === 't' || e.key === 'T'")) {
    const targetShortcutBlock = `            // 3. Shortcuts Cheat Sheet: '?' key when not typing
            if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.openKeyboardShortcutsModal();
                return;
            }`;

    const newShortcutBlock = `            // 3. Shortcuts Cheat Sheet: '?' key when not typing
            if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.openKeyboardShortcutsModal();
                return;
            }

            // 3b. Interactive Tutorial Hub: 'T' key when not typing
            if ((e.key === 't' || e.key === 'T' || e.key === 'א') && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (window.openTutorialHubModal) window.openTutorialHubModal();
                else if (window.startInteractiveTour) window.startInteractiveTour();
                return;
            }`;

    uiJs = uiJs.replace(targetShortcutBlock, newShortcutBlock);
    console.log('✓ Added T key shortcut for Tutorial Hub in ui_enhancements.js');
}

fs.writeFileSync(uiPath, uiJs, 'utf8');
console.log('All files updated successfully.');
