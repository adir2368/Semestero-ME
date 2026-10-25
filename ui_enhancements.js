/**
 * Semestero ME - UI Enhancements Suite
 * 
 * Includes:
 * 1. Global Command Palette & Smart Search (Ctrl+K / ⌘K / /)
 * 2. Keyboard Shortcuts Engine (1-6 tab switching, Esc to close, ?, Ctrl+S)
 * 3. Floating "Back to Top" Scroll Button
 * 4. One-Click Copy to Clipboard with Feedback
 * 5. Course Wishlist (Save for Later) & Recently Viewed Courses
 * 6. Interactive Side-by-Side Course Comparison Tool
 * 7. Searchable Technion FAQ & Academic Rights Knowledge Base
 * 8. Modal Reading & Scroll Progress Bar
 * 9. UI Text Scale Accessibility Controller
 */

(function(window, document) {
    'use strict';

    // =========================================================================
    // 1. Storage & State Management
    // =========================================================================
    const STORAGE_KEYS = {
        WISHLIST: 'ast_course_wishlist_v1',
        RECENT: 'ast_recently_viewed_v1',
        FONT_SCALE: 'ast_ui_font_scale_v1'
    };

    function safeGetJson(key, defaultVal) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function safeSetJson(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
    }

    // =========================================================================
    // 2. Toast & Copy Utilities
    // =========================================================================
    window.copyToClipboard = async function(text, successMsg) {
        if (!text) return;
        const msg = successMsg || `📋 הועתק ללוח: "${text}"`;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            if (typeof window.showHudToast === 'function') {
                window.showHudToast(msg, 'success');
            } else if (typeof window.showToastNotification === 'function') {
                window.showToastNotification(msg, 'success');
            }
        } catch (err) {
            console.warn('[Clipboard] Copy failed:', err);
        }
    };

    // =========================================================================
    // 3. Floating Back to Top Button
    // =========================================================================
    function initBackToTop() {
        let btn = document.getElementById('btn-back-to-top');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'btn-back-to-top';
            btn.type = 'button';
            btn.className = 'btn-back-to-top';
            btn.title = 'חזרה לראש העמוד (Top) 🔝';
            btn.setAttribute('aria-label', 'חזרה לראש העמוד');
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            `;
            document.body.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Also scroll active tab view if scrollable container exists
            const scrollContainers = document.querySelectorAll('.planner-content, .timetable-container, .tasks-scroll, .active-tab-content');
            scrollContainers.forEach(el => el.scrollTo({ top: 0, behavior: 'smooth' }));
        });

        const toggleVisibility = () => {
            const scrolled = window.scrollY > 300 || document.documentElement.scrollTop > 300;
            if (scrolled) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        toggleVisibility();
    }

    // =========================================================================
    // 4. Modal Reading & Scroll Progress Bar
    // =========================================================================
    function attachModalScrollProgress(modalBodyEl, progressEl) {
        if (!modalBodyEl || !progressEl) return;
        const handler = () => {
            const scrollTop = modalBodyEl.scrollTop;
            const scrollHeight = modalBodyEl.scrollHeight - modalBodyEl.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        };
        modalBodyEl.removeEventListener('scroll', modalBodyEl._progressHandler);
        modalBodyEl._progressHandler = handler;
        modalBodyEl.addEventListener('scroll', handler, { passive: true });
        handler();
    }

    // =========================================================================
    // 5. Course Wishlist (Save for Later) & Recently Viewed
    // =========================================================================
    const CourseWishlist = {
        getAll() {
            return safeGetJson(STORAGE_KEYS.WISHLIST, []);
        },
        has(code) {
            const norm = String(code || '').replace(/^0+/, '');
            return this.getAll().some(c => String(c.code).replace(/^0+/, '') === norm);
        },
        toggle(course) {
            if (!course || !course.code) return false;
            let list = this.getAll();
            const norm = String(course.code).replace(/^0+/, '');
            const idx = list.findIndex(c => String(c.code).replace(/^0+/, '') === norm);
            let isAdded = false;
            if (idx >= 0) {
                list.splice(idx, 1);
                isAdded = false;
            } else {
                list.push({
                    code: course.code,
                    altCode: course.altCode,
                    name: course.name,
                    credits: course.credits,
                    faculty: course.faculty || 'הנדסת מכונות',
                    addedAt: Date.now()
                });
                isAdded = true;
            }
            safeSetJson(STORAGE_KEYS.WISHLIST, list);
            const msg = isAdded ? `⭐ הקורס ${course.name} נשמר במועדפים!` : `הקורס ${course.name} הוסר מהמועדפים`;
            if (typeof window.showHudToast === 'function') window.showHudToast(msg, isAdded ? 'success' : 'info');
            this.renderWishlistPillCount();
            return isAdded;
        },
        renderWishlistPillCount() {
            const count = this.getAll().length;
            const badge = document.getElementById('wishlist-badge-count');
            if (badge) {
                badge.innerText = count;
                badge.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        }
    };
    window.CourseWishlist = CourseWishlist;

    const RecentlyViewed = {
        getAll() {
            return safeGetJson(STORAGE_KEYS.RECENT, []);
        },
        track(course) {
            if (!course || !course.code) return;
            const norm = String(course.code).replace(/^0+/, '');
            let list = this.getAll().filter(c => String(c.code).replace(/^0+/, '') !== norm);
            list.unshift({
                code: course.code,
                name: course.name,
                credits: course.credits,
                viewedAt: Date.now()
            });
            list = list.slice(0, 7); // keep last 7
            safeSetJson(STORAGE_KEYS.RECENT, list);
            this.renderRecentChips();
        },
        renderRecentChips() {
            const container = document.getElementById('recent-courses-chips-container');
            if (!container) return;
            const list = this.getAll();
            if (list.length === 0) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'flex';
            container.innerHTML = `
                <span style="font-size: 0.72rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; margin-left: 6px;">
                    <span>🕒</span> <span>נצפו לאחרונה:</span>
                </span>
                ${list.map(c => `
                    <button type="button" class="recent-course-chip" onclick="if(window.openCourseDetailsModal) window.openCourseDetailsModal('${c.code}'); else if(window.openCourseComparisonModal) window.openCourseComparisonModal('${c.code}');" title="${c.name} (${c.credits} נק״ז)">
                        <span style="font-weight: 800; color: #38bdf8;">${c.code}</span>
                        <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.name}</span>
                    </button>
                `).join('')}
            `;
        }
    };
    window.RecentlyViewed = RecentlyViewed;

    // =========================================================================
    // 6. Global Command Palette & Smart Search (Ctrl+K / ⌘K)
    // =========================================================================
    let allSearchableIndex = [];

    function buildSearchIndex() {
        const items = [];

        // 1. Quick Navigation Tabs
        const tabs = [
            { id: 'tab-tree', title: 'עץ מיומנויות אקדמי (Skill Tree)', icon: '🌳', shortcut: '1', action: () => window.switchTab && window.switchTab('tree') },
            { id: 'tab-planner', title: 'תכנון תואר רב-סמסטריאלי (Degree Planner)', icon: '📅', shortcut: '2', action: () => window.switchTab && window.switchTab('planner') },
            { id: 'tab-timetable', title: 'מערכת שעות שבועית (Timetable)', icon: '🕒', shortcut: '3', action: () => window.switchTab && window.switchTab('timetable') },
            { id: 'tab-tasks', title: 'לוח משימות ומודל (Tasks Kanban)', icon: '📋', shortcut: '4', action: () => window.switchTab && window.switchTab('tasks') },
            { id: 'tab-exams', title: 'לוח מבחנים ומועדים (Exams)', icon: '📝', shortcut: '5', action: () => window.switchTab && window.switchTab('exams') },
            { id: 'tab-settings', title: 'הגדרות מערכת וגיבוי (Settings)', icon: '⚙️', shortcut: '6', action: () => window.switchTab && window.switchTab('settings') }
        ];
        tabs.forEach(t => items.push({ ...t, type: 'nav', group: 'ניווט מהיר' }));

        // 2. Global Actions
        const actions = [
            { id: 'act-tour', title: 'מדריך מערכת וסיור אינטראקטיבי (Tutorial Academy)', icon: '🧭', shortcut: 'T', action: () => (window.openTutorialHubModal ? window.openTutorialHubModal() : window.startInteractiveTour && window.startInteractiveTour()) },
            { id: 'act-audit', title: 'בדיקת זכאות לתואר ודרישות סיום (Graduation Audit)', icon: '🎓', shortcut: 'Ctrl+G', action: () => window.DegreePlanner && (window.DegreePlanner.openGraduationClearanceModal ? window.DegreePlanner.openGraduationClearanceModal() : window.DegreePlanner.openGraduationAuditModal && window.DegreePlanner.openGraduationAuditModal()) },
            { id: 'act-faq', title: 'מרכז זכויות ושאלות נפוצות (Technion FAQ & Rights)', icon: '📖', shortcut: 'Ctrl+H', action: () => window.openFaqModal() },
            { id: 'act-compare', title: 'השוואת קורסי בחירה צד-מול-צד (Course Comparator)', icon: '⚖️', shortcut: '', action: () => window.openCourseComparisonModal() },
            { id: 'act-downloads', title: 'מרכז הורדה ישירה (Android APK / מחשב)', icon: '⬇️', shortcut: 'Ctrl+D', action: () => window.openDownloadModal() },
            { id: 'act-sync', title: 'סנכרון מיידי לענן (Supabase Cloud Sync)', icon: '🔄', shortcut: 'Ctrl+S', action: () => window.AuthSync && window.AuthSync.syncToCloud && window.AuthSync.syncToCloud() },
            { id: 'act-shortcuts', title: 'מקשי קיצור במקלדת (Keyboard Shortcuts)', icon: '⌨️', shortcut: '?', action: () => window.openKeyboardShortcutsModal() }
        ];
        actions.forEach(a => items.push({ ...a, type: 'action', group: 'פעולות מערכת' }));

        // 3. Courses from catalog & CheeseFork
        const courseMap = new Map();
        if (window.CHEESEFORK_DB && Array.isArray(window.CHEESEFORK_DB)) {
            window.CHEESEFORK_DB.forEach(c => {
                const code = c.rawNum || c.code6 || c.code;
                if (code && !courseMap.has(code)) {
                    courseMap.set(code, {
                        id: `course-${code}`,
                        code: code,
                        title: `${code} - ${c.name}`,
                        name: c.name,
                        credits: c.credits,
                        faculty: c.faculty || 'טכניון',
                        icon: '📚',
                        type: 'course',
                        group: 'קורסים אקדמיים',
                        action: () => {
                            RecentlyViewed.track({ code, name: c.name, credits: c.credits });
                            if (window.DegreePlanner && window.DegreePlanner.openCourseDetailModal) {
                                window.DegreePlanner.openCourseDetailModal(code);
                            } else if (window.openCourseComparisonModal) {
                                window.openCourseComparisonModal(code);
                            }
                        }
                    });
                }
            });
        }
        if (window.PLANNER_CATALOG) {
            Object.values(window.PLANNER_CATALOG).forEach(list => {
                if (Array.isArray(list)) {
                    list.forEach(c => {
                        const code = c.code || c.altCode;
                        if (code && !courseMap.has(code)) {
                            courseMap.set(code, {
                                id: `course-${code}`,
                                code: code,
                                title: `${code} - ${c.name}`,
                                name: c.name,
                                credits: c.credits,
                                faculty: c.faculty || 'מכונות',
                                icon: '📚',
                                type: 'course',
                                group: 'קורסים אקדמיים',
                                action: () => {
                                    RecentlyViewed.track({ code, name: c.name, credits: c.credits });
                                    if (window.DegreePlanner && window.DegreePlanner.openCourseDetailModal) {
                                        window.DegreePlanner.openCourseDetailModal(code);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        courseMap.forEach(item => items.push(item));

        // 4. Tasks from Notion / GameState
        if (window.gameState && window.gameState.notionTasks && Array.isArray(window.gameState.notionTasks)) {
            window.gameState.notionTasks.slice(0, 20).forEach(t => {
                items.push({
                    id: `task-${t.id || t.title}`,
                    title: `משימה: ${t.title || 'ללא כותרת'} (${t.course || 'כללי'})`,
                    icon: '📝',
                    type: 'task',
                    group: 'משימות ומטלות',
                    action: () => {
                        if (window.switchTab) window.switchTab('tasks');
                    }
                });
            });
        }

        allSearchableIndex = items;
    }

    let activeSelectedIndex = 0;

    window.openCommandPalette = function() {
        buildSearchIndex();
        let modal = document.getElementById('command-palette-modal');
        if (!modal) {
            createCommandPaletteModal();
            modal = document.getElementById('command-palette-modal');
        }
        modal.style.display = 'flex';
        modal.classList.add('active');
        const input = document.getElementById('command-palette-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        renderCommandPaletteResults('');
    };

    window.closeCommandPalette = function() {
        const modal = document.getElementById('command-palette-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    function createCommandPaletteModal() {
        const div = document.createElement('div');
        div.id = 'command-palette-modal';
        div.className = 'modal-overlay command-palette-overlay';
        div.style.display = 'none';
        div.innerHTML = `
            <div class="command-palette-container" onclick="event.stopPropagation()">
                <div class="command-palette-header">
                    <span class="command-palette-search-icon">🔍</span>
                    <input type="text" id="command-palette-input" class="command-palette-input" placeholder="חפש קורס, משימה, פעולה או טאב... (Ctrl+K)" autocomplete="off" spellcheck="false" dir="rtl">
                    <kbd class="command-palette-esc-kbd" onclick="window.closeCommandPalette()">ESC</kbd>
                </div>
                <div class="command-palette-body" id="command-palette-results">
                    <!-- Dynamic Search Results -->
                </div>
                <div class="command-palette-footer">
                    <span>נווט עם <kbd>↑</kbd> <kbd>↓</kbd></span>
                    <span>בחר עם <kbd>Enter</kbd></span>
                    <span>סגור עם <kbd>Esc</kbd></span>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target === div) window.closeCommandPalette();
        });
        document.body.appendChild(div);

        const input = document.getElementById('command-palette-input');
        input.addEventListener('input', (e) => {
            activeSelectedIndex = 0;
            renderCommandPaletteResults(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            const results = document.querySelectorAll('.command-palette-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeSelectedIndex = (activeSelectedIndex + 1) % Math.max(1, results.length);
                updateItemSelection(results);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeSelectedIndex = (activeSelectedIndex - 1 + results.length) % Math.max(1, results.length);
                updateItemSelection(results);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[activeSelectedIndex]) {
                    results[activeSelectedIndex].click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                window.closeCommandPalette();
            }
        });
    }

    function updateItemSelection(results) {
        results.forEach((el, idx) => {
            if (idx === activeSelectedIndex) {
                el.classList.add('selected');
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.classList.remove('selected');
            }
        });
    }

    function renderCommandPaletteResults(query) {
        const container = document.getElementById('command-palette-results');
        if (!container) return;

        const q = (query || '').trim().toLowerCase();
        let matches = [];

        if (!q) {
            // Default: Show Navigation and Quick Actions
            matches = allSearchableIndex.filter(item => item.type === 'nav' || item.type === 'action');
        } else {
            const qNorm = q.replace(/^0+/, '');
            matches = allSearchableIndex.filter(item => {
                const titleMatch = (item.title || '').toLowerCase().includes(q);
                const codeMatch = item.code ? String(item.code).toLowerCase().includes(q) || String(item.code).replace(/^0+/, '').includes(qNorm) : false;
                return titleMatch || codeMatch;
            }).slice(0, 30);
        }

        if (matches.length === 0) {
            container.innerHTML = `
                <div class="command-palette-empty">
                    <span style="font-size: 1.8rem; margin-bottom: 6px;">🔍</span>
                    <div>לא נמצאו תוצאות התואמות ל-"<strong>${query}</strong>"</div>
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">נסה לחפש לפי קוד קורס (למשל: 114051), שם נושא או פעולה</div>
                </div>
            `;
            return;
        }

        // Group matches
        const groups = {};
        matches.forEach(item => {
            const grp = item.group || 'תוצאות';
            if (!groups[grp]) groups[grp] = [];
            groups[grp].push(item);
        });

        let html = '';
        let globalIdx = 0;

        Object.keys(groups).forEach(grpName => {
            html += `<div class="command-palette-group-title">${grpName}</div>`;
            groups[grpName].forEach(item => {
                const isSelected = globalIdx === activeSelectedIndex ? 'selected' : '';
                const shortcutHtml = item.shortcut ? `<kbd class="command-palette-shortcut">${item.shortcut}</kbd>` : '';
                const creditsHtml = item.credits ? `<span class="command-palette-credits">${item.credits} נק״ז</span>` : '';
                html += `
                    <div class="command-palette-item ${isSelected}" data-index="${globalIdx}" onclick="window.closeCommandPalette(); (${item.action.toString()})();">
                        <div class="command-palette-item-left">
                            <span class="command-palette-item-icon">${item.icon}</span>
                            <span class="command-palette-item-title">${item.title}</span>
                        </div>
                        <div class="command-palette-item-right">
                            ${creditsHtml}
                            ${shortcutHtml}
                        </div>
                    </div>
                `;
                globalIdx++;
            });
        });

        container.innerHTML = html;

        // Hover handling
        container.querySelectorAll('.command-palette-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                activeSelectedIndex = parseInt(el.dataset.index, 10);
                updateItemSelection(container.querySelectorAll('.command-palette-item'));
            });
        });
    }

    // =========================================================================
    // 7. Keyboard Shortcuts Engine
    // =========================================================================
    function initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

            // 1. Command Palette Trigger: Ctrl+K / ⌘K or '/' when not typing
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                window.openCommandPalette();
                return;
            }
            if (e.key === '/' && !isTyping) {
                e.preventDefault();
                window.openCommandPalette();
                return;
            }

            // 2. Global Escape: Close any open modal
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"]');
                if (openModals.length > 0) {
                    e.preventDefault();
                    window.closeCommandPalette();
                    if (window.closeCourseComparisonModal) window.closeCourseComparisonModal();
                    if (window.closeFaqModal) window.closeFaqModal();
                    if (window.closeKeyboardShortcutsModal) window.closeKeyboardShortcutsModal();
                    if (window.closeTutorialHubModal) window.closeTutorialHubModal();
                    if (window.closeDownloadModal) window.closeDownloadModal();
                    const btnCloseUpdate = document.getElementById('btn-close-version-update-modal');
                    if (btnCloseUpdate) btnCloseUpdate.click();
                    const notifClose = document.getElementById('btn-close-notif-drawer');
                    if (notifClose && document.getElementById('notif-drawer-overlay').style.display !== 'none') notifClose.click();
                }
                return;
            }

            // 3. Shortcuts Cheat Sheet: '?' key when not typing
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
            }

            // 4. Tab Navigation (1-6) when not typing and no modifier
            if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key;
                if (key >= '1' && key <= '6') {
                    const tabMap = {
                        '1': 'tree',
                        '2': 'planner',
                        '3': 'timetable',
                        '4': 'tasks',
                        '5': 'exams',
                        '6': 'settings'
                    };
                    const targetTab = tabMap[key];
                    if (targetTab && typeof window.switchTab === 'function') {
                        e.preventDefault();
                        window.switchTab(targetTab);
                        if (typeof window.showHudToast === 'function') {
                            window.showHudToast(`מעבר לטאב: ${key} ⚡`, 'info');
                        }
                    }
                }
            }

            // 5. Ctrl+S / ⌘S Cloud Sync
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                if (window.AuthSync && window.AuthSync.syncToCloud) {
                    window.AuthSync.syncToCloud();
                    if (typeof window.showHudToast === 'function') {
                        window.showHudToast('💾 נתונים נשמרו וסונכרנו לענן!', 'success');
                    }
                }
            }
        });
    }

    // =========================================================================
    // 8. Interactive Side-by-Side Course Comparison Tool
    // =========================================================================
    window.openCourseComparisonModal = function(initialCode1, initialCode2) {
        let modal = document.getElementById('course-comparison-modal');
        if (!modal) {
            createCourseComparisonModal();
            modal = document.getElementById('course-comparison-modal');
        }
        modal.style.display = 'flex';
        modal.classList.add('active');

        // Populate course selects
        populateCourseCompareOptions();

        if (initialCode1) {
            const sel1 = document.getElementById('compare-select-1');
            if (sel1) sel1.value = initialCode1;
        }
        if (initialCode2) {
            const sel2 = document.getElementById('compare-select-2');
            if (sel2) sel2.value = initialCode2;
        }

        renderComparisonTable();
    };

    window.closeCourseComparisonModal = function() {
        const modal = document.getElementById('course-comparison-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    function createCourseComparisonModal() {
        const div = document.createElement('div');
        div.id = 'course-comparison-modal';
        div.className = 'modal-overlay';
        div.style.display = 'none';
        div.style.zIndex = '100050';
        div.innerHTML = `
            <div class="modal-content comparison-modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 style="display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.25rem; color: #f8fafc; font-weight: 800;">
                        <span>⚖️</span> <span>השוואת קורסי בחירה צד-מול-צד (Course Comparator)</span>
                    </h2>
                    <button type="button" class="modal-close" onclick="window.closeCourseComparisonModal()">&times;</button>
                </div>
                <div class="comparison-selectors-row">
                    <div class="comparison-select-box">
                        <label for="compare-select-1">קורס ראשון (A):</label>
                        <select id="compare-select-1" class="comparison-select" onchange="renderComparisonTable()"></select>
                    </div>
                    <span class="comparison-vs-badge">VS</span>
                    <div class="comparison-select-box">
                        <label for="compare-select-2">קורס שני (B):</label>
                        <select id="compare-select-2" class="comparison-select" onchange="renderComparisonTable()"></select>
                    </div>
                </div>
                <div class="modal-body comparison-modal-body" id="comparison-table-container">
                    <!-- Dynamic comparison table -->
                </div>
                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.78rem; color: #94a3b8;">
                        💡 נתונים מאומתים ממאגר CheeseFork ומערכת שעות הרשמית של הטכניון
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.closeCourseComparisonModal()">סגור</button>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target === div) window.closeCourseComparisonModal();
        });
        document.body.appendChild(div);
    }

    function populateCourseCompareOptions() {
        const sel1 = document.getElementById('compare-select-1');
        const sel2 = document.getElementById('compare-select-2');
        if (!sel1 || !sel2) return;

        const courses = [];
        const seen = new Set();

        if (window.CHEESEFORK_DB && Array.isArray(window.CHEESEFORK_DB)) {
            window.CHEESEFORK_DB.forEach(c => {
                const code = c.rawNum || c.code6 || c.code;
                if (code && !seen.has(code)) {
                    seen.add(code);
                    courses.push({ code, name: c.name, credits: c.credits });
                }
            });
        }
        courses.sort((a, b) => a.name.localeCompare(b.name, 'he'));

        const optionsHtml = courses.map(c => `<option value="${c.code}">${c.code} - ${c.name} (${c.credits} נק״ז)</option>`).join('');
        sel1.innerHTML = optionsHtml;
        sel2.innerHTML = optionsHtml;

        // Default: pick two popular electives if not set
        if (!sel1.value && courses.length > 0) sel1.value = courses[0].code;
        if (!sel2.value && courses.length > 1) sel2.value = courses[1].code;
    }

    window.renderComparisonTable = function() {
        const container = document.getElementById('comparison-table-container');
        const sel1 = document.getElementById('compare-select-1');
        const sel2 = document.getElementById('compare-select-2');
        if (!container || !sel1 || !sel2) return;

        const code1 = sel1.value;
        const code2 = sel2.value;

        const getCourseData = (code) => {
            if (!code) return null;
            let c = null;
            if (window.CHEESEFORK_DB && Array.isArray(window.CHEESEFORK_DB)) {
                c = window.CHEESEFORK_DB.find(x => (x.rawNum === code || x.code6 === code || x.code === code));
            }
            if (!c && window.PLANNER_CATALOG) {
                Object.values(window.PLANNER_CATALOG).forEach(list => {
                    if (Array.isArray(list)) {
                        const found = list.find(x => x.code === code || x.altCode === code);
                        if (found) c = found;
                    }
                });
            }
            return c;
        };

        const c1 = getCourseData(code1);
        const c2 = getCourseData(code2);

        if (!c1 || !c2) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">בחר שני קורסים להשוואה</div>`;
            return;
        }

        const isMoedAConflict = (c1.moedA && c2.moedA && c1.moedA === c2.moedA);
        const isMoedBConflict = (c1.moedB && c2.moedB && c1.moedB === c2.moedB);

        container.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th style="width: 28%;">מאפיין השוואה</th>
                        <th style="width: 36%; color: #38bdf8;">
                            <div style="font-size: 1.05rem; font-weight: 800;">${c1.name || c1.title}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8; font-family: monospace;">${code1}</div>
                        </th>
                        <th style="width: 36%; color: #34d399;">
                            <div style="font-size: 1.05rem; font-weight: 800;">${c2.name || c2.title}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8; font-family: monospace;">${code2}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="compare-label">נקודות זכות (נק״ז)</td>
                        <td class="compare-val highlight-num">${c1.credits || 0} נק״ז</td>
                        <td class="compare-val highlight-num">${c2.credits || 0} נק״ז</td>
                    </tr>
                    <tr>
                        <td class="compare-label">סיווג רשימה פקולטית</td>
                        <td class="compare-val">${c1.list ? `רשימה ${c1.list}` : (c1.type || 'בחירה')}</td>
                        <td class="compare-val">${c2.list ? `רשימה ${c2.list}` : (c2.type || 'בחירה')}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">פקולטה מלמדת</td>
                        <td class="compare-val">${c1.faculty || 'הנדסת מכונות'}</td>
                        <td class="compare-val">${c2.faculty || 'הנדסת מכונות'}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">דרישות קדם</td>
                        <td class="compare-val">${c1.prereqs || 'ללא דרישות קדם'}</td>
                        <td class="compare-val">${c2.prereqs || 'ללא דרישות קדם'}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">מועד א׳</td>
                        <td class="compare-val ${isMoedAConflict ? 'conflict-date' : ''}">${c1.moedA || 'טרם פורסם'}</td>
                        <td class="compare-val ${isMoedAConflict ? 'conflict-date' : ''}">
                            ${c2.moedA || 'טרם פורסם'}
                            ${isMoedAConflict ? '<div class="conflict-pill">⚠️ התנגשות מועד א׳!</div>' : ''}
                        </td>
                    </tr>
                    <tr>
                        <td class="compare-label">מועד ב׳</td>
                        <td class="compare-val ${isMoedBConflict ? 'conflict-date' : ''}">${c1.moedB || 'טרם פורסם'}</td>
                        <td class="compare-val ${isMoedBConflict ? 'conflict-date' : ''}">
                            ${c2.moedB || 'טרם פורסם'}
                            ${isMoedBConflict ? '<div class="conflict-pill">⚠️ התנגשות מועד ב׳!</div>' : ''}
                        </td>
                    </tr>
                    <tr>
                        <td class="compare-label">תקציר וסילבוס</td>
                        <td class="compare-val syllabus-text">${c1.syllabus || 'סילבוס מלא זמין בקטלוג'}</td>
                        <td class="compare-val syllabus-text">${c2.syllabus || 'סילבוס מלא זמין בקטלוג'}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">פעולות מהירות</td>
                        <td class="compare-val">
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-xs btn-outline" onclick="CourseWishlist.toggle({code: '${code1}', name: '${c1.name}', credits: ${c1.credits}})">⭐ מועדפים</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.copyToClipboard('${code1}', 'קוד קורס ${code1} הועתק!')">📋 העתק קוד</button>
                            </div>
                        </td>
                        <td class="compare-val">
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-xs btn-outline" onclick="CourseWishlist.toggle({code: '${code2}', name: '${c2.name}', credits: ${c2.credits}})">⭐ מועדפים</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.copyToClipboard('${code2}', 'קוד קורס ${code2} הועתק!')">📋 העתק קוד</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    // =========================================================================
    // 9. Searchable Student FAQ & Academic Rights Knowledge Base
    // =========================================================================
    const FAQ_ITEMS = [
        {
            category: 'מילואים',
            title: 'זכאות להפחתת 2 נק״ז בחירה חופשית (155.5 נק״ז במקום 157.5)',
            content: 'סטודנט ששירת 30 ימי מילואים ומעלה במהלך התואר (או צבר תקופת שירות מוכרת לפי מתווה חרבות ברזל) זכאי להפחתה של 2.0 נק״ז מחובות הבחירה החופשית לתואר. סך הנק״ז הנדרש לתואר יורד מ-157.5 ל-155.5 נק״ז. המערכת כוללת מתג ייעודי בביקורת התואר המשקלל זאת אוטומטית.'
        },
        {
            category: 'מילואים',
            title: 'זכאות למועדי ג׳ מיוחדים והתאמות בחינה',
            content: 'משרתי מילואים שנבצר מהם לגשת למועד א׳ או ב׳ עקב שירות פעיל זכאים למועד ג׳ מיוחד ללא עלות, להקלטות מלאות של כל ההרצאות והתרגולים, ולהגשת תרגילים באיחור מאושר מול מרצה הקורס.'
        },
        {
            category: 'עתודאים',
            title: 'הכרה בטירונות עתודאים (2.0 נק״ז בינאריות)',
            content: 'טירונות הנעשית על ידי סטודנטים במסלול העתודה האקדמית במהלך שנות התואר מוכרת רשמית על ידי מזכירות לימודי הסמכה כ-2 נקודות זכות בינאריות (ציון ״עובר״). הנקודות נספרות לתואר ולסל הבחירה החופשית ואינן משפיעות על הממוצע המצטבר.'
        },
        {
            category: 'פורמולה',
            title: 'נבחרת הפורמולה טכניון (Formula SAE) - שקלול נק״ז ומסלולים',
            content: 'ההשתתפות בנבחרת מוכרת בשני מסלולים נפרדים:\n1. מסלול בחירה חופשית (סמסטר 1 ואילך): 2.0 נק״ז בינאריות (ציון עובר) לכל סמסטר פעיל בנבחרת (מוכר עד 3 סמסטרים תחת קורסי פעילות ייצוגית 00340091-00340093).\n2. מסלול פרויקט תכן גמר (שנה ד׳): 6.0 נק״ז סה״כ (3 בסמסטר א׳ + 3 בסמסטר ב׳) בציונים מספריים המשוקללים בממוצע וסוגרים במלואו את חובת פרויקט הגמר הפקולטי במכונות (00340384-00340385).'
        },
        {
            category: 'מל״ג וספורט',
            title: 'חובת קורסי מל״ג (מדעי הרוח והחברה)',
            content: 'כל סטודנט לתואר ראשון בטכניון חייב לצבור לפחות 6.0 נק״ז מקורסי מל״ג / לימודים הומניסטיים (מחלקה 324). משרתי מילואים שצברו את הפחתת המילואים יכולים להמיר חלק מהמכסה בהתאם לתקנון הסמכה.'
        },
        {
            category: 'מל״ג וספורט',
            title: 'חובת קורסי חינוך גופני (ספורט)',
            content: 'חובה לסיים בהצלחה 2 קורסי חינוך גופני (מחלקה 394). קורסי ספורט מעניקים ציון בינארי (עובר/נכשל) ואינם משוקללים בממוצע הציונים, אך מהווים תנאי סף לקבלת התואר.'
        },
        {
            category: 'אנגלית',
            title: 'חובת קורסים בשפה האנגלית (English Content Courses)',
            content: 'החל ממחזורי הלימודים האחרונים, כל סטודנט בטכניון נדרש לסיים לפחות 2 קורסים הנלמדים בשפה האנגלית (קורסי תוכן פקולטיים או קורסי מל״ג באנגלית). המערכת של Semestero ME מסמנת אוטומטית קורסים אלו וסופרת אותם בביקורת התואר.'
        },
        {
            category: 'פרויקט גמר',
            title: 'תנאי סף לרישום לפרויקט תכן גמר במכונות',
            content: 'לרישום לפרויקט גמר (034045 או פרויקט פורמולה) נדרשת צבירה של לפחות 100 נק״ז אקדמיות וסיום קורסי החובה בתכן בסיסי: תכן מכונות 1 (034015), זרימה (034013), ומעבר חום (034014).'
        },
        {
            category: 'בחינות',
            title: 'סריקת מחברות בחינה ונוהל ערעור',
            content: 'מחברות הבחינה נסרקות ומועלות לאתר הקורס או פורטל הסטודנטים תוך מספר ימים מפרסום הציונים. הגשת ערעור על ציון בחינה מתאפשרת תוך 72 שעות ממועד פרסום הסריקה. המרצה או המתרגל מחויבים להשיב על הערעור לפני מועד הבחינה הבא.'
        }
    ];

    window.openFaqModal = function() {
        let modal = document.getElementById('academic-faq-modal');
        if (!modal) {
            createFaqModal();
            modal = document.getElementById('academic-faq-modal');
        }
        modal.style.display = 'flex';
        modal.classList.add('active');
        const input = document.getElementById('faq-search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        renderFaqItems('');
    };

    window.closeFaqModal = function() {
        const modal = document.getElementById('academic-faq-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    function createFaqModal() {
        const div = document.createElement('div');
        div.id = 'academic-faq-modal';
        div.className = 'modal-overlay';
        div.style.display = 'none';
        div.style.zIndex = '100050';
        div.innerHTML = `
            <div class="modal-content faq-modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem; color: #f8fafc; font-weight: 800;">
                        <span>📖</span> <span>מדריך זכויות, נהלים ושאלות נפוצות בטכניון</span>
                    </h2>
                    <button type="button" class="modal-close" onclick="window.closeFaqModal()">&times;</button>
                </div>
                <div class="faq-search-box">
                    <input type="text" id="faq-search-input" placeholder="חפש נושא (מילואים, עתודה, פורמולה, מל״ג, ספורט, אנגלית, מועד ג׳)..." dir="rtl" oninput="renderFaqItems(this.value)">
                </div>
                <div class="faq-category-pills">
                    <button type="button" class="faq-cat-pill active" onclick="setFaqCategoryFilter('all', this)">הכל</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('מילואים', this)">🪖 מילואים</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('עתודאים', this)">🎓 עתודה</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('פורמולה', this)">🏎️ פורמולה</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('מל״ג וספורט', this)">🏛️ מל״ג וספורט</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('אנגלית', this)">🇬🇧 אנגלית</button>
                    <button type="button" class="faq-cat-pill" onclick="setFaqCategoryFilter('פרויקט גמר', this)">🛠️ פרויקט גמר</button>
                </div>
                <div class="modal-body faq-modal-body" id="faq-items-list">
                    <!-- Dynamic FAQ Accordion Cards -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.closeFaqModal()">סגור</button>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target === div) window.closeFaqModal();
        });
        document.body.appendChild(div);
    }

    let activeFaqCategory = 'all';

    window.setFaqCategoryFilter = function(category, btnEl) {
        activeFaqCategory = category;
        document.querySelectorAll('.faq-cat-pill').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        const input = document.getElementById('faq-search-input');
        renderFaqItems(input ? input.value : '');
    };

    window.renderFaqItems = function(query) {
        const container = document.getElementById('faq-items-list');
        if (!container) return;
        const q = (query || '').trim().toLowerCase();

        let filtered = FAQ_ITEMS.filter(item => {
            const matchesCat = (activeFaqCategory === 'all' || item.category === activeFaqCategory);
            const matchesQuery = !q || item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 25px;">לא נמצאו תשובות התואמות לחיפוש שלך</div>`;
            return;
        }

        container.innerHTML = filtered.map((item, idx) => `
            <details class="faq-card" ${idx === 0 ? 'open' : ''}>
                <summary class="faq-summary">
                    <span class="faq-title">
                        <span class="faq-badge">${item.category}</span>
                        <span>${item.title}</span>
                    </span>
                    <span class="faq-chevron">▼</span>
                </summary>
                <div class="faq-content">
                    ${item.content.replace(/\n/g, '<br>')}
                    <div style="margin-top: 8px; text-align: left;">
                        <button type="button" class="btn btn-xs btn-outline" onclick="window.copyToClipboard('${item.title}: ${item.content.replace(/'/g, "\\'")}', 'תשובת המדריך הועתקה ללוח!')">📋 העתק תשובה</button>
                    </div>
                </div>
            </details>
        `).join('');
    };

    // =========================================================================
    // 10. Keyboard Shortcuts Cheat Sheet Modal
    // =========================================================================
    window.openKeyboardShortcutsModal = function() {
        let modal = document.getElementById('keyboard-shortcuts-modal');
        if (!modal) {
            createKeyboardShortcutsModal();
            modal = document.getElementById('keyboard-shortcuts-modal');
        }
        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    window.closeKeyboardShortcutsModal = function() {
        const modal = document.getElementById('keyboard-shortcuts-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    function createKeyboardShortcutsModal() {
        const div = document.createElement('div');
        div.id = 'keyboard-shortcuts-modal';
        div.className = 'modal-overlay';
        div.style.display = 'none';
        div.style.zIndex = '100050';
        div.innerHTML = `
            <div class="modal-content shortcuts-modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 style="display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.25rem; color: #f8fafc; font-weight: 800;">
                        <span>⌨️</span> <span>מקשי קיצור במקלדת (Keyboard Shortcuts)</span>
                    </h2>
                    <button type="button" class="modal-close" onclick="window.closeKeyboardShortcutsModal()">&times;</button>
                </div>
                <div class="modal-body shortcuts-modal-body">
                    <div class="shortcuts-grid">
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
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.closeKeyboardShortcutsModal()" style="background: #059669; border-color: #10b981;">✓ סגור</button>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target === div) window.closeKeyboardShortcutsModal();
        });
        document.body.appendChild(div);
    }

    // =========================================================================
    // 11. UI Text Scale Accessibility Controller (A- / 100% / A+)
    // =========================================================================
    const FONT_SCALES = [0.9, 1.0, 1.1, 1.2];
    let currentFontScaleIndex = 1; // default 1.0

    function initFontScaling() {
        const saved = localStorage.getItem(STORAGE_KEYS.FONT_SCALE);
        if (saved) {
            const idx = FONT_SCALES.indexOf(parseFloat(saved));
            if (idx >= 0) currentFontScaleIndex = idx;
        }
        applyFontScale();
    }

    window.adjustUiTextScale = function(delta) {
        if (delta === 0) {
            currentFontScaleIndex = 1; // reset 100%
        } else {
            currentFontScaleIndex = Math.min(FONT_SCALES.length - 1, Math.max(0, currentFontScaleIndex + delta));
        }
        const scale = FONT_SCALES[currentFontScaleIndex];
        localStorage.setItem(STORAGE_KEYS.FONT_SCALE, String(scale));
        applyFontScale();
        if (typeof window.showHudToast === 'function') {
            window.showHudToast(`גודל טקסט עודכן: ${Math.round(scale * 100)}% 🔤`, 'info');
        }
    };

    function applyFontScale() {
        const scale = FONT_SCALES[currentFontScaleIndex];
        document.documentElement.style.setProperty('--user-text-scale', String(scale));
        document.body.style.zoom = scale === 1.0 ? '' : `${Math.round(scale * 100)}%`;
        const label = document.getElementById('ui-font-scale-label');
        if (label) label.innerText = `${Math.round(scale * 100)}%`;
    }

    // =========================================================================
    // 12. Main Initialization on DOM Ready
    // =========================================================================
    function initAllEnhancements() {
        initBackToTop();
        initKeyboardShortcuts();
        initFontScaling();
        CourseWishlist.renderWishlistPillCount();
        RecentlyViewed.renderRecentChips();

        // Monitor any opening modals to attach reading progress bar if long
        const observer = new MutationObserver(() => {
            const openModals = document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"]');
            openModals.forEach(modal => {
                const body = modal.querySelector('.modal-body');
                let progress = modal.querySelector('.modal-reading-progress-bar');
                if (body && !progress) {
                    progress = document.createElement('div');
                    progress.className = 'modal-reading-progress-bar';
                    modal.querySelector('.modal-content')?.prepend(progress);
                }
                if (body && progress) {
                    attachModalScrollProgress(body, progress);
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllEnhancements);
    } else {
        initAllEnhancements();
    }

})(window, document);
