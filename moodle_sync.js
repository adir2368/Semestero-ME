/**
 * Atlas ME - Moodle Live Calendar & Tasks Dynamic Synchronization Engine
 * Replicates the robust calendar export & parsing mechanism of Technion++
 * 
 * Supports:
 * - Live dynamic Technion Moodle iCal URL feeds (export_execute.php)
 * - Transparent CORS proxy fallback chain (direct -> allorigins -> corsproxy)
 * - Automatic deadline extension & postponement updates
 * - Task preservation (never un-completes user-finished tasks)
 * - Offline / Manual .ics calendar file drop
 * - Background auto-sync on app boot
 */

(function (global) {
    'use strict';

    const MOODLE_DEFAULT_URL = 'https://moodle25.technion.ac.il';
    const CORS_PROXIES = [
        url => url, // Direct fetch (works in Electron, local, or if extension/CORS allows)
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    ];

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
            
            // Background auto-sync on app launch if URL is configured
            if (this.config.url && this.config.autoSync) {
                setTimeout(() => {
                    console.log('[MoodleSync] Triggering background auto-sync on startup...');
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

        loadConfig() {
            try {
                const raw = localStorage.getItem(this.getStorageKey());
                if (raw) {
                    const parsed = JSON.parse(raw);
                    this.config = Object.assign(this.config, parsed);
                } else if (window.gameState && window.gameState.moodleCalendarUrl) {
                    this.config.url = window.gameState.moodleCalendarUrl;
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

            if (urlInput) {
                urlInput.value = this.config.url || '';
                urlInput.addEventListener('change', () => {
                    this.config.url = urlInput.value.trim();
                    this.saveConfig();
                });
            }

            if (autoSyncCheck) {
                autoSyncCheck.checked = this.config.autoSync !== false;
                autoSyncCheck.addEventListener('change', () => {
                    this.config.autoSync = autoSyncCheck.checked;
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

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                        this.importFromFile(file);
                        fileInput.value = '';
                    }
                });
            }

            if (syncBtn) {
                syncBtn.addEventListener('click', () => {
                    const inputVal = urlInput ? urlInput.value.trim() : this.config.url;
                    if (inputVal) {
                        this.config.url = inputVal;
                        this.saveConfig();
                        this.sync({ isSilent: false });
                    } else {
                        // Prompt or run Mock simulation
                        this.runMockSync();
                    }
                });
            }
        },

        setStatus(message, type = 'info') {
            const statusDiv = document.getElementById('moodle-sync-status');
            if (!statusDiv) return;

            let color = 'var(--text-muted)';
            if (type === 'success') color = 'var(--color-mastered, #10b981)';
            if (type === 'error') color = '#ef4444';
            if (type === 'working') color = 'var(--accent-blue, #38bdf8)';

            statusDiv.style.color = color;
            statusDiv.innerHTML = message;
        },

        /**
         * Fetches iCal data with automatic CORS fallback
         */
        async fetchIcsFeed(targetUrl) {
            let cleanUrl = targetUrl.trim();
            if (cleanUrl.startsWith('webcal://')) {
                cleanUrl = 'https://' + cleanUrl.substring(9);
            }

            let lastError = null;
            for (let i = 0; i < CORS_PROXIES.length; i++) {
                const proxyFn = CORS_PROXIES[i];
                const proxyUrl = proxyFn(cleanUrl);
                try {
                    console.log(`[MoodleSync] Fetching feed (attempt ${i + 1}/${CORS_PROXIES.length}):`, proxyUrl);
                    const resp = await fetch(proxyUrl, {
                        headers: { 'Accept': 'text/calendar, text/plain, */*' }
                    });
                    if (!resp.ok) {
                        throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
                    }
                    const text = await resp.text();
                    if (text && text.includes('BEGIN:VCALENDAR')) {
                        return text;
                    }
                    if (text && text.includes('Invalid authentication')) {
                        throw new Error('אימות שגוי מול מודל (Invalid authentication). הטוקן בקישור פג תוקף.');
                    }
                } catch (err) {
                    console.warn(`[MoodleSync] Proxy attempt ${i + 1} failed:`, err);
                    lastError = err;
                }
            }
            throw lastError || new Error('לא ניתן היה לגשת ליומן המודל. בדוק את חיבור הרשת.');
        },

        /**
         * Main Sync execution
         */
        async sync(options = {}) {
            const isSilent = options.isSilent === true;
            const url = this.config.url;

            if (!url) {
                if (!isSilent) {
                    this.setStatus('נא להזין קישור יומן ממודל או להעלות קובץ ICS', 'error');
                }
                return;
            }

            const syncBtn = document.getElementById('btn-moodle-sync');
            if (syncBtn) {
                syncBtn.disabled = true;
                syncBtn.innerText = '🔄 מסנכרן ממודל...';
            }
            this.setStatus('מתחבר ליומן המודל של הטכניון...', 'working');

            try {
                const icsContent = await this.fetchIcsFeed(url);
                const result = this.parseAndApplyIcs(icsContent);

                this.config.lastSyncTimestamp = Date.now();
                this.config.lastSyncCount = result.syncedTotal;
                this.saveConfig();

                const successMsg = `סונכרן בהצלחה! ${result.newCount} מטלות חדשות, ${result.updatedCount} תאריכים עודכנו (${result.syncedTotal} סה״כ ביומן).`;
                this.setStatus(successMsg, 'success');

                if (!isSilent && typeof showHudToast === 'function') {
                    showHudToast(`מודל סונכרן: ${result.newCount} מטלות חדשות נוספו 🎓`, 'success');
                }

                // If new tasks were found, trigger an NTFY notification
                if (result.newCount > 0 && typeof sendNotification === 'function') {
                    sendNotification(`Atlas ME: נוספו ${result.newCount} מטלות חדשות מהמודל!`, {
                        tag: 'moodle-sync',
                        body: `המטלות עודכנו בעץ הקורסים ומוכנות לביצוע.`
                    });
                }
            } catch (err) {
                console.error('[MoodleSync] Sync error:', err);
                const errMsg = err.message || 'שגיאת התחברות';
                this.setStatus(`שגיאה בסנכרון: ${errMsg}. <span style="cursor:pointer;text-decoration:underline;" id="btn-moodle-retry-mock">לחץ להדמיה (Mock)</span>`, 'error');
                
                setTimeout(() => {
                    const mockBtn = document.getElementById('btn-moodle-retry-mock');
                    if (mockBtn) {
                        mockBtn.onclick = () => this.runMockSync();
                    }
                }, 100);
            } finally {
                if (syncBtn) {
                    syncBtn.disabled = false;
                    syncBtn.innerText = '🔄 סנכרן מטלות ממודל עכשיו';
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
                    this.setStatus(`נטען בהצלחה מקובץ! ${result.newCount} חדשות, ${result.updatedCount} עודכנו.`, 'success');
                    if (typeof showHudToast === 'function') {
                        showHudToast(`יומן מודל יובא מקובץ בהצלחה (${result.syncedTotal} אירועים)`, 'success');
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
            const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
            let newCount = 0;
            let updatedCount = 0;
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

                // Filtering non-actionable events (following Technion++ filters)
                if (!summary) continue;
                if (summary.endsWith('opens') || summary.endsWith('opens)')) continue; // Skip opening announcements
                if (/(ערעור|זום|Zoom|zoom|הרצא|תרגול|נוכחות|attendance|מילואים)/i.test(summary)) {
                    continue; // Skip zooms, attendance, reserve duty
                }

                // Extract Categories / Course Code
                const catMatch = block.match(/CATEGORIES:([^\r\n]+)/);
                const categoryStr = catMatch ? catMatch[1].trim() : '';
                
                // Match course number: Technion uses 6 or 8 digits, e.g. 034028 or 00340028 or 034028.202401
                let courseCode = '';
                const codeMatch = categoryStr.match(/\b\d{6,8}\b/) || summary.match(/\b\d{6,8}\b/);
                if (codeMatch) {
                    const rawCode = codeMatch[0];
                    courseCode = (rawCode.length === 8) ? (rawCode.substring(1, 4) + rawCode.substring(5)) : rawCode;
                }

                // Extract Dates
                const dtEndMatch = block.match(/DTEND(?:;VALUE=DATE)?:([^\r\n]+)/) || block.match(/DTSTART(?:;VALUE=DATE)?:([^\r\n]+)/);
                if (!dtEndMatch) continue;

                const rawDate = dtEndMatch[1].trim();
                const dueDateObj = this.parseIcsDate(rawDate);
                if (!dueDateObj || isNaN(dueDateObj.getTime())) continue;

                // Ignore deadlines that passed more than 2 days ago
                if (dueDateObj.getTime() < now - TWO_DAYS_MS) {
                    continue;
                }

                syncedTotal++;

                // Format display date
                const formattedDate = dueDateObj.toISOString().slice(0, 16).replace('T', ' ');

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

                // If still no matching course, we can either skip or attach to general active semester
                if (!targetCourse) {
                    continue;
                }

                if (!Array.isArray(targetCourse.tasks)) {
                    targetCourse.tasks = [];
                }

                // Check if task already exists
                const existingTask = targetCourse.tasks.find(t => 
                    t.moodleUid === uid || 
                    t.moodleEventId === eventId || 
                    (t.title && t.title.trim().toLowerCase() === summary.trim().toLowerCase())
                );

                if (existingTask) {
                    // Update due date if changed by lecturer
                    if (existingTask.dueDate !== formattedDate || existingTask.dueTimestamp !== dueDateObj.getTime()) {
                        existingTask.dueDate = formattedDate;
                        existingTask.dueTimestamp = dueDateObj.getTime();
                        updatedCount++;
                    }
                    existingTask.moodleUid = uid;
                    existingTask.moodleEventId = eventId;
                } else {
                    // Create new task
                    const newTask = {
                        id: `task_moodle_${eventId}_${Date.now()}`,
                        title: summary,
                        type: 'assignment',
                        dueDate: formattedDate,
                        dueTimestamp: dueDateObj.getTime(),
                        xp: 50,
                        completed: false,
                        moodleUid: uid,
                        moodleEventId: eventId,
                        source: 'moodle'
                    };
                    targetCourse.tasks.push(newTask);
                    newCount++;
                }
            }

            // If changes were made, re-evaluate app state and render UI
            if (newCount > 0 || updatedCount > 0) {
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

            return { newCount, updatedCount, syncedTotal };
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
CATEGORIES:034028.202501
DTSTART:20261112T215900Z
DTEND:20261112T215900Z
DESCRIPTION:הגשה במודל עד שעה 23:59
END:VEVENT
BEGIN:VEVENT
UID:987102@moodle25.technion.ac.il
SUMMARY:מטלה 4 - אינטגרלים כפולים ומשוואות דיפרנציאליות
CATEGORIES:104043.202501
DTSTART:20261118T215900Z
DTEND:20261118T215900Z
DESCRIPTION:תרגיל שבועי בחדו"א 2מ
END:VEVENT
BEGIN:VEVENT
UID:987103@moodle25.technion.ac.il
SUMMARY:דוח מעבדה 1 - חוק אוהם וגלוונומטר
CATEGORIES:114054.202501
DTSTART:20261125T215900Z
DTEND:20261125T215900Z
DESCRIPTION:הגשת דוח מסכם במעבדת פיזיקה
END:VEVENT
END:VCALENDAR`;

                const result = this.parseAndApplyIcs(sampleIcs);
                this.setStatus(`סימולציה הושלמה! נוצרו ${result.newCount} מטלות מודל אותנטיות.`, 'success');
                if (typeof showHudToast === 'function') {
                    showHudToast(`סימולציית מודל: נוספו ${result.newCount} מטלות בעץ הקורסים 🎯`, 'success');
                }
            }, 1000);
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
