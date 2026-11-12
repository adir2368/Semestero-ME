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

    function getScopedEnhancementKey(baseKey) {
        if (baseKey === STORAGE_KEYS.FONT_SCALE) return baseKey;
        try {
            if (window.AuthSync && typeof window.AuthSync.isLoggedIn === 'function' && window.AuthSync.isLoggedIn() && typeof window.AuthSync.getActiveUser === 'function') {
                const u = window.AuthSync.getActiveUser();
                if (u && u.id) return `${baseKey}_${u.id}`;
            }
        } catch (e) {}
        return `${baseKey}_guest`;
    }

    function safeGetJson(key, defaultVal) {
        try {
            const scoped = getScopedEnhancementKey(key);
            const data = localStorage.getItem(scoped) || localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function safeSetJson(key, val) {
        try {
            const scoped = getScopedEnhancementKey(key);
            localStorage.setItem(scoped, JSON.stringify(val));
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
    // 3. Floating Back to Top Button (Strict Main Screen Only - Purple Semi-Transparent)
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e9d5ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            `;
            document.body.appendChild(btn);
        }

        // Return strictly the MAIN SCREEN scrollable viewport (NEVER inner semester cards, course lists, or dropdowns)
        function getActiveMainScrollContainer() {
            // 1. Foreground active modal dialogs (FAQ, downloads, settings modals)
            const activeModal = document.querySelector(
                '.modal-overlay.active:not([style*="display: none"]), ' +
                '.modal-backdrop.active:not([style*="display: none"]), ' +
                '.modal.active:not([style*="display: none"]), ' +
                '[id$="-modal"].active:not([style*="display: none"])'
            );
            if (activeModal) {
                const modalBody = activeModal.querySelector('.modal-body');
                return modalBody || activeModal;
            }

            // 2. Identify active tab
            const activeTab = window.currentActiveTab || 
                              (document.body && document.body.getAttribute('data-active-tab')) || 
                              'curriculum';

            // Flowchart DAG has its own interactive zoom/pan controls; never show document back-to-top
            if (activeTab === 'curriculum') {
                return null;
            }

            // 3. Top-level main workspaces ONLY
            if (activeTab === 'settings') {
                const ws = document.getElementById('settings-workspace');
                return (ws && ws.style.display !== 'none') ? ws : null;
            }

            if (activeTab === 'tasks' || activeTab === 'calendar') {
                const ws = document.getElementById('notion-tasks-workspace');
                return (ws && ws.style.display !== 'none') ? ws : null;
            }

            if (activeTab === 'timetable') {
                const ws = document.getElementById('timetable-workspace');
                return (ws && ws.style.display !== 'none') ? ws : null;
            }

            if (activeTab === 'planner') {
                const ws = document.getElementById('planner-workspace');
                if (ws && ws.style.display !== 'none') {
                    // Only check the main planner page viewport (NOT inner semester lists or course drawers)
                    const wrapper = ws.querySelector('.planner-wrapper') || ws;
                    return (wrapper && wrapper.scrollHeight > wrapper.clientHeight) ? wrapper : ws;
                }
                return null;
            }

            return null;
        }

        function updateVisibility() {
            const activeTab = window.currentActiveTab || 
                              (document.body && document.body.getAttribute('data-active-tab')) || 
                              'curriculum';

            const activeModal = document.querySelector(
                '.modal-overlay.active:not([style*="display: none"]), ' +
                '.modal-backdrop.active:not([style*="display: none"]), ' +
                '.modal.active:not([style*="display: none"])'
            );

            // Never show on flowchart unless a modal is open
            if (activeTab === 'curriculum' && !activeModal) {
                btn.classList.remove('visible');
                return;
            }

            const container = getActiveMainScrollContainer();
            let isScrolled = false;

            if (container) {
                // Must be scrolled down at least 220px in the MAIN SCREEN viewport
                const scrollTop = container.scrollTop || 0;
                if (scrollTop > 220) {
                    isScrolled = true;
                }
            }

            // Fallback for document-level window scroll if container is document/window
            if (!isScrolled && activeTab !== 'curriculum') {
                const winScroll = window.scrollY || 
                                  (document.documentElement ? document.documentElement.scrollTop : 0) || 
                                  (document.body ? document.body.scrollTop : 0);
                if (winScroll > 220) {
                    isScrolled = true;
                }
            }

            if (isScrolled) {
                if (!btn.classList.contains('visible')) btn.classList.add('visible');
            } else {
                if (btn.classList.contains('visible')) btn.classList.remove('visible');
            }
        }

        // On click, scroll ONLY the active main viewport to top
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const container = getActiveMainScrollContainer();
            if (container && typeof container.scrollTo === 'function') {
                container.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Universal fallback
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (document.documentElement) document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            if (document.body) document.body.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(updateVisibility, 350);
        });

        // Capture scroll events anywhere in document
        document.addEventListener('scroll', updateVisibility, { capture: true, passive: true });
        window.addEventListener('resize', updateVisibility, { passive: true });

        // Update when user switches tabs or closes/opens modals
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('.nav-tab, .tab-btn, [data-tab], .modal-overlay, .modal-backdrop, [data-action="close"], .btn-close, [id$="-modal"]')) {
                setTimeout(updateVisibility, 50);
                setTimeout(updateVisibility, 250);
            }
        }, { passive: true });

        window.updateBackToTopVisibility = updateVisibility;
        updateVisibility();
    }

    // =========================================================================
    // 4. Modal Reading & Scroll Progress Bar
    // =========================================================================
    function attachModalScrollProgress(modalBodyEl, progressEl) {
        if (!modalBodyEl || !progressEl) return;
        const handler = () => {
            const scrollTop = modalBodyEl.scrollTop || 0;
            const scrollHeight = (modalBodyEl.scrollHeight || 0) - (modalBodyEl.clientHeight || 0);
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            const newWidth = `${Math.min(100, Math.max(0, Math.round(progress)))}%`;
            if (progressEl.style.width !== newWidth) {
                progressEl.style.width = newWidth;
            }
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
            { id: 'act-grade-sheet', title: 'גיליון ציונים אקדמי רשמי (Academic Grade Sheet & What-If)', icon: '🎓', shortcut: 'Ctrl+Shift+G', action: () => window.openGradeSheetModal && window.openGradeSheetModal() },
            { id: 'act-audit', title: 'בדיקת זכאות לתואר ודרישות סיום (Graduation Audit)', icon: '🎓', shortcut: 'Ctrl+G', action: () => window.DegreePlanner && (window.DegreePlanner.openGraduationClearanceModal ? window.DegreePlanner.openGraduationClearanceModal() : window.DegreePlanner.openGraduationAuditModal && window.DegreePlanner.openGraduationAuditModal()) },
            { id: 'act-faq', title: 'מרכז זכויות ושאלות נפוצות (Technion FAQ & Rights)', icon: '📖', shortcut: 'Ctrl+H', action: () => window.openFaqModal() },
            { id: 'act-compare', title: 'השוואת קורסי בחירה צד-מול-צד (Course Comparator)', icon: '⚖️', shortcut: '', action: () => window.openCourseComparisonModal() },
            { id: 'act-downloads', title: 'מרכז הורדה ישירה (Android APK / מחשב)', icon: '⬇️', shortcut: 'Ctrl+D', action: () => window.openDownloadModal() },
            { id: 'act-watch', title: 'שעון חכם - תצוגת Galaxy Watch 8 (Wear OS Companion)', icon: '⌚', shortcut: 'Ctrl+Shift+W', action: () => window.open('watch.html', '_blank', 'width=460,height=460,resizable=no') },
            { id: 'act-sync', title: 'סנכרון מיידי לענן (Supabase Cloud Sync)', icon: '🔄', shortcut: 'Ctrl+S', action: () => window.AuthSync && window.AuthSync.syncToCloud && window.AuthSync.syncToCloud() },
            { id: 'act-shortcuts', title: 'מקשי קיצור במקלדת (Keyboard Shortcuts)', icon: '⌨️', shortcut: '?', action: () => window.openKeyboardShortcutsModal() }
        ];
        if (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive()) {
            actions.push({
                id: 'act-site-analytics',
                title: 'סטטיסטיקת שימוש, משתמשים וכניסות (Audience & Telemetry)',
                icon: '👥',
                shortcut: 'Ctrl+Shift+A',
                type: 'action',
                group: 'ניהול מערכת (מנהל בלבד)',
                action: () => window.SiteAnalytics && window.SiteAnalytics.openModal()
            });
        }
        actions.forEach(a => items.push({ ...a, type: 'action', group: a.group || 'פעולות מערכת' }));

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

            // 2. Global Escape: Close any open modal, context menu, Command Palette, or blur input
            if (e.key === 'Escape' || code === 'Escape') {
                const ctxMenu = document.getElementById('task-context-menu');
                if (ctxMenu && ctxMenu.style.display === 'flex') {
                    e.preventDefault();
                    if (typeof window.hideTaskContextMenu === 'function') window.hideTaskContextMenu();
                    return;
                }
                const moveModal = document.getElementById('task-move-modal');
                if (moveModal && moveModal.style.display !== 'none' && moveModal.classList.contains('active')) {
                    e.preventDefault();
                    if (typeof window.closeTaskMoveModal === 'function') window.closeTaskMoveModal();
                    return;
                }
                if (window.selectedTasksMap && window.selectedTasksMap.size > 0 && !isTyping) {
                    if (typeof window.clearTasksSelection === 'function') {
                        e.preventDefault();
                        window.clearTasksSelection();
                        return;
                    }
                }
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

            // 4. Ctrl+D / Cmd+D: Duplicate selected tasks (if tasks are selected) OR Direct Downloads Modal
            const isKeyD = code === 'KeyD' || keyLower === 'd' || e.key === 'ג';
            if (isCtrlOrMeta && isKeyD && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (window.selectedTasksMap && window.selectedTasksMap.size > 0 && typeof window.duplicateSelectedTasks === 'function') {
                    window.duplicateSelectedTasks();
                    return;
                }
                if (window.openDownloadModal) window.openDownloadModal();
                return;
            }

            // 4b. Ctrl+Shift+P / Cmd+Shift+P: Move selected tasks to course
            const isKeyP = code === 'KeyP' || keyLower === 'p' || e.key === 'פ';
            if (isCtrlOrMeta && e.shiftKey && !e.altKey && isKeyP) {
                if (window.selectedTasksMap && window.selectedTasksMap.size > 0 && typeof window.openMoveTasksModal === 'function') {
                    e.preventDefault();
                    e.stopPropagation();
                    window.openMoveTasksModal();
                    return;
                }
            }

            // 4c. Delete: Delete / Move to Trash selected tasks (when not typing in fields)
            if ((e.key === 'Delete' || code === 'Delete') && !isTyping) {
                if (window.selectedTasksMap && window.selectedTasksMap.size > 0 && typeof window.deleteSelectedTasks === 'function') {
                    e.preventDefault();
                    e.stopPropagation();
                    window.deleteSelectedTasks();
                    return;
                }
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

    function resolveRichCourseData(code) {
        if (!code) return null;
        const normCode = String(code).trim();
        const strippedCode = normCode.replace(/^0+/, '');
        const catalogMap = (window.PLANNER_CATALOG && window.PLANNER_CATALOG.ALL_COURSES_MAP) ? window.PLANNER_CATALOG.ALL_COURSES_MAP : {};
        const catEntry = catalogMap[normCode] || catalogMap[strippedCode] || null;

        let cfEntry = null;
        if (window.CHEESEFORK_DB && Array.isArray(window.CHEESEFORK_DB)) {
            cfEntry = window.CHEESEFORK_DB.find(x => {
                const xCode = String(x.rawNum || x.code6 || x.code || '').trim();
                return xCode === normCode || xCode.replace(/^0+/, '') === strippedCode;
            }) || null;
        }

        if (!catEntry && !cfEntry) return null;
        const merged = Object.assign({}, cfEntry || {}, catEntry || {});
        merged.code = (catEntry && catEntry.code) || (cfEntry && (cfEntry.rawNum || cfEntry.code6 || cfEntry.code)) || normCode;
        merged.name = (catEntry && catEntry.name) || (cfEntry && (cfEntry.name || cfEntry.title)) || `קורס טכניוני (${normCode})`;
        merged.credits = (catEntry && typeof catEntry.credits === 'number') ? catEntry.credits : (parseFloat(cfEntry && cfEntry.credits) || 3.0);
        merged.moedA = (cfEntry && cfEntry.moedA) || (catEntry && catEntry.moedA) || '';
        merged.moedB = (cfEntry && cfEntry.moedB) || (catEntry && catEntry.moedB) || '';
        merged.faculty = (cfEntry && cfEntry.faculty) || (catEntry && catEntry.faculty) || 'הנדסת מכונות';
        merged.syllabus = (cfEntry && cfEntry.syllabus) || (catEntry && (catEntry.note || catEntry.description)) || 'סילבוס מלא זמין בקטלוג הטכניוני';
        return merged;
    }

    function formatCourseCodeList(codes) {
        if (!codes) return 'ללא';
        if (typeof codes === 'string') return codes.trim() || 'ללא';
        if (!Array.isArray(codes) || codes.length === 0) return 'ללא';
        const catalogMap = (window.PLANNER_CATALOG && window.PLANNER_CATALOG.ALL_COURSES_MAP) ? window.PLANNER_CATALOG.ALL_COURSES_MAP : {};
        return codes.map(raw => {
            const c = catalogMap[raw] || catalogMap[String(raw).replace(/^0+/, '')];
            const dispCode = (c && (c.altCode || c.code)) || raw;
            const dispName = c && c.name ? c.name : '';
            return dispName
                ? `<span style="display:inline-block; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3); border-radius:5px; padding:2px 7px; margin:2px; font-size:0.78rem;">${dispName} <small style="opacity:0.75; font-family:monospace;">(${dispCode})</small></span>`
                : `<span style="font-family:monospace;">${raw}</span>`;
        }).join(' ');
    }

    function estimateCourseWorkloadBadge(course) {
        const cr = parseFloat(course && course.credits) || 3.0;
        const type = (course && course.type) || '';
        if (type === 'sports' || type === 'humanities' || cr <= 2.0) {
            return `<span style="color:#34d399; font-weight:700;">🟢 עומס קל (~2-4 שעות/שבוע)</span>`;
        }
        if (cr >= 4.5 || (course.prereqs && course.prereqs.length >= 3)) {
            return `<span style="color:#f87171; font-weight:700;">🔴 עומס גבוה מאוד (~10-13 שעות/שבוע)</span>`;
        }
        if (cr >= 3.5) {
            return `<span style="color:#fbbf24; font-weight:700;">🟡 עומס בינוני-גבוה (~7-9 שעות/שבוע)</span>`;
        }
        return `<span style="color:#38bdf8; font-weight:700;">🔵 עומס מאוזן (~5-6 שעות/שבוע)</span>`;
    }

    function populateCourseCompareOptions() {
        const sel1 = document.getElementById('compare-select-1');
        const sel2 = document.getElementById('compare-select-2');
        if (!sel1 || !sel2) return;

        const courses = [];
        const seenCanon = new Set();

        const addCandidate = (rawCode) => {
            const rich = resolveRichCourseData(rawCode);
            if (!rich || !rich.code) return;
            const canon = String(rich.code).replace(/^0+/, '');
            if (seenCanon.has(canon)) return;
            seenCanon.add(canon);
            courses.push({
                code: rich.code,
                displayCode: rich.altCode || rich.code,
                name: rich.name,
                credits: rich.credits
            });
        };

        if (window.PLANNER_CATALOG && window.PLANNER_CATALOG.ALL_COURSES_MAP) {
            Object.keys(window.PLANNER_CATALOG.ALL_COURSES_MAP).forEach(addCandidate);
        }
        if (window.CHEESEFORK_DB && Array.isArray(window.CHEESEFORK_DB)) {
            window.CHEESEFORK_DB.forEach(c => addCandidate(c.rawNum || c.code6 || c.code));
        }

        courses.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

        const prev1 = sel1.value;
        const prev2 = sel2.value;
        const optionsHtml = courses.map(c => `<option value="${c.code}">${c.displayCode} - ${c.name} (${c.credits} נק״ז)</option>`).join('');
        sel1.innerHTML = optionsHtml;
        sel2.innerHTML = optionsHtml;

        if (prev1 && courses.some(c => c.code === prev1)) {
            sel1.value = prev1;
        } else if (courses.length > 0) {
            const def1 = courses.find(c => c.code === '00340053' || c.displayCode === '034053') || courses[0];
            sel1.value = def1.code;
        }
        if (prev2 && courses.some(c => c.code === prev2)) {
            sel2.value = prev2;
        } else if (courses.length > 1) {
            const def2 = courses.find(c => (c.code === '00340056' || c.displayCode === '034056') && c.code !== sel1.value) || courses[1];
            sel2.value = def2.code;
        }
    }

    window.quickScheduleFromComparator = function(courseCode) {
        const rich = resolveRichCourseData(courseCode);
        if (!rich) return;
        if (window.DegreePlanner && typeof window.DegreePlanner.scheduleCourseFromCatalog === 'function') {
            window.DegreePlanner.scheduleCourseFromCatalog(rich.code);
            window.renderComparisonTable();
        } else if (typeof window.showToastNotification === 'function') {
            window.showToastNotification(`פתח את לשונית "תכנון תואר" כדי לשבץ את ${rich.name}`, 'info');
        }
    };

    window.renderComparisonTable = function() {
        const container = document.getElementById('comparison-table-container');
        const sel1 = document.getElementById('compare-select-1');
        const sel2 = document.getElementById('compare-select-2');
        if (!container || !sel1 || !sel2) return;

        const code1 = sel1.value;
        const code2 = sel2.value;

        const c1 = resolveRichCourseData(code1);
        const c2 = resolveRichCourseData(code2);

        if (!c1 || !c2) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">בחר שני קורסים להשוואה</div>`;
            return;
        }

        const isMoedAConflict = (c1.moedA && c2.moedA && c1.moedA === c2.moedA);
        const isMoedBConflict = (c1.moedB && c2.moedB && c1.moedB === c2.moedB);

        const formatTypeLabel = (c) => {
            if (c.list === 'A') return 'בחירה פקולטית - רשימה א׳';
            if (c.list === 'B') return 'בחירה פקולטית - רשימה ב׳';
            if (c.list === 'ENERGY') return 'אשכול אנרגיה';
            if (c.list === 'MALAG' || c.type === 'humanities') return 'מל״ג / בחירה חופשית';
            if (c.list === 'SPORTS' || c.type === 'sports') return 'חינוך גופני (ספורט)';
            if (c.type === 'mandatory') return 'קורס חובה פקולטי';
            if (c.type === 'science_fund') return 'מדעי יסוד הנדסיים';
            if (c.type === 'final_project') return 'פרויקט גמר הנדסי (שנה ד׳)';
            return c.type || 'קורס בחירה';
        };

        const formatBottleneckCell = (c) => {
            const bInfo = (window.PLANNER_CATALOG && typeof window.PLANNER_CATALOG.getBottleneckInfo === 'function')
                ? window.PLANNER_CATALOG.getBottleneckInfo(c.code)
                : null;
            if (!bInfo || bInfo.transitiveUnlockCount === 0) {
                return `<span style="color:#94a3b8;">קורס קצה (אינו חוסם קורסי המשך)</span>`;
            }
            const badgeColor = bInfo.severity === 'critical' ? '#ef4444' : (bInfo.severity === 'high' ? '#f59e0b' : '#38bdf8');
            const namesPreview = bInfo.directDependents.slice(0, 3).map(d => d.name).join(', ');
            return `
                <div style="font-weight:800; color:${badgeColor};">
                    🔥 פותח ${bInfo.transitiveUnlockCount} קורסי המשך (${bInfo.directUnlockCount} ישירים)
                </div>
                <div style="font-size:0.75rem; color:#cbd5e1; margin-top:2px;">ישירים: ${namesPreview}${bInfo.directDependents.length > 3 ? '...' : ''}</div>
            `;
        };

        const safeName1 = String(c1.name || '').replace(/'/g, "\\'");
        const safeName2 = String(c2.name || '').replace(/'/g, "\\'");

        container.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th style="width: 24%;">מאפיין השוואה</th>
                        <th style="width: 38%; color: #38bdf8;">
                            <div style="font-size: 1.05rem; font-weight: 800;">${c1.name}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8; font-family: monospace;">${c1.altCode || c1.code}</div>
                        </th>
                        <th style="width: 38%; color: #34d399;">
                            <div style="font-size: 1.05rem; font-weight: 800;">${c2.name}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8; font-family: monospace;">${c2.altCode || c2.code}</div>
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
                        <td class="compare-label">סיווג פקולטי</td>
                        <td class="compare-val">${formatTypeLabel(c1)}</td>
                        <td class="compare-val">${formatTypeLabel(c2)}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">אשכול התמחות</td>
                        <td class="compare-val"><span style="background:rgba(168,85,247,0.15); color:#d8b4fe; border:1px solid rgba(168,85,247,0.35); padding:2px 8px; border-radius:999px; font-size:0.78rem; font-weight:700;">${c1.cluster || 'ליבה / כללי'}</span></td>
                        <td class="compare-val"><span style="background:rgba(168,85,247,0.15); color:#d8b4fe; border:1px solid rgba(168,85,247,0.35); padding:2px 8px; border-radius:999px; font-size:0.78rem; font-weight:700;">${c2.cluster || 'ליבה / כללי'}</span></td>
                    </tr>
                    <tr>
                        <td class="compare-label">מדד עומס משוער</td>
                        <td class="compare-val">${estimateCourseWorkloadBadge(c1)}</td>
                        <td class="compare-val">${estimateCourseWorkloadBadge(c2)}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">דרישות קדם (Prereqs)</td>
                        <td class="compare-val">${formatCourseCodeList(c1.prereqs)}</td>
                        <td class="compare-val">${formatCourseCodeList(c2.prereqs)}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">קורסי צמוד (Coreqs)</td>
                        <td class="compare-val">${formatCourseCodeList(c1.coreqs)}</td>
                        <td class="compare-val">${formatCourseCodeList(c2.coreqs)}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">נתיב קריטי (קורסי המשך)</td>
                        <td class="compare-val">${formatBottleneckCell(c1)}</td>
                        <td class="compare-val">${formatBottleneckCell(c2)}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">מועד א׳</td>
                        <td class="compare-val ${isMoedAConflict ? 'conflict-date' : ''}">${c1.moedA || 'לפי לוח בחינות סמסטריאלי'}</td>
                        <td class="compare-val ${isMoedAConflict ? 'conflict-date' : ''}">
                            ${c2.moedA || 'לפי לוח בחינות סמסטריאלי'}
                            ${isMoedAConflict ? '<div class="conflict-pill">⚠️ התנגשות מועד א׳!</div>' : ''}
                        </td>
                    </tr>
                    <tr>
                        <td class="compare-label">מועד ב׳</td>
                        <td class="compare-val ${isMoedBConflict ? 'conflict-date' : ''}">${c1.moedB || 'לפי לוח בחינות סמסטריאלי'}</td>
                        <td class="compare-val ${isMoedBConflict ? 'conflict-date' : ''}">
                            ${c2.moedB || 'לפי לוח בחינות סמסטריאלי'}
                            ${isMoedBConflict ? '<div class="conflict-pill">⚠️ התנגשות מועד ב׳!</div>' : ''}
                        </td>
                    </tr>
                    <tr>
                        <td class="compare-label">תקציר וסילבוס</td>
                        <td class="compare-val syllabus-text">${c1.syllabus}</td>
                        <td class="compare-val syllabus-text">${c2.syllabus}</td>
                    </tr>
                    <tr>
                        <td class="compare-label">פעולות מהירות</td>
                        <td class="compare-val">
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-xs btn-primary" onclick="window.quickScheduleFromComparator('${c1.code}')">➕ שבץ בתכנון תואר</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="CourseWishlist.toggle({code: '${c1.code}', name: '${safeName1}', credits: ${c1.credits}})">⭐ מועדפים</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.copyToClipboard('${c1.altCode || c1.code}', 'קוד קורס ${c1.altCode || c1.code} הועתק!')">📋 העתק קוד</button>
                            </div>
                        </td>
                        <td class="compare-val">
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-xs btn-primary" onclick="window.quickScheduleFromComparator('${c2.code}')">➕ שבץ בתכנון תואר</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="CourseWishlist.toggle({code: '${c2.code}', name: '${safeName2}', credits: ${c2.credits}})">⭐ מועדפים</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.copyToClipboard('${c2.altCode || c2.code}', 'קוד קורס ${c2.altCode || c2.code} הועתק!')">📋 העתק קוד</button>
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
            title: 'תנאי סף לרישום לפרויקט תכן גמר במכונות (00340379 / 00340384)',
            content: 'לרישום לפרויקט גמר הנדסי 1 (00340379) או פרויקט פורמולה SAE 1 (00340384) נדרשת צבירה של לפחות 110.0 נק״ז אקדמיות בטרם סמסטר הפרויקט, וכן השלמת קורסי הקדם: תכן מכונות 1 (00340054) ומעבדה בתכן המוצר (00340371).'
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
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FONT_SCALE);
            if (saved) {
                const idx = FONT_SCALES.indexOf(parseFloat(saved));
                if (idx >= 0) currentFontScaleIndex = idx;
            }
        } catch (e) {}
        applyFontScale();
    }

    window.adjustUiTextScale = function(delta) {
        if (delta === 0) {
            currentFontScaleIndex = 1; // reset 100%
        } else {
            currentFontScaleIndex = Math.min(FONT_SCALES.length - 1, Math.max(0, currentFontScaleIndex + delta));
        }
        const scale = FONT_SCALES[currentFontScaleIndex];
        try {
            localStorage.setItem(STORAGE_KEYS.FONT_SCALE, String(scale));
        } catch (e) {}
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
    
    // =========================================================================
    // 11.5 Mobile Hardware & Gesture Back Button Navigation Shield
    // =========================================================================
    const MobileBackNavigationManager = {
        init: function() {
            // 1. Seed browser history state so back gestures don't abruptly exit
            if (typeof history !== 'undefined' && history.pushState) {
                try {
                    history.replaceState({ semesteroRoot: true, depth: 0 }, '');
                    history.pushState({ semesteroApp: true, depth: 1 }, '');
                } catch (e) {}
            }

            // 2. Intercept browser / swipe-to-back popstate
            window.addEventListener('popstate', (e) => {
                const handled = this.handleBack();
                if (handled) {
                    try {
                        history.pushState({ semesteroApp: true, depth: 1 }, '');
                    } catch (err) {}
                }
            });

            // 3. Intercept Android WebView / Cordova backbutton
            document.addEventListener('backbutton', (e) => {
                const handled = this.handleBack();
                if (handled && e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                }
            }, false);

            // 4. Intercept Capacitor Native App backButton
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                try {
                    window.Capacitor.Plugins.App.addListener('backButton', () => {
                        const handled = this.handleBack();
                        if (!handled && window.Capacitor.Plugins.App.exitApp) {
                            window.Capacitor.Plugins.App.exitApp();
                        }
                    });
                } catch (e) {
                    console.warn('[MobileBack] Capacitor App plugin backButton listener error:', e);
                }
            }

            // Expose globally
            window.handleMobileBackAction = () => this.handleBack();
            window.MobileBackNavigationManager = this;
        },

        isElementVisible: function(el) {
            if (!el || el.hidden) return false;
            if (el.style && el.style.display === 'none') return false;
            if (el.classList && el.classList.contains('active')) return true;
            if (el.style && (el.style.display === 'flex' || el.style.display === 'block' || el.style.display === 'grid')) return true;
            if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                try {
                    const disp = window.getComputedStyle(el).display;
                    return disp !== 'none' && disp !== '';
                } catch (e) {
                    return false;
                }
            }
            return false;
        },

        handleBack: function() {
            // A. Check active onboarding / guided tour
            if (window.InteractiveTour && typeof window.InteractiveTour.isActive === 'function' && window.InteractiveTour.isActive()) {
                window.InteractiveTour.endTour(true);
                return true;
            }

            // B. Check Pangea QuickPeek Reader
            const pangeaReader = document.getElementById('pangea-reader-modal');
            if (pangeaReader && this.isElementVisible(pangeaReader)) {
                if (window.PangeaHub && typeof window.PangeaHub.closeQuickPeek === 'function') {
                    window.PangeaHub.closeQuickPeek();
                } else {
                    pangeaReader.style.display = 'none';
                    pangeaReader.classList.remove('active');
                }
                return true;
            }

            // C. Check Pangea Global Search
            const pangeaSearch = document.getElementById('pangea-search-modal');
            if (pangeaSearch && this.isElementVisible(pangeaSearch)) {
                if (window.PangeaHub && typeof window.PangeaHub.closeGlobalSearch === 'function') {
                    window.PangeaHub.closeGlobalSearch();
                } else {
                    pangeaSearch.style.display = 'none';
                    pangeaSearch.classList.remove('active');
                }
                return true;
            }

            // D. Check Notification Drawer
            const notifDrawer = document.getElementById('notif-drawer-overlay');
            if (notifDrawer && this.isElementVisible(notifDrawer)) {
                const closeBtn = document.getElementById('btn-close-notif-drawer');
                if (closeBtn) closeBtn.click();
                else notifDrawer.style.display = 'none';
                return true;
            }

            // E. Check Omni Command Palette
            const cmdModal = document.getElementById('command-palette-modal') || document.getElementById('omni-command-palette-modal');
            if (cmdModal && this.isElementVisible(cmdModal)) {
                if (typeof window.closeCommandPalette === 'function') window.closeCommandPalette();
                else {
                    cmdModal.classList.remove('active');
                    cmdModal.style.display = 'none';
                }
                return true;
            }

            // F. Check Attendance Hub
            const attendanceModal = document.getElementById('modal-attendance-hub');
            if (attendanceModal && this.isElementVisible(attendanceModal)) {
                if (window.AttendanceHub && typeof window.AttendanceHub.close === 'function') {
                    window.AttendanceHub.close();
                } else {
                    attendanceModal.classList.remove('active');
                    attendanceModal.style.display = 'none';
                }
                return true;
            }

            // G. Check Grade Sheet / What-If Simulator
            const gradeSheetModal = document.getElementById('grade-sheet-modal');
            if (gradeSheetModal && this.isElementVisible(gradeSheetModal)) {
                if (window.GradeSheetModal && typeof window.GradeSheetModal.close === 'function') {
                    window.GradeSheetModal.close();
                } else {
                    gradeSheetModal.classList.remove('active');
                    gradeSheetModal.style.display = 'none';
                }
                return true;
            }

            // H. Check Academic Rights & Miluim Advisor
            const miluimModal = document.getElementById('modal-miluim-rights');
            if (miluimModal && this.isElementVisible(miluimModal)) {
                const bClose = document.getElementById('btn-close-miluim-modal');
                if (bClose) bClose.click();
                else {
                    miluimModal.classList.remove('active');
                    miluimModal.style.display = 'none';
                }
                return true;
            }

            // I. Check Course Details Modal
            const courseModal = document.getElementById('course-modal');
            if (courseModal && this.isElementVisible(courseModal)) {
                const cClose = document.getElementById('course-modal-close');
                if (cClose) cClose.click();
                else {
                    courseModal.classList.remove('active');
                    courseModal.style.display = 'none';
                }
                return true;
            }

            // J. Check All Other Open Modals / Overlays
            const openModals = Array.from(document.querySelectorAll(
                '.modal-overlay.active, .modal.active, ' +
                '.modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"], ' +
                '.planner-export-modal.active, .planner-semesters-mgr-modal-overlay.active, ' +
                '#accessibility-modal.active, #notion-icon-picker-modal[style*="display: flex"], ' +
                '#notion-icon-picker-modal[style*="display: block"]'
            )).filter(m => this.isElementVisible(m));

            if (openModals.length > 0) {
                // Topmost modal (last in DOM or active)
                const topmost = openModals[openModals.length - 1];
                const closeBtn = topmost.querySelector('.modal-close, .export-modal-close, .a11y-close-btn, .btn-close, [data-dismiss="modal"]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    topmost.classList.remove('active');
                    topmost.style.display = 'none';
                }
                return true;
            }

            // K. If No Modal is Open -> Navigate to Previous Tab
            if (window._tabHistoryStack && window._tabHistoryStack.length > 0) {
                const prevTab = window._tabHistoryStack.pop();
                if (prevTab && prevTab !== window.currentActiveTab && typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab(prevTab, true);
                    return true;
                }
            }

            // L. Root state reached (no modal, no tab history)
            return false;
        }
    };

    // 12. Main Initialization on DOM Ready
    // =========================================================================
    function initAllEnhancements() {
        initBackToTop();
        initKeyboardShortcuts();
        initFontScaling();
        MobileBackNavigationManager.init();
        CourseWishlist.renderWishlistPillCount();
        RecentlyViewed.renderRecentChips();

        // Monitor any opening modals to attach reading progress bar if long
        let modalObserverRaf = null;
        const observer = new MutationObserver(() => {
            if (modalObserverRaf) return;
            modalObserverRaf = requestAnimationFrame(() => {
                modalObserverRaf = null;
                const openModals = document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"], [id$="-modal"].active');
                openModals.forEach(modal => {
                    const body = modal.querySelector('.modal-body');
                    let progress = modal.querySelector('.modal-reading-progress-bar');
                    if (body && !progress) {
                        progress = document.createElement('div');
                        progress.className = 'modal-reading-progress-bar';
                        modal.querySelector('.modal-content')?.prepend(progress);
                    }
                    if (body && progress && !body._hasProgressHandler) {
                        body._hasProgressHandler = true;
                        attachModalScrollProgress(body, progress);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllEnhancements);
    } else {
        initAllEnhancements();
    }

})(window, document);
