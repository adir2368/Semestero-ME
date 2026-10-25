import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Starting patch for Keyboard Shortcuts & window.switchTab...")

# 1. Update app.js to define window.switchTab globally
with open("app.js", "r", encoding="utf-8") as f:
    app_code = f.read()

switch_tab_def = """// Global Tab Switcher helper
window.switchTab = function(tabNameOrNumber) {
    if (!tabNameOrNumber) return;
    const str = String(tabNameOrNumber).trim().toLowerCase();
    
    const tabMapping = {
        '1': 'tab-curriculum',
        'tree': 'tab-curriculum',
        'curriculum': 'tab-curriculum',
        'skill-tree': 'tab-curriculum',

        '2': 'tab-planner',
        'planner': 'tab-planner',

        '3': 'tab-timetable',
        'timetable': 'tab-timetable',
        'schedule': 'tab-timetable',

        '4': 'tab-tasks',
        'tasks': 'tab-tasks',
        'kanban': 'tab-tasks',

        '5': 'tab-calendar',
        'calendar': 'tab-calendar',
        'exams': 'tab-calendar',

        '6': 'tab-settings',
        'settings': 'tab-settings'
    };

    const targetElementId = tabMapping[str];
    if (targetElementId) {
        const btn = document.getElementById(targetElementId);
        if (btn) {
            btn.click();
            return;
        }
    }

    const directMap = {
        '1': 'curriculum', 'tree': 'curriculum', 'curriculum': 'curriculum',
        '2': 'planner', 'planner': 'planner',
        '3': 'timetable', 'timetable': 'timetable',
        '4': 'tasks', 'tasks': 'tasks',
        '5': 'calendar', 'calendar': 'calendar', 'exams': 'calendar',
        '6': 'settings', 'settings': 'settings'
    };
    const mainTab = directMap[str] || str;
    if (typeof window.setActiveMainTab === 'function') {
        window.setActiveMainTab(mainTab);
    }
};
"""

if "window.switchTab = function(" not in app_code:
    # Insert right before setActiveMainTab or near navigation
    target_pos = app_code.find("function setActiveMainTab(activeTabId) {")
    if target_pos != -1:
        app_code = app_code[:target_pos] + switch_tab_def + "\n    " + app_code[target_pos:]
        with open("app.js", "w", encoding="utf-8") as f:
            f.write(app_code)
        print("✓ Successfully added window.switchTab to app.js")
    else:
        print("Warning: setActiveMainTab not found in app.js")
else:
    print("Note: window.switchTab already in app.js")

# 2. Update ui_enhancements.js: replace initKeyboardShortcuts and enhance cheat sheet
with open("ui_enhancements.js", "r", encoding="utf-8") as f:
    ui_code = f.read()

# Replace initKeyboardShortcuts implementation
old_shortcuts_fn_regex = r'''function initKeyboardShortcuts\(\)\s*\{[\s\S]*?\n    \}'''

new_shortcuts_fn = """    function initKeyboardShortcuts() {
        // Ensure window.switchTab is available globally
        if (!window.switchTab) {
            window.switchTab = function(targetTab) {
                if (!targetTab) return;
                const str = String(targetTab).trim().toLowerCase();
                const mapping = {
                    '1': 'tab-curriculum',
                    'tree': 'tab-curriculum',
                    'curriculum': 'tab-curriculum',
                    'skill-tree': 'tab-curriculum',
                    '2': 'tab-planner',
                    'planner': 'tab-planner',
                    '3': 'tab-timetable',
                    'timetable': 'tab-timetable',
                    'schedule': 'tab-timetable',
                    '4': 'tab-tasks',
                    'tasks': 'tab-tasks',
                    'kanban': 'tab-tasks',
                    '5': 'tab-calendar',
                    'calendar': 'tab-calendar',
                    'exams': 'tab-calendar',
                    '6': 'tab-settings',
                    'settings': 'tab-settings'
                };
                const btnId = mapping[str];
                const btn = btnId ? document.getElementById(btnId) : null;
                if (btn) {
                    btn.click();
                } else if (typeof window.setActiveMainTab === 'function') {
                    const fallbackMap = {
                        '1': 'curriculum', 'tree': 'curriculum', 'curriculum': 'curriculum',
                        '2': 'planner', 'planner': 'planner',
                        '3': 'timetable', 'timetable': 'timetable',
                        '4': 'tasks', 'tasks': 'tasks',
                        '5': 'calendar', 'calendar': 'calendar', 'exams': 'calendar',
                        '6': 'settings', 'settings': 'settings'
                    };
                    window.setActiveMainTab(fallbackMap[str] || str);
                }
            };
        }

        const handleGlobalKeyDown = (e) => {
            const activeEl = document.activeElement;
            const isTyping = activeEl && (
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || 
                activeEl.isContentEditable
            );

            const isCtrlOrMeta = e.ctrlKey || e.metaKey;
            const keyLower = (e.key || '').toLowerCase();
            const code = e.code || '';

            // 1. Command Palette Trigger: Ctrl+K / Cmd+K (works in EN, HE "ל", or by code) OR '/' when NOT typing
            const isKeyK = code === 'KeyK' || keyLower === 'k' || e.key === 'ל';
            if (isCtrlOrMeta && isKeyK && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openCommandPalette) window.openCommandPalette();
                return;
            }

            if (!isTyping && !isCtrlOrMeta && !e.altKey && (e.key === '/' || code === 'Slash' || code === 'NumpadDivide')) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openCommandPalette) window.openCommandPalette();
                return;
            }

            // 2. Global Escape: Close any open modal or Command Palette, or blur input
            if (e.key === 'Escape' || code === 'Escape') {
                const cmdModal = document.getElementById('command-palette-modal');
                if (cmdModal && (cmdModal.classList.contains('active') || cmdModal.style.display !== 'none')) {
                    e.preventDefault();
                    window.closeCommandPalette();
                    return;
                }

                // Check all open modals / overlays
                const openModals = document.querySelectorAll(
                    '.modal-overlay.active, .modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"], ' +
                    '.planner-export-modal.active, #notion-icon-picker-modal[style*="display: block"], [id$="-modal"].active'
                );

                if (openModals.length > 0) {
                    e.preventDefault();
                    if (window.closeCommandPalette) window.closeCommandPalette();
                    if (window.closeCourseComparisonModal) window.closeCourseComparisonModal();
                    if (window.closeFaqModal) window.closeFaqModal();
                    if (window.closeKeyboardShortcutsModal) window.closeKeyboardShortcutsModal();
                    if (window.closeTutorialHubModal) window.closeTutorialHubModal();
                    if (window.closeDownloadModal) window.closeDownloadModal();
                    if (window.closePrivacyPolicyModal) window.closePrivacyPolicyModal();
                    if (window.SiteAnalytics && window.SiteAnalytics.closeModal) window.SiteAnalytics.closeModal();
                    if (window.AuthSync && window.AuthSync.closeAuthModal) window.AuthSync.closeAuthModal();
                    
                    const btnCloseUpdate = document.getElementById('btn-close-version-update-modal');
                    if (btnCloseUpdate) btnCloseUpdate.click();

                    const btnCloseMiluim = document.getElementById('btn-close-miluim-modal');
                    if (btnCloseMiluim) btnCloseMiluim.click();

                    const notifClose = document.getElementById('btn-close-notif-drawer');
                    const drawerOverlay = document.getElementById('notif-drawer-overlay');
                    if (notifClose && drawerOverlay && drawerOverlay.style.display !== 'none') {
                        notifClose.click();
                    }

                    // Generic close buttons
                    openModals.forEach(m => {
                        const closeBtn = m.querySelector('.modal-close, .export-modal-close, [data-dismiss="modal"]');
                        if (closeBtn) closeBtn.click();
                        else {
                            m.style.display = 'none';
                            m.classList.remove('active');
                        }
                    });
                    return;
                }

                if (isTyping && activeEl && typeof activeEl.blur === 'function') {
                    activeEl.blur();
                }
                return;
            }

            // 3. Ctrl+S / Cmd+S: Cloud Sync (works even when typing!)
            const isKeyS = code === 'KeyS' || keyLower === 's' || e.key === 'ד';
            if (isCtrlOrMeta && isKeyS && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.AuthSync && window.AuthSync.syncToCloud) {
                    window.AuthSync.syncToCloud();
                    if (typeof window.showHudToast === 'function') {
                        window.showHudToast('💾 נתונים נשמרו וסונכרנו לענן!', 'success');
                    }
                }
                return;
            }

            // 4. Ctrl+D / Cmd+D: Direct Downloads Modal
            const isKeyD = code === 'KeyD' || keyLower === 'd' || e.key === 'ג';
            if (isCtrlOrMeta && isKeyD && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openDownloadModal) window.openDownloadModal();
                return;
            }

            // 5. Ctrl+G / Cmd+G: Graduation Audit / Clearance Modal
            const isKeyG = code === 'KeyG' || keyLower === 'g' || e.key === 'ע';
            if (isCtrlOrMeta && isKeyG && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.DegreePlanner) {
                    if (window.DegreePlanner.openGraduationClearanceModal) {
                        window.DegreePlanner.openGraduationClearanceModal();
                    } else if (window.DegreePlanner.openGraduationAuditModal) {
                        window.DegreePlanner.openGraduationAuditModal();
                    }
                }
                return;
            }

            // 6. Ctrl+H / Cmd+H: FAQ & Student Rights Modal
            const isKeyH = code === 'KeyH' || keyLower === 'h' || e.key === 'י';
            if (isCtrlOrMeta && isKeyH && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openFaqModal) window.openFaqModal();
                return;
            }

            // 7. Ctrl+Shift+A / Cmd+Shift+A: Admin Site Analytics (Adir only)
            const isKeyA = code === 'KeyA' || keyLower === 'a' || e.key === 'ש';
            if (isCtrlOrMeta && e.shiftKey && isKeyA) {
                if (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive()) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.SiteAnalytics) window.SiteAnalytics.openModal();
                    return;
                }
            }

            // Stop here if user is typing in a text field
            if (isTyping) return;

            // 8. Shortcuts Cheat Sheet: '?' key when NOT typing
            if ((e.key === '?' || (e.shiftKey && (code === 'Slash' || e.key === '/'))) && !isCtrlOrMeta && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openKeyboardShortcutsModal) window.openKeyboardShortcutsModal();
                return;
            }

            // 9. Interactive Tutorial Hub: 'T' key when NOT typing
            const isKeyT = code === 'KeyT' || keyLower === 't' || e.key === 'א';
            if (isKeyT && !isCtrlOrMeta && !e.altKey && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.openTutorialHubModal) window.openTutorialHubModal();
                else if (window.startInteractiveTour) window.startInteractiveTour();
                return;
            }

            // 10. Number Keys 1-6: Quick Tab Switching
            let pressedDigit = null;
            if (code.startsWith('Digit')) {
                pressedDigit = code.replace('Digit', '');
            } else if (code.startsWith('Numpad')) {
                pressedDigit = code.replace('Numpad', '');
            } else if (e.key >= '1' && e.key <= '6') {
                pressedDigit = e.key;
            }

            if (pressedDigit && pressedDigit >= '1' && pressedDigit <= '6' && !isCtrlOrMeta && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.switchTab) {
                    window.switchTab(pressedDigit);
                    const tabNames = {
                        '1': 'עץ מיומנויות (מפת קורסים)',
                        '2': 'תכנון תואר (Planner)',
                        '3': 'מערכת שעות שבועית (Timetable)',
                        '4': 'לוח משימות (Tasks Kanban)',
                        '5': 'לוח שנה ומבחנים (Exams & Calendar)',
                        '6': 'הגדרות מערכת (Settings)'
                    };
                    if (typeof window.showHudToast === 'function') {
                        window.showHudToast(`מעבר לטאב: ${tabNames[pressedDigit] || pressedDigit} ⚡`, 'info');
                    }
                }
                return;
            }
        };

        // Attach with useCapture = true so it catches events early and reliably
        window.addEventListener('keydown', handleGlobalKeyDown, true);
    }"""

if re.search(old_shortcuts_fn_regex, ui_code):
    ui_code = re.sub(old_shortcuts_fn_regex, new_shortcuts_fn, ui_code, count=1)
    print("✓ Successfully replaced initKeyboardShortcuts in ui_enhancements.js")
else:
    print("Warning: old_shortcuts_fn_regex not matched!")

# Also enhance the modal cheat sheet in ui_enhancements.js
old_shortcuts_modal_body = """                    <div class="shortcuts-grid">
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>/</kbd></span>
                            <span class="shortcut-desc">פתיחת חיפוש חכם ופקודות מהירות (Command Palette)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>1</kbd> - <kbd>6</kbd></span>
                            <span class="shortcut-desc">מעבר מהיר בין טאבים (1=עץ, 2=תכנון, 3=לו״ז, 4=משימות, 5=מבחנים, 6=הגדרות)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Esc</kbd></span>
                            <span class="shortcut-desc">סגירת כל חלון קופץ / מודל פעיל</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
                            <span class="shortcut-desc">שמירה מקומית וסנכרון מיידי לענן</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>?</kbd></span>
                            <span class="shortcut-desc">פתיחת חלון מקשי קיצור זה</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>↑</kbd> <kbd>↓</kbd> + <kbd>Enter</kbd></span>
                            <span class="shortcut-desc">ניווט ובחירה בחיפוש החכם</span>
                        </div>
                    </div>"""

new_shortcuts_modal_body = """                    <div class="shortcuts-grid">
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>/</kbd></span>
                            <span class="shortcut-desc">פתיחת חיפוש חכם ופקודות מהירות (Command Palette)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>1</kbd> - <kbd>6</kbd></span>
                            <span class="shortcut-desc">מעבר מהיר בין טאבים (1=עץ, 2=תכנון, 3=לו״ז, 4=משימות, 5=מבחנים, 6=הגדרות)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Esc</kbd></span>
                            <span class="shortcut-desc">סגירת כל חלון קופץ / מודל פעיל</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
                            <span class="shortcut-desc">שמירה מקומית וסנכרון מיידי לענן (פועל גם בעריכה)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>D</kbd></span>
                            <span class="shortcut-desc">מרכז הורדות ישירות (Android APK / מחשב)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>G</kbd></span>
                            <span class="shortcut-desc">בדיקת זכאות לתואר ודרישות סיום (Graduation Audit)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>Ctrl</kbd> + <kbd>H</kbd></span>
                            <span class="shortcut-desc">מרכז זכויות ושאלות נפוצות בטכניון (FAQ)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>T</kbd></span>
                            <span class="shortcut-desc">מדריך מערכת וסיור אינטראקטיבי (Tutorial Academy)</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>?</kbd></span>
                            <span class="shortcut-desc">פתיחת חלון מקשי קיצור זה</span>
                        </div>
                        <div class="shortcut-card">
                            <span class="shortcut-key"><kbd>↑</kbd> <kbd>↓</kbd> + <kbd>Enter</kbd></span>
                            <span class="shortcut-desc">ניווט ובחירה בחיפוש החכם</span>
                        </div>
                    </div>
                    <div style="margin-top: 12px; font-size: 0.76rem; color: #38bdf8; text-align: center; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 6px 10px;">
                        💡 <strong>טיפ:</strong> כל מקשי הקיצור פועלים באופן מלא ועצמאי גם כאשר המקלדת בשפה העברית!
                    </div>"""

if old_shortcuts_modal_body in ui_code:
    ui_code = ui_code.replace(old_shortcuts_modal_body, new_shortcuts_modal_body)
    print("✓ Enhanced shortcuts cheat sheet modal with all key combinations")

with open("ui_enhancements.js", "w", encoding="utf-8") as f:
    f.write(ui_code)

print("✓ Finished patch for Keyboard Shortcuts.")
