const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

// 1. styles.css
const stylesPath = path.join(rootDir, 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');

const oldModalActive = `.modal-overlay.active {
    display: flex !important;
}`;

const newModalActive = `.modal-overlay.active {
    display: flex !important;
    z-index: 100050 !important;
}

/* High-Priority Active Modals (Ensures all dialogs always appear in front of tours, overlays, and sidebars) */
.modal-overlay.active,
.modal-overlay[style*="display: flex"],
.modal-overlay[style*="display: block"],
.modal-backdrop.active,
.modal-backdrop[style*="display: flex"],
#direct-download-modal.active,
#direct-download-modal[style*="display: flex"],
#course-comparison-modal.active,
#course-comparison-modal[style*="display: flex"],
#academic-faq-modal.active,
#academic-faq-modal[style*="display: flex"],
#keyboard-shortcuts-modal.active,
#keyboard-shortcuts-modal[style*="display: flex"],
#planner-graduation-clearance-modal,
#tutorial-hub-modal.active,
#tutorial-hub-modal[style*="display: flex"] {
    z-index: 100050 !important;
}

.command-palette-overlay.active,
.command-palette-overlay[style*="display: flex"],
#command-palette-modal.active,
#command-palette-modal[style*="display: flex"] {
    z-index: 100060 !important;
}`;

const normStyles = styles.replace(/\r\n/g, '\n');
const normOldModal = oldModalActive.replace(/\r\n/g, '\n');
const normNewModal = newModalActive.replace(/\r\n/g, '\n');

if (normStyles.includes(normOldModal)) {
    const updatedStyles = normStyles.replace(normOldModal, normNewModal);
    fs.writeFileSync(stylesPath, styles.includes('\r\n') ? updatedStyles.replace(/\n/g, '\r\n') : updatedStyles, 'utf8');
    console.log('styles.css -> High-priority z-index rules added successfully');
} else {
    console.error('Could not find oldModalActive in styles.css');
}

// 2. index.html - direct-download-modal inline z-index
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(
    'id="direct-download-modal" style="display: none; align-items: center; justify-content: center; z-index: 10000;"',
    'id="direct-download-modal" style="display: none; align-items: center; justify-content: center; z-index: 100050;"'
);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html -> direct-download-modal z-index updated to 100050');

// 3. ui_enhancements.js - ensure created modals have z-index: 100050
const uiPath = path.join(rootDir, 'ui_enhancements.js');
let ui = fs.readFileSync(uiPath, 'utf8');

// Fix action-audit in Command Palette to use openGraduationClearanceModal / openGraduationAuditModal
ui = ui.replace(
    `action: () => window.DegreePlanner && window.DegreePlanner.openGraduationAuditModal && window.DegreePlanner.openGraduationAuditModal()`,
    `action: () => window.DegreePlanner && (window.DegreePlanner.openGraduationClearanceModal ? window.DegreePlanner.openGraduationClearanceModal() : window.DegreePlanner.openGraduationAuditModal && window.DegreePlanner.openGraduationAuditModal())`
);

// Course Comparison Modal style
ui = ui.replace(
    `div.id = 'course-comparison-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';`,
    `div.id = 'course-comparison-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';\n        div.style.zIndex = '100050';`
);
ui = ui.replace(
    `div.id = 'course-comparison-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';`,
    `div.id = 'course-comparison-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';\r\n        div.style.zIndex = '100050';`
);

// FAQ Modal style
ui = ui.replace(
    `div.id = 'academic-faq-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';`,
    `div.id = 'academic-faq-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';\n        div.style.zIndex = '100050';`
);
ui = ui.replace(
    `div.id = 'academic-faq-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';`,
    `div.id = 'academic-faq-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';\r\n        div.style.zIndex = '100050';`
);

// Keyboard Shortcuts Modal style
ui = ui.replace(
    `div.id = 'keyboard-shortcuts-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';`,
    `div.id = 'keyboard-shortcuts-modal';\n        div.className = 'modal-overlay';\n        div.style.display = 'none';\n        div.style.zIndex = '100050';`
);
ui = ui.replace(
    `div.id = 'keyboard-shortcuts-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';`,
    `div.id = 'keyboard-shortcuts-modal';\r\n        div.className = 'modal-overlay';\r\n        div.style.display = 'none';\r\n        div.style.zIndex = '100050';`
);

fs.writeFileSync(uiPath, ui, 'utf8');
console.log('ui_enhancements.js -> Modals styled with zIndex 100050');

// 4. interactive_tour.js
const tourPath = path.join(rootDir, 'interactive_tour.js');
let tour = fs.readFileSync(tourPath, 'utf8');

// Fix step 2 Degree Planner action button to call openGraduationClearanceModal / openGraduationAuditModal
const oldGradAuditRegex = /onClick:\s*\(\)\s*=>\s*\{\s*if\s*\(window\.DegreePlanner\s*&&\s*window\.DegreePlanner\.openGraduationAuditModal\)\s*\{\s*window\.DegreePlanner\.openGraduationAuditModal\(\);\s*\}\s*\}/;
const newGradAuditCode = `onClick: () => {
                    if (window.DegreePlanner) {
                        if (typeof window.DegreePlanner.openGraduationClearanceModal === 'function') {
                            window.DegreePlanner.openGraduationClearanceModal();
                        } else if (typeof window.DegreePlanner.openGraduationAuditModal === 'function') {
                            window.DegreePlanner.openGraduationAuditModal();
                        }
                    } else {
                        const btn = document.getElementById('btn-open-graduation-clearance');
                        if (btn) btn.click();
                    }
                }`;

tour = tour.replace(oldGradAuditRegex, newGradAuditCode);

// Fix step 9 text about opening tour (from top compass -> to settings/Ctrl+K/T)
tour = tour.replace(
    'תוכל לפתוח את המדריך והסיור הזה בכל רגע בלחיצה על סמל המצפן (🧭) בסרגל העליון!',
    'תוכל לפתוח את המדריך והסיור הזה בכל רגע דרך ההגדרות (Settings ⚙️), שורת הפקודות (Ctrl+K) או במקש T במקלדת!'
);

fs.writeFileSync(tourPath, tour, 'utf8');
console.log('interactive_tour.js -> Tour action calls and text updated');
console.log('All modal z-index fixes applied!');
