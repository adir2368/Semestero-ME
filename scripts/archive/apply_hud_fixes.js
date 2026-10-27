const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

// 1. planner_module.js - Expose openGraduationClearanceModal and openGraduationAuditModal in public API
const plannerPath = path.join(rootDir, 'planner_module.js');
let planner = fs.readFileSync(plannerPath, 'utf8');

planner = planner.replace(
    /global\.DegreePlanner\s*=\s*\{/,
    `global.DegreePlanner = {\n        openGraduationClearanceModal: openGraduationClearanceModal,\n        openGraduationAuditModal: openGraduationClearanceModal,`
);

// Also attach directly to global/window at the end of the IIFE
planner = planner.replace(
    /global\.DegreePlanner\.init\(\);(\r?\n)\}\)\(window\);/,
    `global.DegreePlanner.init();$1    global.openGraduationClearanceModal = openGraduationClearanceModal;$1    global.openGraduationAuditModal = openGraduationClearanceModal;$1})(window);`
);

fs.writeFileSync(plannerPath, planner, 'utf8');
console.log('planner_module.js -> openGraduationClearanceModal exported in global.DegreePlanner and global');

// 2. interactive_tour.js - Robust call for Graduation Clearance
const tourPath = path.join(rootDir, 'interactive_tour.js');
let tour = fs.readFileSync(tourPath, 'utf8');

const oldGradTourCall = /onClick:\s*\(\)\s*=>\s*\{[\s\S]*?if\s*\(window\.DegreePlanner\)[\s\S]*?\}\s*\}/;
const newGradTourCall = `onClick: () => {
                    if (typeof window.openGraduationClearanceModal === 'function') {
                        window.openGraduationClearanceModal();
                    } else if (window.DegreePlanner && typeof window.DegreePlanner.openGraduationClearanceModal === 'function') {
                        window.DegreePlanner.openGraduationClearanceModal();
                    } else if (window.DegreePlanner && typeof window.DegreePlanner.openGraduationAuditModal === 'function') {
                        window.DegreePlanner.openGraduationAuditModal();
                    } else {
                        const btn = document.getElementById('btn-open-graduation-clearance');
                        if (btn) btn.click();
                    }
                }`;

tour = tour.replace(oldGradTourCall, newGradTourCall);
fs.writeFileSync(tourPath, tour, 'utf8');
console.log('interactive_tour.js -> Graduation audit button call updated');

// 3. index.html - Hide char-avatar, hide char-title, and equalize download button
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Hide char-avatar
html = html.replace(
    'id="hud-char-avatar" onclick="if (window.AuthSync && AuthSync.openAuthModal) AuthSync.openAuthModal();" title="לחץ לשינוי סמל / עריכת פרטי חשבון" style="cursor: pointer;">',
    'id="hud-char-avatar" onclick="if (window.AuthSync && AuthSync.openAuthModal) AuthSync.openAuthModal();" title="לחץ לשינוי סמל / עריכת פרטי חשבון" style="cursor: pointer; display: none;">'
);

// Hide char-title
html = html.replace(
    '<span class="char-title" id="char-title">הנדסת מכונות (B.Sc.)</span>',
    '<span class="char-title" id="char-title" style="display: none;">הנדסת מכונות (B.Sc.)</span>'
);

// Equalize download button design with other btn-hud-bell buttons
const oldDownloadBtnRegex = /<button type="button" class="btn-hud-bell" id="btn-open-downloads-modal"[\s\S]*?<\/button>/;
const newDownloadBtnHtml = `<button type="button" class="btn-hud-bell" id="btn-open-downloads-modal" onclick="window.openDownloadModal()" title="הורדה ישירה לטלפון ולמחשב ⬇️" aria-label="הורדה ישירה לטלפון ולמחשב">
                        <span class="bell-icon">⬇️</span>
                    </button>`;

html = html.replace(oldDownloadBtnRegex, newDownloadBtnHtml);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html -> char-avatar and char-title hidden, download button equalized');

// 4. styles.css - Hide char-avatar and char-title reliably
const stylesPath = path.join(rootDir, 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');

const cssRulesToAdd = `\n/* Clean Minimalist HUD: Hide Right Avatar Icon and Redundant Degree Subtitle */\n.hud-header .char-avatar,\n#hud-char-avatar,\n#char-title {\n    display: none !important;\n}\n`;

if (!styles.includes('Clean Minimalist HUD: Hide Right Avatar Icon')) {
    styles += cssRulesToAdd;
    fs.writeFileSync(stylesPath, styles, 'utf8');
    console.log('styles.css -> Added rules to hide avatar and char-title');
}

console.log('All HUD fixes applied successfully!');
