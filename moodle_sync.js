/**
 * Atlas ME - Moodle Live Calendar & Tasks Dynamic Synchronization Engine
 * Replicates the robust calendar export & parsing mechanism of Technion++
 * 
 * Supports:
 * - Live dynamic Technion Moodle iCal URL feeds (export_execute.php)
 * - Automatic URL Sanitization (strips accidental double-pastes and webcal:// prefixes)
 * - Zero-CORS Native Electron IPC Bridge (direct connection from desktop app)
 * - Transparent browser fallback with 1-click download & instant drop-import
 * - Automatic deadline extension & postponement updates
 * - Task preservation (never un-completes user-finished tasks)
 * - Offline / Manual .ics calendar file drop
 * - Background auto-sync on app boot
 */

(function (global) {
    'use strict';

    const MOODLE_DEV_URL = 'https://moodle26.technion.ac.il/calendar/export_execute.php?userid=39495&authtoken=47ff4e9841a2293be4696691eeeafe5127137f5c&preset_what=all&preset_time=custom';

    const MoodleSync = {
        config: {
            url: '',
            autoSync: true,
            lastSyncTimestamp: null,
            lastSyncCount: 0
        },

        init() {
            this.loadConfig();
            this.bindUI();
            
            // Background auto-sync on app launch if URL is configured and running in native app (Electron or Android phone)
            const isNative = !!(
                (window.electronAPI && window.electronAPI.isElectron) ||
                (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.fetchMoodleIcs === 'function') ||
                (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp)
            );
            if (this.config.url && this.config.autoSync && isNative) {
                setTimeout(() => {
                    console.log('[MoodleSync] Triggering background auto-sync on startup (native mobile/desktop bridge)...');
                    this.sync({ isSilent: true });
                }, 2500);
            }
        },

        getStorageKey() {
            let activeUserId = 'default';
            if (window.AuthSync && typeof window.AuthSync.getActiveUser === 'function') {
                const user = window.AuthSync.getActiveUser();
                if (user && user.id) activeUserId = user.id;
            }
            return `atlas_me_moodle_sync_${activeUserId}`;
        },

        /**
         * Sanitizes Moodle export URLs, handling accidental double-pastes,
         * webcal:// schemes, and trailing parameters.
         */
        sanitizeUrl(url) {
            if (!url || typeof url !== 'string') return '';
            let cleaned = url.trim();
            if (cleaned.startsWith('webcal://')) {
                cleaned = 'https://' + cleaned.substring(9);
            }
            // Cut off accidental double paste (e.g. ...customhttps://moodle25...)
            const secondHttp = cleaned.indexOf('http', 8);
            if (secondHttp !== -1) {
                cleaned = cleaned.substring(0, secondHttp);
            }
            // Extract the first valid URL
            const match = cleaned.match(/https?:\/\/[^\s"'<>]+/i);
            if (match) {
                cleaned = match[0];
            }
            return cleaned.replace(/[&?]+$/, '');
        },

        loadConfig() {
            try {
                const raw = localStorage.getItem(this.getStorageKey());
                if (raw) {
                    const parsed = JSON.parse(raw);
                    this.config = Object.assign(this.config, parsed);
                } else if (window.gameState && window.gameState.moodleCalendarUrl) {
                    this.config.url = window.gameState.moodleCalendarUrl;
                }

                const isAdirMoodle = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
                // Sanitize URL if present, or fallback to authenticated feed ONLY for Adir
                if (this.config.url) {
                    this.config.url = this.sanitizeUrl(this.config.url);
                } else if (isAdirMoodle) {
                    this.config.url = MOODLE_DEV_URL;
                } else {
                    this.config.url = '';
                }
            } catch (e) {
                console.warn('[MoodleSync] Error loading config:', e);
            }
        },

        saveConfig() {
            try {
                localStorage.setItem(this.getStorageKey(), JSON.stringify(this.config));
                if (window.gameState) {
                    window.gameState.moodleCalendarUrl = this.config.url;
                }
            } catch (e) {
                console.warn('[MoodleSync] Error saving config:', e);
            }
        },

        bindUI() {
            const urlInput = document.getElementById('moodle-calendar-url');
            const autoSyncCheck = document.getElementById('moodle-auto-sync-toggle');
            const syncBtn = document.getElementById('btn-moodle-sync');
            const fileInput = document.getElementById('moodle-ics-file-input');
            const guideToggle = document.getElementById('moodle-guide-toggle');
            const guideContainer = document.getElementById('moodle-guide-container');

            // Modal elements
            const modalUrlInput = document.getElementById('modal-moodle-calendar-url');
            const modalAutoSyncCheck = document.getElementById('modal-moodle-auto-sync-toggle');
            const modalSyncBtn = document.getElementById('modal-btn-moodle-sync');
            const modalMockBtn = document.getElementById('modal-btn-moodle-mock');
            const modalFileInput = document.getElementById('modal-moodle-ics-file-input');
            const modalOverlay = document.getElementById('moodle-sync-modal');

            const syncAllInputs = (val) => {
                if (urlInput) urlInput.value = val;
                if (modalUrlInput) modalUrlInput.value = val;
                const settingInput = document.getElementById('setting-moodle-calendar-url');
                if (settingInput) settingInput.value = val;
            };

            const handleUrlInput = (inputEl) => {
                if (!inputEl) return;
                const rawVal = inputEl.value;
                const cleaned = this.sanitizeUrl(rawVal);
                if (cleaned !== rawVal && rawVal.includes('http') && rawVal.length > cleaned.length) {
                    inputEl.value = cleaned;
                }
                this.config.url = cleaned || rawVal.trim();
                syncAllInputs(this.config.url);
                this.saveConfig();
            };

            if (urlInput) {
                urlInput.value = this.config.url || '';
                urlInput.addEventListener('input', () => handleUrlInput(urlInput));
            }

            if (modalUrlInput) {
                modalUrlInput.value = this.config.url || '';
                modalUrlInput.addEventListener('input', () => handleUrlInput(modalUrlInput));
            }

            if (autoSyncCheck) {
                autoSyncCheck.checked = this.config.autoSync !== false;
                autoSyncCheck.addEventListener('change', () => {
                    this.config.autoSync = autoSyncCheck.checked;
                    if (modalAutoSyncCheck) modalAutoSyncCheck.checked = this.config.autoSync;
                    this.saveConfig();
                });
            }

            if (modalAutoSyncCheck) {
                modalAutoSyncCheck.checked = this.config.autoSync !== false;
                modalAutoSyncCheck.addEventListener('change', () => {
                    this.config.autoSync = modalAutoSyncCheck.checked;
                    if (autoSyncCheck) autoSyncCheck.checked = this.config.autoSync;
                    this.saveConfig();
                });
            }

            if (guideToggle && guideContainer) {
                guideToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isHidden = guideContainer.style.display === 'none';
                    guideContainer.style.display = isHidden ? 'block' : 'none';
                    guideToggle.textContent = isHidden ? '▲ הסתר הדרכת חיבור' : '▼ איך להוציא קישור ממודל (3 קליקים)';
                });
            }

            const handleFile = (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    this.importFromFile(file);
                    e.target.value = '';
                }
            };

            if (fileInput) fileInput.addEventListener('change', handleFile);
            if (modalFileInput) modalFileInput.addEventListener('change', handleFile);

            const triggerSyncAction = () => {
                const inputVal = (modalUrlInput && modalUrlInput.value.trim()) || (urlInput && urlInput.value.trim()) || this.config.url;
                const cleaned = this.sanitizeUrl(inputVal);
                if (cleaned) {
                    this.config.url = cleaned;
                    syncAllInputs(cleaned);
                    this.saveConfig();
                    this.sync({ isSilent: false });
                } else {
                    this.runMockSync();
                }
            };

            if (syncBtn) syncBtn.addEventListener('click', triggerSyncAction);
            if (modalSyncBtn) modalSyncBtn.addEventListener('click', triggerSyncAction);
            if (modalMockBtn) modalMockBtn.addEventListener('click', () => this.runMockSync());

            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) this.closeModal();
                });
            }

            // Global Drag & Drop for .ics calendar files onto modal or window
            window.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            window.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.name.toLowerCase().endsWith('.ics') || (file.type && file.type.includes('calendar'))) {
                        console.log('[MoodleSync] .ics file dropped:', file.name);
                        this.importFromFile(file);
                    }
                }
            });
        },

        openModal() {
            const modal = document.getElementById('moodle-sync-modal');
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
                const modalUrlInput = document.getElementById('modal-moodle-calendar-url');
                if (modalUrlInput) {
                    modalUrlInput.value = this.config.url || '';
                    setTimeout(() => modalUrlInput.focus(), 150);
                }
            }
        },

        closeModal() {
            const modal = document.getElementById('moodle-sync-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        },

        setStatus(message, type = 'info') {
            const statusDiv = document.getElementById('moodle-sync-status');
            const modalStatusDiv = document.getElementById('modal-moodle-sync-status');

            let color = 'var(--text-muted)';
            if (type === 'success') color = 'var(--color-mastered, #10b981)';
            if (type === 'error') color = '#ef4444';
            if (type === 'working') color = 'var(--accent-blue, #38bdf8)';

            if (statusDiv) {
                statusDiv.style.color = color;
                statusDiv.innerHTML = message;
            }
            if (modalStatusDiv) {
                modalStatusDiv.style.color = color;
                modalStatusDiv.innerHTML = message;
            }
        },

        /**
         * Fetches iCal feed:
         * 1. Native Electron IPC bridge (zero CORS restrictions, direct HTTPS to Technion)
         * 2. Direct web fetch
         * 3. Handles browser CORS restriction with informative guidance
         */
        async fetchIcsFeed(targetUrl) {
            const cleanUrl = this.sanitizeUrl(targetUrl);
            if (!cleanUrl) {
                throw new Error('כתובת ה-URL של המודל אינה תקינה.');
            }

            // Method 1: Native Electron Bridge (100% reliable on Desktop, zero CORS restrictions)
            if (window.electronAPI && typeof window.electronAPI.fetchMoodleFeed === 'function') {
                console.log('[MoodleSync] Fetching via Electron native IPC bridge:', cleanUrl);
                const res = await window.electronAPI.fetchMoodleFeed(cleanUrl);
                if (res && res.success && res.data && res.data.includes('BEGIN:VCALENDAR')) {
                    return res.data;
                }
                if (res && !res.success) {
                    console.warn('[MoodleSync] Electron native fetch error:', res.error);
                    throw new Error(res.error || 'שגיאת התחברות ב-Electron');
                }
            }

            // Method 1b: Android Native Phone App Bridge (100% reliable on Phone, zero CORS restrictions)
            if (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.fetchMoodleIcs === 'function') {
                console.log('[MoodleSync] Fetching via Android native SemesteroWidgetBridge on phone:', cleanUrl);
                try {
                    const icsData = window.SemesteroWidgetBridge.fetchMoodleIcs(cleanUrl);
                    if (icsData && icsData.includes('BEGIN:VCALENDAR')) {
                        console.log('[MoodleSync] Android native bridge fetch succeeded! Length:', icsData.length);
                        return icsData;
                    }
                    if (icsData && icsData.startsWith('ERROR:')) {
                        console.warn('[MoodleSync] Android bridge returned error:', icsData);
                        if (icsData.includes('401') || icsData.includes('403') || icsData.includes('Invalid authentication')) {
                            throw new Error('אימות שגוי מול מודל (טוקן פג תוקף). הפק קישור חדש במודל.');
                        }
                        throw new Error(icsData);
                    }
                } catch (bridgeErr) {
                    console.warn('[MoodleSync] SemesteroWidgetBridge error, trying CapacitorHttp fallback:', bridgeErr);
                }
            }

            // Method 1c: Capacitor Native HTTP Plugin (zero CORS on Android/iOS)
            const cap = window.Capacitor;
            if (cap && (
                (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) ||
                (cap.Plugins && cap.Plugins.CapacitorHttp) ||
                (cap.CapacitorHttp) ||
                (typeof cap.getPlatform === 'function' && (cap.getPlatform() === 'android' || cap.getPlatform() === 'ios'))
            )) {
                const httpPlugin = (cap.Plugins && cap.Plugins.CapacitorHttp) || cap.CapacitorHttp;
                if (httpPlugin && typeof httpPlugin.get === 'function') {
                    try {
                        console.log('[MoodleSync] Fetching via Capacitor native HTTP plugin (zero CORS)...');
                        const response = await httpPlugin.get({
                            url: cleanUrl,
                            headers: {
                                'Accept': 'text/calendar, text/plain, */*'
                            },
                            connectTimeout: 15000,
                            readTimeout: 20000
                        });
                        const data = response && response.data;
                        if (typeof data === 'string' && data.includes('BEGIN:VCALENDAR')) {
                            console.log('[MoodleSync] CapacitorHttp fetch succeeded! Length:', data.length);
                            return data;
                        }
                        if (typeof data === 'string' && data.includes('Invalid authentication')) {
                            throw new Error('אימות שגוי מול מודל (טוקן פג תוקף). הפק קישור חדש במודל.');
                        }
                    } catch (capErr) {
                        console.warn('[MoodleSync] CapacitorHttp.get failed, trying direct fetch:', capErr);
                    }
                }
            }

            // Method 2: Direct Fetch (works in Electron without bridge if webSecurity is false, or in browser if allowed)
            try {
                console.log('[MoodleSync] Attempting direct fetch:', cleanUrl);
                const resp = await fetch(cleanUrl, {
                    headers: { 'Accept': 'text/calendar, text/plain, */*' }
                });
                if (resp.ok) {
                    const text = await resp.text();
                    if (text && text.includes('BEGIN:VCALENDAR')) {
                        return text;
                    }
                    if (text && text.includes('Invalid authentication')) {
                        throw new Error('אימות שגוי מול מודל (טוקן פג תוקף). הפק קישור חדש במודל.');
                    }
                }
            } catch (err) {
                console.warn('[MoodleSync] Direct fetch failed (likely browser CORS):', err);
            }

            // If we reached here, browser CORS blocked direct access
            const corsError = new Error('CORS_RESTRICTION');
            corsError.cleanUrl = cleanUrl;
            throw corsError;
        },

        /**
         * Cleans Moodle assignment summary text
         * e.g. "יש להגיש את 'ערעורים - מועד ב''" -> "ערעורים - מועד ב'"
         */
        cleanTaskSummary(rawSummary) {
            let clean = (rawSummary || '').trim();
            const prefixMatch = clean.match(/^יש להגיש את\s+['"״](.+?)['"״]$/);
            if (prefixMatch) {
                return prefixMatch[1].trim();
            }
            return clean.replace(/^יש להגיש את\s+/i, '').trim();
        },

        /**
         * Normalizes task title for robust duplicate detection and matching across edits.
         * Preserves explicit user clones "(העתק)".
         */
        normalizeTaskTitle(title, courseName) {
            if (!title) return '';
            let t = String(title).trim().toLowerCase();
            if (courseName) {
                const cClean = String(courseName).trim().toLowerCase().replace(/[\s\-_:.,()״'"׳]+/g, ' ');
                t = t.replace(cClean, ' ');
            }
            // Remove Moodle boilerplate
            t = t.replace(/^יש להגיש את\s*['"״׳]?/i, '');
            t = t.replace(/['"״׳]$/, '');
            // Remove generic prefixes
            t = t.replace(/^(מטלת בית|תרגיל בית|תרגיל|מטלה|שיעורי בית|hw|assignment|task|דו"ח|דוח מעבדה|דוח|מבחן|בחינה)\s*[:#-]?\s*/i, '');
            // Remove update/extension notes that professors append
            t = t.replace(/\(בונוס.*?\)/g, '');
            t = t.replace(/\(הארכה.*?\)/g, '');
            t = t.replace(/\(מתוקן.*?\)/g, '');
            t = t.replace(/\(הגשה.*?\)/g, '');
            // Strip punctuation and extra spaces
            t = t.replace(/[\s\-_:.,()״'"׳]+/g, ' ').trim();
            return t;
        },

        extractMoodleId(task) {
            if (!task) return null;
            if (task.moodleEventId && /^\d+$/.test(String(task.moodleEventId).trim())) {
                return String(task.moodleEventId).trim();
            }
            if (task.moodleUid) {
                const m = String(task.moodleUid).match(/^(\d+)/);
                if (m) return m[1];
            }
            if (task.moodleUrl) {
                const m = String(task.moodleUrl).match(/[?&]id=(\d+)/);
                if (m) return m[1];
            }
            return null;
        },

        detectTaskType(title) {
            const t = (title || '').toLowerCase();
            if (/מועד\s*[אב]|מבחן|בחינה|exam|midterm/i.test(t)) return 'exam';
            if (/פרויקט|דוח מעבדה|מעבדה|lab|project/i.test(t)) return 'project';
            if (/בוחן|quiz/i.test(t)) return 'quiz';
            return 'hw';
        },

        areTasksDuplicates(t1, t2, courseName) {
            if (!t1 || !t2) return false;
            if (t1.id && t2.id && t1.id === t2.id) return true;

            // Never deduplicate explicit user copies
            const title1 = t1.title || '';
            const title2 = t2.title || '';
            if (title1.includes('(העתק)') || title2.includes('(העתק)')) {
                return title1 === title2 && t1.id === t2.id;
            }

            // Check Moodle IDs (numeric event ID or assignment ID)
            const mId1 = this.extractMoodleId(t1);
            const mId2 = this.extractMoodleId(t2);
            if (mId1 && mId2 && mId1 === mId2) return true;

            // Check exact Moodle URLs
            if (t1.moodleUrl && t2.moodleUrl && t1.moodleUrl.trim().toLowerCase() === t2.moodleUrl.trim().toLowerCase()) {
                return true;
            }

            // Check Exam Moed match within same course
            const isExam1 = t1.type === 'exam' || /מועד\s*[אב]/i.test(title1);
            const isExam2 = t2.type === 'exam' || /מועד\s*[אב]/i.test(title2);
            if (isExam1 && isExam2) {
                const isMoedA1 = /מועד\s*א/i.test(title1) || (t1.id && t1.id.endsWith('_ex'));
                const isMoedA2 = /מועד\s*א/i.test(title2) || (t2.id && t2.id.endsWith('_ex'));
                if (isMoedA1 && isMoedA2) return true;

                const isMoedB1 = /מועד\s*ב/i.test(title1) || (t1.id && t1.id.endsWith('_ex_b'));
                const isMoedB2 = /מועד\s*ב/i.test(title2) || (t2.id && t2.id.endsWith('_ex_b'));
                if (isMoedB1 && isMoedB2) return true;
            }

            // Check Normalized Titles
            const norm1 = this.normalizeTaskTitle(title1, courseName);
            const norm2 = this.normalizeTaskTitle(title2, courseName);
            if (norm1 && norm2 && norm1 === norm2) {
                return true;
            }

            return false;
        },

        mergeTaskPair(primary, secondary) {
            // Keep most detailed/up-to-date title
            const t1 = primary.title || '';
            const t2 = secondary.title || '';
            let chosenTitle = t1;
            if (t2.length > t1.length && !t1.includes('בונוס') && !t1.includes('(העתק)')) {
                chosenTitle = t2;
            } else if (t2.includes('בונוס') && !t1.includes('בונוס')) {
                chosenTitle = t2;
            }

            // Date resolution: prefer non-empty date, or later date if both exist (extension/postponement)
            let chosenDate = primary.dueDate || secondary.dueDate || '';
            let chosenTimestamp = primary.dueTimestamp || secondary.dueTimestamp || 0;
            if (primary.dueDate && secondary.dueDate && primary.dueDate !== secondary.dueDate) {
                const d1 = Date.parse(primary.dueDate) || 0;
                const d2 = Date.parse(secondary.dueDate) || 0;
                if (d2 > d1) {
                    chosenDate = secondary.dueDate;
                    chosenTimestamp = secondary.dueTimestamp || d2;
                } else {
                    chosenDate = primary.dueDate;
                    chosenTimestamp = primary.dueTimestamp || d1;
                }
            }

            // Completed status: completed progress is strictly preserved
            const isDone = primary.completed === true || primary.status === 'done' || 
                           secondary.completed === true || secondary.status === 'done';

            return {
                id: primary.id || secondary.id,
                title: chosenTitle,
                type: primary.type || secondary.type || 'hw',
                dueDate: chosenDate,
                dueTimestamp: chosenTimestamp,
                xp: Math.max(primary.xp || 50, secondary.xp || 50),
                completed: isDone,
                status: isDone ? 'done' : (primary.status !== 'not_started' ? primary.status : secondary.status),
                grade: (primary.grade !== undefined && primary.grade !== null) ? primary.grade : secondary.grade,
                moodleEventId: primary.moodleEventId || secondary.moodleEventId || this.extractMoodleId(secondary) || this.extractMoodleId(primary),
                moodleUid: primary.moodleUid || secondary.moodleUid,
                moodleUrl: primary.moodleUrl || secondary.moodleUrl,
                source: primary.source || secondary.source || (this.extractMoodleId(primary) ? 'moodle' : undefined),
                pinned: !!(primary.pinned || secondary.pinned),
                notes: primary.notes || secondary.notes || undefined,
                comments: (Array.isArray(primary.comments) || Array.isArray(secondary.comments))
                    ? Array.from(new Set([...(primary.comments || []), ...(secondary.comments || [])]))
                    : undefined
            };
        },

        deduplicateCourseTasks(course) {
            if (!course || !Array.isArray(course.tasks) || course.tasks.length <= 1) {
                return { tasks: course ? (course.tasks || []) : [], removedCount: 0 };
            }

            const deduped = [];
            let removedCount = 0;

            for (let i = 0; i < course.tasks.length; i++) {
                const candidate = course.tasks[i];
                let mergedIndex = -1;

                for (let j = 0; j < deduped.length; j++) {
                    if (this.areTasksDuplicates(deduped[j], candidate, course.name)) {
                        mergedIndex = j;
                        break;
                    }
                }

                if (mergedIndex >= 0) {
                    deduped[mergedIndex] = this.mergeTaskPair(deduped[mergedIndex], candidate);
                    removedCount++;
                } else {
                    deduped.push(candidate);
                }
            }

            course.tasks = deduped;
            return { tasks: deduped, removedCount };
        },

        deduplicateAllTasks() {
            if (!window.gameState || !window.gameState.courses) {
                return { totalCourses: 0, removedCount: 0 };
            }

            let totalRemoved = 0;
            let affectedCourses = 0;

            Object.values(window.gameState.courses).forEach(course => {
                if (course && Array.isArray(course.tasks) && course.tasks.length > 1) {
                    const res = this.deduplicateCourseTasks(course);
                    if (res.removedCount > 0) {
                        totalRemoved += res.removedCount;
                        affectedCourses++;
                    }
                }
            });

            if (totalRemoved > 0) {
                console.log(`[MoodleSync] Deduplicated ${totalRemoved} tasks across ${affectedCourses} courses.`);
            }

            return { totalCourses: affectedCourses, removedCount: totalRemoved };
        },

        /**
         * Main Sync execution
         */
        async sync(options = {}) {
            const isSilent = options.isSilent === true;
            const url = this.sanitizeUrl(this.config.url);

            if (!url) {
                if (!isSilent) {
                    this.setStatus('נא להזין קישור יומן ממודל או להעלות קובץ ICS', 'error');
                }
                return;
            }

            const syncBtn = document.getElementById('btn-moodle-sync');
            const modalSyncBtn = document.getElementById('modal-btn-moodle-sync');
            if (syncBtn) {
                syncBtn.disabled = true;
                syncBtn.innerText = '🔄 מסנכרן ממודל...';
            }
            if (modalSyncBtn) {
                modalSyncBtn.disabled = true;
                modalSyncBtn.innerText = '🔄 מסנכרן...';
            }
            this.setStatus('מתחבר ליומן המודל של הטכניון...', 'working');

            try {
                const icsContent = await this.fetchIcsFeed(url);
                const result = this.parseAndApplyIcs(icsContent);

                this.config.lastSyncTimestamp = Date.now();
                this.config.lastSyncCount = result.syncedTotal;
                this.saveConfig();

                const successMsg = result.removedDuplicatesCount > 0
                    ? `⚡ סונכרן בהצלחה! ${result.newCount} חדשות, ${result.updatedCount} עודכנו, ${result.removedDuplicatesCount} כפילויות נוקו (${result.syncedTotal} סה״כ ביומן).`
                    : `⚡ סונכרן בהצלחה! ${result.newCount} חדשות, ${result.updatedCount} עודכנו (${result.syncedTotal} סה״כ ביומן).`;
                this.setStatus(successMsg, 'success');

                if (!isSilent && typeof showHudToast === 'function') {
                    const toastMsg = result.removedDuplicatesCount > 0
                        ? `מודל סונכרן: ${result.newCount} חדשות, ${result.updatedCount} עודכנו, ${result.removedDuplicatesCount} כפילויות נוקו 🎓`
                        : `מודל סונכרן: ${result.newCount} חדשות, ${result.updatedCount} עודכנו 🎓`;
                    showHudToast(toastMsg, 'success');
                }

                // If new tasks were found, trigger an NTFY notification
                if (result.newCount > 0 && typeof sendNotification === 'function') {
                    sendNotification(`Semestero ME: נוספו ${result.newCount} מטלות חדשות מהמודל!`, {
                        tag: 'moodle-sync',
                        body: `המטלות עודכנו בעץ הקורסים ומוכנות לביצוע.`
                    });
                }
            } catch (err) {
                if (isSilent) {
                    console.info('[MoodleSync] Background sync skipped:', err && err.message);
                } else {
                    console.error('[MoodleSync] Sync error:', err);
                }
                const cleanUrl = this.sanitizeUrl(this.config.url);

                if (err.message === 'CORS_RESTRICTION' || (err.name === 'TypeError' && err.message.includes('fetch'))) {
                    const downloadHtml = `
                        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;margin-top:8px;font-size:0.85rem;line-height:1.5;text-align:right;">
                            <div style="font-weight:700;color:#f87171;margin-bottom:6px;">⚠️ מגבלת דפדפן (CORS) לשליפה ישירה</div>
                            <div>דפדפן רגיל חוסם שליפה ישירה משרתי הטכניון (באפליקציית ה-Desktop באלקטרון זה פועל ישירות לחלוטין).</div>
                            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                                <a href="${cleanUrl}" target="_blank" download="icalexport.ics" style="background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(37,99,235,0.4);">
                                    📥 1. לחץ להורדת קובץ היומן מהמודל
                                </a>
                                <label style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(16,185,129,0.4);">
                                    📂 2. גרור או בחר את הקובץ לכאן
                                    <input type="file" accept=".ics,text/calendar" style="display:none;" onchange="window.MoodleSync && window.MoodleSync.importFromFile(this.files[0])">
                                </label>
                            </div>
                        </div>
                    `;
                    this.setStatus(downloadHtml, 'error');
                } else {
                    const errMsg = err.message || 'שגיאת התחברות';
                    this.setStatus(`שגיאה בסנכרון: ${errMsg}. <span style="cursor:pointer;text-decoration:underline;" id="btn-moodle-retry-mock">לחץ להדמיה (Mock)</span>`, 'error');
                    
                    setTimeout(() => {
                        const mockBtn = document.getElementById('btn-moodle-retry-mock');
                        if (mockBtn) {
                            mockBtn.onclick = () => this.runMockSync();
                        }
                    }, 100);
                }
            } finally {
                if (syncBtn) {
                    syncBtn.disabled = false;
                    syncBtn.innerText = '🔄 סנכרן מטלות ממודל עכשיו';
                }
                if (modalSyncBtn) {
                    modalSyncBtn.disabled = false;
                    modalSyncBtn.innerText = '🔄 סנכרן מטלות ממודל עכשיו';
                }
            }
        },

        /**
         * Imports from a local .ics file
         */
        importFromFile(file) {
            if (!file) return;
            this.setStatus(`טוען קובץ ${file.name}...`, 'working');
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const result = this.parseAndApplyIcs(content);
                    const fileStatus = result.removedDuplicatesCount > 0
                        ? `⚡ נטען מקובץ! ${result.newCount} חדשות, ${result.updatedCount} עודכנו, ${result.removedDuplicatesCount} כפילויות נוקו (${result.syncedTotal} סה״כ).`
                        : `⚡ נטען מקובץ! ${result.newCount} חדשות, ${result.updatedCount} עודכנו (${result.syncedTotal} סה״כ).`;
                    this.setStatus(fileStatus, 'success');
                    if (typeof showHudToast === 'function') {
                        showHudToast(`יומן מודל יובא מקובץ בהצלחה (${result.syncedTotal} אירועים) 🎓`, 'success');
                    }
                } catch (err) {
                    console.error('[MoodleSync] File parse error:', err);
                    this.setStatus('שגיאה בפענוח קובץ ה-ICS: ' + err.message, 'error');
                }
            };
            reader.onerror = () => {
                this.setStatus('שגיאה בקריאת הקובץ', 'error');
            };
            reader.readAsText(file);
        },

        /**
         * Core iCalendar VEVENT parser & task distributor
         */
        parseAndApplyIcs(icsText) {
            if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
                throw new Error('תוכן היומן אינו בפורמט iCalendar תקין.');
            }

            // Unfold lines that were split across multiple lines with leading whitespace
            const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
            const rawEvents = unfolded.split('BEGIN:VEVENT');

            if (rawEvents.length <= 1) {
                return { newCount: 0, updatedCount: 0, syncedTotal: 0 };
            }

            const now = Date.now();
            // Allow events up to 180 days in the past (previous semester) and unlimited future across the whole year
            const PAST_LOOKBACK_MS = 180 * 24 * 60 * 60 * 1000;
            let newCount = 0;
            let updatedCount = 0;
            let removedDuplicatesCount = 0;
            let syncedTotal = 0;

            if (!window.gameState || !window.gameState.courses) {
                throw new Error('נתוני הקורסים של האפליקציה טרם נטענו.');
            }

            for (let i = 1; i < rawEvents.length; i++) {
                const block = rawEvents[i];

                // Extract UID
                const uidMatch = block.match(/UID:([^\r\n]+)/);
                const uid = uidMatch ? uidMatch[1].trim() : `moodle_evt_${i}`;
                const eventIdMatch = uid.match(/^(\d+)/);
                const eventId = eventIdMatch ? eventIdMatch[1] : uid;

                // Extract Summary
                const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
                let summary = summaryMatch ? summaryMatch[1].trim() : '';

                // Filtering non-actionable events (skip opening notices and zoom sessions)
                if (!summary) continue;
                if (summary.endsWith('opens') || summary.endsWith('opens)')) continue;
                if (/(הרצאת זום|נוכחות בזום|נוכחות|attendance)/i.test(summary)) {
                    continue;
                }

                // Extract Categories / Course Code
                const catMatch = block.match(/CATEGORIES:([^\r\n]+)/);
                const categoryStr = catMatch ? catMatch[1].trim() : '';
                
                // Match course number: Technion uses 6 or 8 digits (e.g. 034061, 00340061, 01040043)
                let courseCode = '';
                const codeMatch = categoryStr.match(/\b\d{6,8}\b/) || summary.match(/\b\d{6,8}\b/);
                if (codeMatch) {
                    const rawCode = codeMatch[0];
                    courseCode = (rawCode.length === 8) ? (rawCode.substring(1, 4) + rawCode.substring(5, 8)) : rawCode;
                }

                // Extract Dates
                const dtEndMatch = block.match(/DTEND(?:;VALUE=DATE)?:([^\r\n]+)/) || block.match(/DTSTART(?:;VALUE=DATE)?:([^\r\n]+)/);
                if (!dtEndMatch) continue;

                const rawDate = dtEndMatch[1].trim();
                const dueDateObj = this.parseIcsDate(rawDate);
                if (!dueDateObj || isNaN(dueDateObj.getTime())) continue;

                // Keep all upcoming events across the year, plus recent past events within 180 days
                if (dueDateObj.getTime() < now - PAST_LOOKBACK_MS) {
                    continue;
                }

                syncedTotal++;

                // Format display date
                const formattedDate = dueDateObj.toISOString().slice(0, 16).replace('T', ' ');
                const cleanTitle = this.cleanTaskSummary(summary);

                // Target course resolution
                let targetCourse = window.gameState.courses[courseCode];
                
                // If course not found directly, check by loose matching or fallback to active courses
                if (!targetCourse && courseCode) {
                    const foundKey = Object.keys(window.gameState.courses).find(k => k.includes(courseCode) || courseCode.includes(k));
                    if (foundKey) {
                        targetCourse = window.gameState.courses[foundKey];
                        courseCode = foundKey;
                    }
                }

                // If still not found, try to locate active course by title in summary
                if (!targetCourse) {
                    const activeCourses = Object.values(window.gameState.courses).filter(c => c.status === 'active');
                    targetCourse = activeCourses.find(c => summary.includes(c.name) || (c.code && summary.includes(c.code)));
                }

                // Fallback: if course is not active yet, or if it belongs to curriculum, activate or match
                if (!targetCourse) {
                    continue;
                }

                if (!Array.isArray(targetCourse.tasks)) {
                    targetCourse.tasks = [];
                }

                // Extract URL if available
                let moodleUrl = '';
                const urlMatch = block.match(/URL(?:;[^:]+)?:([^\r\n]+)/i);
                if (urlMatch && urlMatch[1].trim().startsWith('http')) {
                    moodleUrl = urlMatch[1].trim();
                } else {
                    const descMatch = block.match(/DESCRIPTION:([^\r\n]+)/i);
                    const descUrlMatch = (descMatch ? descMatch[1] : block).match(/https?:\/\/[^\s"<>]+/i);
                    if (descUrlMatch) {
                        moodleUrl = descUrlMatch[0];
                    } else if (eventId && /^\d+$/.test(eventId)) {
                        const host = (this.config.url && this.config.url.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
                        moodleUrl = `${host}/calendar/view.php?view=event&id=${eventId}`;
                    }
                }

                const incomingMock = {
                    title: cleanTitle,
                    moodleUid: uid,
                    moodleEventId: eventId,
                    moodleUrl: moodleUrl,
                    dueDate: formattedDate,
                    dueTimestamp: dueDateObj.getTime()
                };

                // Find ALL existing tasks matching this incoming Moodle event (handling duplicates & title edits)
                const matchingIndices = [];
                for (let j = 0; j < targetCourse.tasks.length; j++) {
                    if (this.areTasksDuplicates(targetCourse.tasks[j], incomingMock, targetCourse.name)) {
                        matchingIndices.push(j);
                    }
                }

                if (matchingIndices.length > 0) {
                    const primary = targetCourse.tasks[matchingIndices[0]];
                    let modified = false;

                    // Update due date if changed or postponed by lecturer
                    if (primary.dueDate !== formattedDate || primary.dueTimestamp !== dueDateObj.getTime()) {
                        primary.dueDate = formattedDate;
                        primary.dueTimestamp = dueDateObj.getTime();
                        modified = true;
                    }

                    // Update title if changed or clarified by lecturer
                    if (primary.title !== cleanTitle && cleanTitle) {
                        primary.title = cleanTitle;
                        modified = true;
                    }

                    if (moodleUrl && primary.moodleUrl !== moodleUrl) {
                        primary.moodleUrl = moodleUrl;
                        modified = true;
                    }

                    primary.moodleUid = uid;
                    primary.moodleEventId = eventId;
                    primary.source = 'moodle';

                    if (modified) {
                        updatedCount++;
                    }

                    // If multiple duplicate tasks matched this event, merge & purge redundant copies!
                    if (matchingIndices.length > 1) {
                        for (let k = 1; k < matchingIndices.length; k++) {
                            const duplicate = targetCourse.tasks[matchingIndices[k]];
                            if (duplicate.completed || duplicate.status === 'done') {
                                primary.completed = true;
                                primary.status = 'done';
                            }
                            if (duplicate.pinned) primary.pinned = true;
                            if (duplicate.notes && !primary.notes) primary.notes = duplicate.notes;
                            removedDuplicatesCount++;
                        }
                        const removeSet = new Set(matchingIndices.slice(1));
                        targetCourse.tasks = targetCourse.tasks.filter((_, idx) => !removeSet.has(idx));
                    }
                } else {
                    // Create new task with properly detected type
                    const newTask = {
                        id: `task_moodle_${eventId}_${Date.now()}`,
                        title: cleanTitle,
                        type: this.detectTaskType(cleanTitle),
                        dueDate: formattedDate,
                        dueTimestamp: dueDateObj.getTime(),
                        xp: 50,
                        completed: false,
                        status: 'not_started',
                        moodleUid: uid,
                        moodleEventId: eventId,
                        moodleUrl: moodleUrl,
                        source: 'moodle'
                    };
                    targetCourse.tasks.push(newTask);
                    newCount++;
                }
            }

            // Global course-wide deduplication pass across all courses in gameState
            const dedupReport = this.deduplicateAllTasks();
            removedDuplicatesCount += dedupReport.removedCount;

            // If changes were made, re-evaluate app state and render UI
            if (newCount > 0 || updatedCount > 0 || removedDuplicatesCount > 0) {
                if (typeof window.recalculateCourseStates === 'function') {
                    window.recalculateCourseStates();
                }
                if (typeof window.saveState === 'function') {
                    window.saveState();
                }
                if (typeof window.renderUI === 'function') {
                    window.renderUI();
                }
            }

            return { newCount, updatedCount, removedDuplicatesCount, syncedTotal };
        },

        /**
         * Helper: Parse ICS date format e.g. 20261105T215500Z or 20261105
         */
        parseIcsDate(dateStr) {
            const cleaned = dateStr.replace(/[^0-9TZ]/g, '');
            if (cleaned.length === 8) {
                // YYYYMMDD
                const y = parseInt(cleaned.substring(0, 4), 10);
                const m = parseInt(cleaned.substring(4, 6), 10) - 1;
                const d = parseInt(cleaned.substring(6, 8), 10);
                return new Date(y, m, d, 23, 59, 0);
            }
            if (cleaned.includes('T')) {
                const parts = cleaned.split('T');
                const dPart = parts[0];
                const tPart = parts[1];
                const y = parseInt(dPart.substring(0, 4), 10);
                const m = parseInt(dPart.substring(4, 6), 10) - 1;
                const d = parseInt(dPart.substring(6, 8), 10);

                const hh = parseInt(tPart.substring(0, 2), 10) || 0;
                const mm = parseInt(tPart.substring(2, 4), 10) || 0;
                const ss = parseInt(tPart.substring(4, 6), 10) || 0;

                if (cleaned.endsWith('Z')) {
                    return new Date(Date.UTC(y, m, d, hh, mm, ss));
                }
                return new Date(y, m, d, hh, mm, ss);
            }
            return new Date(dateStr);
        },

        /**
         * Realistic Mock Simulation for demonstration
         */
        runMockSync() {
            this.setStatus('מריץ סימולציית סנכרון ממודל הטכניון...', 'working');
            
            setTimeout(() => {
                const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle Technion//NONSGML//HE
BEGIN:VEVENT
UID:987101@moodle25.technion.ac.il
SUMMARY:תרגיל בית 3 - מאמצים ראשיים ועיגול מור
CATEGORIES:00340028.201
DTSTART:20261112T215900Z
DTEND:20261112T215900Z
DESCRIPTION:הגשה במודל עד שעה 23:59
END:VEVENT
BEGIN:VEVENT
UID:987102@moodle25.technion.ac.il
SUMMARY:מטלה 4 - אינטגרלים כפולים ומשוואות דיפרנציאליות
CATEGORIES:01040043.201
DTSTART:20261118T215900Z
DTEND:20261118T215900Z
DESCRIPTION:תרגיל שבועי בחדו"א 2מ
END:VEVENT
BEGIN:VEVENT
UID:987103@moodle25.technion.ac.il
SUMMARY:דוח מעבדה 1 - חוק אוהם וגלוונומטר
CATEGORIES:01140054.201
DTSTART:20261125T215900Z
DTEND:20261125T215900Z
DESCRIPTION:הגשת דוח מסכם במעבדת פיזיקה
END:VEVENT
END:VCALENDAR`;

                const result = this.parseAndApplyIcs(sampleIcs);
                this.setStatus(`⚡ סימולציה הושלמה! נוצרו ${result.newCount} מטלות מודל אותנטיות.`, 'success');
                if (typeof showHudToast === 'function') {
                    showHudToast(`סימולציית מודל: נוספו ${result.newCount} מטלות בעץ הקורסים 🎯`, 'success');
                }
            }, 800);
        }
    };

    global.MoodleSync = MoodleSync;

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MoodleSync.init());
    } else {
        MoodleSync.init();
    }

})(typeof window !== 'undefined' ? window : this);
