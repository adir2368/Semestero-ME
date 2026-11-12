// ==============================================================================
// Semestero ME • Galaxy Watch 8 (Wear OS) Companion Controller
// Module: watch_companion.js
// Handles:
// 1. Circular smartwatch rotary bezel & touch swipe navigation
// 2. Real-time class radar & countdown updates with authentic Hebrew day detection
// 3. Moodle urgent tasks with 1-tap haptic checkoff & lock
// 4. Academic stats ring & Dean's honors badge
// 5. Ambient Always-On Display (AOD) power-saving mode
// ==============================================================================

(function(window) {
    'use strict';

    const TOTAL_SCREENS = 4;
    let currentScreen = 0;
    let idleTimer = null;
    let isAmbient = false;

    const screens = [
        document.getElementById('screen-radar'),
        document.getElementById('screen-timeline'),
        document.getElementById('screen-tasks'),
        document.getElementById('screen-stats')
    ];

    const dots = document.querySelectorAll('.watch-dot');
    const bezelGlow = document.getElementById('bezel-glow');
    const clockEl = document.getElementById('watch-clock');
    const container = document.getElementById('watch-container');

    const HEBREW_DAYS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];
    const HEBREW_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

    // Authentic Technion Mechanical Engineering Schedule (Winter Semester 2026/2027 - 1:1 with CHEESEFORK_SEMESTER_SCHEDULE)
    const TECHNION_SCHEDULE = {
        0: [ // יום ראשון
            { title: "משוואות דיפרנציאליות חלקיות מ'", time: "11:30 - 13:30", startMin: 690, endMin: 810, room: "אולמן 506", lecturer: "אמתי אלפרין", type: "תרגול 22" }
        ],
        1: [ // יום שני
            { title: "פיסיקה 2", time: "08:30 - 10:30", startMin: 510, endMin: 630, room: "טאוב - מדמ\"ח 1", lecturer: "ד\"ר גדעון אלון", type: "הרצאה 10" },
            { title: "מכניקת מוצקים 2מ'", time: "10:30 - 14:30", startMin: 630, endMin: 870, room: "דן קאהן - מכונות 6", lecturer: "פרופ' יוסף גבלי", type: "הרצאה 10" }
        ],
        2: [ // יום שלישי
            { title: "תרמודינמיקה 1", time: "08:30 - 10:30", startMin: 510, endMin: 630, room: "הנדסה כימית 1", lecturer: "פרופ' לאוניד טרטקובסקי", type: "הרצאה 10" },
            { title: "תרמודינמיקה 1", time: "12:30 - 14:30", startMin: 750, endMin: 870, room: "אולמן 101", lecturer: "גב' עומר גזית אורלוב", type: "תרגול 11" },
            { title: "מבוא לחישוב מדעי והנדסי", time: "14:30 - 16:30", startMin: 870, endMin: 990, room: "אולמן 501", lecturer: "מר גיא ארבר", type: "תרגול 11" }
        ],
        3: [ // יום רביעי
            { title: "פיסיקה 2", time: "08:30 - 09:30", startMin: 510, endMin: 570, room: "פיזיקה 1", lecturer: "ד\"ר גדעון אלון", type: "הרצאה 10" },
            { title: "פיסיקה 2", time: "09:30 - 10:30", startMin: 570, endMin: 630, room: "שרמן - חינוך למדע וטכנולוגיה 107", lecturer: "גב' נעם הנץ גמליאל", type: "תרגול 13" },
            { title: "מבוא לחישוב מדעי והנדסי", time: "14:30 - 17:30", startMin: 870, endMin: 1050, room: "הנדסה כימית 1", lecturer: "ד\"ר דניאל הקסנר", type: "הרצאה 10" }
        ],
        4: [ // יום חמישי
            { title: "חינוך גופני - אתלטיקה קלה", time: "07:30 - 08:30", startMin: 450, endMin: 510, room: "חינוך גופני - אתלטיקה קלה", lecturer: "שלומית בן-איש", type: "יוגה 24" },
            { title: "משוואות דיפרנציאליות חלקיות מ'", time: "10:30 - 12:30", startMin: 630, endMin: 750, room: "הנדסה כימית 1", lecturer: "ד\"ר רועי בר און", type: "הרצאה 20" },
            { title: "מכניקת מוצקים 2מ'", time: "12:30 - 14:30", startMin: 750, endMin: 870, room: "אולמן 205", lecturer: "מר יובל בר-רצון", type: "תרגול 21" }
        ],
        5: [], // יום שישי (חופשי)
        6: []  // שבת
    };

    // 1. Digital Clock & Live Day Display
    function updateClock() {
        if (!clockEl) return;
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        clockEl.innerText = `${h}:${m}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Rotary Bezel & Navigation
    function goToScreen(index) {
        if (index < 0) index = TOTAL_SCREENS - 1;
        if (index >= TOTAL_SCREENS) index = 0;
        currentScreen = index;

        screens.forEach((s, idx) => {
            if (s) s.classList.toggle('active', idx === currentScreen);
        });

        dots.forEach((d, idx) => {
            if (d) d.classList.toggle('active', idx === currentScreen);
        });

        if (bezelGlow) {
            bezelGlow.style.transform = `rotate(${currentScreen * 90}deg)`;
        }

        if (navigator.vibrate) {
            try { navigator.vibrate(20); } catch(e) {}
        }

        resetIdleTimer();
    }

    function nextScreen() {
        goToScreen(currentScreen + 1);
    }

    function prevScreen() {
        goToScreen(currentScreen - 1);
    }

    // Samsung Galaxy Watch Rotating Bezel Listener
    window.addEventListener('wheel', (e) => {
        wakeFromAmbient();
        if (e.deltaY > 0) nextScreen();
        else if (e.deltaY < 0) prevScreen();
    }, { passive: true });

    // Tizen / One UI Watch rotary detent event
    document.addEventListener('rotarydetent', (e) => {
        wakeFromAmbient();
        if (e.detail && e.detail.direction === 'CW') nextScreen();
        else prevScreen();
    });

    // Touch Swipe Navigation
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
        wakeFromAmbient();
        if (e.touches && e.touches[0]) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        wakeFromAmbient();
        if (e.changedTouches && e.changedTouches[0]) {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
                if (diffX < 0) nextScreen(); // Swipe left -> next
                else prevScreen(); // Swipe right -> prev
            }
        }
    }, { passive: true });

    // Keyboard support for testing (ArrowLeft, ArrowRight)
    window.addEventListener('keydown', (e) => {
        wakeFromAmbient();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nextScreen();
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') prevScreen();
    });

    // 3. Ambient AOD Mode (Power-saving mode)
    function enterAmbient() {
        isAmbient = true;
        if (container) container.classList.add('ambient-mode');
    }

    function wakeFromAmbient() {
        if (isAmbient) {
            isAmbient = false;
            if (container) container.classList.remove('ambient-mode');
        }
        resetIdleTimer();
    }

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(enterAmbient, 20000); // 20s idle -> ambient
    }
    resetIdleTimer();

    // 4. Data Extraction & Real-Time Schedule Resolution
    function loadWatchData() {
        const state = (window.opener && window.opener.gameState) || window.gameState || window.PRELOADED_USER_STATE || {};

        // Day and Date Evaluation
        const now = new Date();
        const dayIdx = now.getDay();
        const curDayName = HEBREW_DAYS[dayIdx] || "יום ראשון";
        const curDateStr = `${now.getDate()} ב${HEBREW_MONTHS[now.getMonth()]}`;
        const dayHeader = `${curDayName} • ${curDateStr}`;

        const dayRadarEl = document.getElementById('w-day-radar');
        if (dayRadarEl) dayRadarEl.innerText = dayHeader;

        const timelineHeaderEl = document.getElementById('w-timeline-header');
        if (timelineHeaderEl) timelineHeaderEl.innerText = `לו״ז ${curDayName} (${curDateStr})`;

        // Current time in minutes
        const curTotalMin = now.getHours() * 60 + now.getMinutes();

        // A. Next Class Radar
        const titleEl = document.getElementById('w-class-title');
        const timeEl = document.getElementById('w-class-time');
        const roomEl = document.getElementById('w-class-room');
        const statusEl = document.getElementById('w-class-status');
        const lecturerEl = document.getElementById('w-class-lecturer');

        let nextClass = null;

        // Read authentic schedule dynamically from live state or localStorage if available
        let activeSchedule = TECHNION_SCHEDULE;
        try {
            let timetableObj = (state && state.timetable && Array.isArray(state.timetable.days)) ? state.timetable : null;
            if (!timetableObj) {
                const storageKey = (typeof window.getStorageKey === 'function') ? window.getStorageKey() : 'academic_skill_tree_save';
                const rawSave = localStorage.getItem(storageKey) || localStorage.getItem('academic_skill_tree_save');
                if (rawSave) {
                    const parsedSave = JSON.parse(rawSave);
                    if (parsedSave && parsedSave.timetable && Array.isArray(parsedSave.timetable.days)) {
                        timetableObj = parsedSave.timetable;
                    }
                }
            }
            if (timetableObj && Array.isArray(timetableObj.days)) {
                if (typeof window.enrichTimetableWithAuthenticRooms === 'function') {
                    window.enrichTimetableWithAuthenticRooms(timetableObj);
                }
                const dynamicSched = {};
                timetableObj.days.forEach(d => {
                    const dIdx = d.dayIndex;
                    dynamicSched[dIdx] = (d.classes || []).map(c => {
                        const [sh, sm] = (c.startTime || '08:30').split(':').map(Number);
                        const [eh, em] = (c.endTime || '10:30').split(':').map(Number);
                        return {
                            title: c.courseName || c.title || c.courseId,
                            time: `${c.startTime} - ${c.endTime}`,
                            startMin: sh * 60 + (sm || 0),
                            endMin: eh * 60 + (em || 0),
                            room: c.room || 'טאוב',
                            lecturer: c.lecturer || 'סמסטרו ME',
                            type: c.type || 'הרצאה'
                        };
                    });
                });
                if (Object.keys(dynamicSched).length > 0) {
                    activeSchedule = dynamicSched;
                }
            }
        } catch(e) {}

        const todaysClasses = activeSchedule[dayIdx] || [];
        if (!nextClass) {
            if (todaysClasses.length === 0) {
                if (dayIdx === 5) {
                    nextClass = {
                        name: "יום שישי - יום חופשי",
                        time: "סופ״ש נעים 🏖️",
                        room: "ללא שיעורים פרונטליים",
                        lecturer: "זמן מעולה לפרויקטים",
                        type: "חופשי",
                        status: "🏖️ יום חופשי"
                    };
                } else {
                    nextClass = {
                        name: "שבת שלום ומנוחה! 🕯️",
                        time: "סופ״ש",
                        room: "מתחילים מחר (יום ראשון) ב-11:30",
                        lecturer: "סמסטרו ME",
                        type: "שבת",
                        status: "🕯️ שבת שלום"
                    };
                }
            } else {
                // User Rule: 15 minutes after start of class, switch to next class!
                // If it is the last class of the day, stay on it until endMin so we never prematurely show tomorrow.
                let activeOrUpcoming = null;
                let isCurrentlyActive = false;
                const lastClass = todaysClasses.length > 0 ? todaysClasses[todaysClasses.length - 1] : null;
                const isAllClassesDone = lastClass ? (curTotalMin >= lastClass.endMin) : (curTotalMin >= 21 * 60);

                if (!isAllClassesDone) {
                    for (let i = 0; i < todaysClasses.length; i++) {
                        const c = todaysClasses[i];
                        const isLast = (i === todaysClasses.length - 1);
                        if (curTotalMin < c.startMin + 15) {
                            activeOrUpcoming = c;
                            isCurrentlyActive = (curTotalMin >= c.startMin);
                            break;
                        } else if (isLast && curTotalMin < c.endMin) {
                            activeOrUpcoming = c;
                            isCurrentlyActive = true;
                            break;
                        }
                    }
                }

                if (activeOrUpcoming) {
                    let statusText;
                    if (isCurrentlyActive) {
                        statusText = "🟢 מתקיים כעת!";
                    } else if (curTotalMin < activeOrUpcoming.startMin) {
                        const diff = activeOrUpcoming.startMin - curTotalMin;
                        statusText = diff <= 60 ? `⏰ מתחיל בעוד ${diff} דקות` : "⏳ השיעור הבא היום";
                    } else {
                        statusText = "⏳ שיעור קרוב";
                    }

                    nextClass = {
                        name: activeOrUpcoming.title,
                        time: activeOrUpcoming.time,
                        room: activeOrUpcoming.room,
                        lecturer: activeOrUpcoming.lecturer,
                        type: activeOrUpcoming.type,
                        status: statusText
                    };
                } else {
                    // Evening or all classes finished: look ahead to tomorrow / next school day
                    const dayHebNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
                    let nextDayClass = null;
                    let nextDayLabel = "";
                    for (let offset = 1; offset <= 6; offset++) {
                        const nextDayIdx = (dayIdx + offset) % 7;
                        const nextDayClasses = activeSchedule[nextDayIdx] || [];
                        if (nextDayClasses.length > 0) {
                            nextDayClass = nextDayClasses[0];
                            nextDayLabel = (offset === 1) ? "מחר (יום " + dayHebNames[nextDayIdx] + ")" : "יום " + dayHebNames[nextDayIdx];
                            break;
                        }
                    }

                    if (nextDayClass) {
                        nextClass = {
                            name: nextDayClass.title,
                            time: nextDayClass.time,
                            room: nextDayClass.room,
                            lecturer: nextDayClass.lecturer,
                            type: nextDayClass.type,
                            status: `מערכת ${nextDayLabel} • שיעור ראשון`
                        };
                    } else {
                        nextClass = {
                            name: "יום חופשי",
                            time: "סופ״ש",
                            room: "ללא שיעורים קרובים",
                            lecturer: "סמסטרו ME",
                            type: "חופשי",
                            status: "🏖️ יום חופשי"
                        };
                    }
                }
            }
        }

        if (titleEl && nextClass) titleEl.innerText = nextClass.name;
        if (timeEl && nextClass) timeEl.innerText = nextClass.time;
        if (roomEl && nextClass) roomEl.innerText = nextClass.room.startsWith("📍") ? nextClass.room : `📍 ${nextClass.room}`;
        if (statusEl && nextClass) statusEl.innerText = nextClass.status;
        if (lecturerEl && nextClass) lecturerEl.innerText = `👨‍🏫 ${nextClass.lecturer} • ${nextClass.type}`;

        // B. Today's Timeline
        const timelineList = document.getElementById('w-timeline-list');
        if (timelineList) {
            let timelineHtml = '';
            if (todaysClasses.length === 0) {
                timelineHtml = `
                    <div class="timeline-item">
                        <div class="timeline-item-title">
                            <div>${dayIdx === 5 ? 'יום שישי - יום חופשי 🏖️' : 'שבת שלום ומנוחה 🕯️'}</div>
                            <div class="timeline-item-room">אין שיעורים מתוזמנים</div>
                        </div>
                        <div class="timeline-item-time">חופשי</div>
                    </div>
                `;
            } else {
                todaysClasses.forEach(c => {
                    const isActive = (curTotalMin >= c.startMin && curTotalMin <= c.endMin);
                    timelineHtml += `
                        <div class="timeline-item ${isActive ? 'active' : ''}">
                            <div class="timeline-item-title">
                                <div>${c.title}</div>
                                <div class="timeline-item-room">📍 ${c.room}</div>
                            </div>
                            <div class="timeline-item-time">${c.time}</div>
                        </div>
                    `;
                });
            }
            timelineList.innerHTML = timelineHtml;
        }

        // C. Tasks & Exams (Dynamic from live state)
        const examTitle = document.getElementById('w-exam-title');
        const examCourse = document.getElementById('w-exam-course');
        let nearestExamInfo = null;
        if (state && state.courses && typeof state.courses === 'object') {
            const nowMs = Date.now();
            Object.values(state.courses).forEach(c => {
                if (!c || !Array.isArray(c.tasks)) return;
                c.tasks.forEach(t => {
                    if (t && t.type === 'exam' && !t.completed && t.dueDate) {
                        const dMs = new Date(t.dueDate).getTime();
                        if (!isNaN(dMs) && dMs >= nowMs) {
                            const daysLeft = Math.max(0, Math.ceil((dMs - nowMs) / (1000 * 60 * 60 * 24)));
                            if (!nearestExamInfo || daysLeft < nearestExamInfo.daysLeft) {
                                nearestExamInfo = {
                                    daysLeft: daysLeft,
                                    title: t.title || 'מבחן סוף',
                                    courseLabel: `${c.code} - ${c.name || ''}`
                                };
                            }
                        }
                    }
                });
            });
        }
        if (examTitle) {
            examTitle.innerText = nearestExamInfo
                ? `📝 ${nearestExamInfo.title} בעוד ${nearestExamInfo.daysLeft} ימים`
                : "📝 מועד א׳ בעוד 14 ימים";
        }
        if (examCourse) {
            examCourse.innerText = nearestExamInfo
                ? nearestExamInfo.courseLabel
                : "104228 - מד״ח מ'";
        }

        const tasksList = document.getElementById('w-tasks-list');
        if (tasksList) {
            let activeTasks = [];
            try {
                const synced = localStorage.getItem('ast_synced_tasks_json');
                if (synced) {
                    const parsed = JSON.parse(synced);
                    if (Array.isArray(parsed) && parsed.length > 0) activeTasks = parsed;
                }
            } catch(e) {}

            if (activeTasks.length === 0 && state && state.courses && typeof state.courses === 'object') {
                Object.values(state.courses).forEach(c => {
                    if (!c || (c.status !== 'active' && c.status !== 'available') || !Array.isArray(c.tasks)) return;
                    c.tasks.forEach(t => {
                        if (t && !t.completed && t.type !== 'exam') {
                            activeTasks.push({
                                id: t.id || `${c.code}_${activeTasks.length}`,
                                courseCode: c.code,
                                title: `[${c.name || c.code}] ${t.title}`,
                                done: Boolean(t.completed)
                            });
                        }
                    });
                });
            }

            if (activeTasks.length === 0) {
                activeTasks = [
                    { id: "104228_h1", title: "[מדח מ׳] תרגיל בית 1: משוואות דיפרנציאליות", done: false },
                    { id: "104228_ww1", title: "[מדח מ׳] WebWork 1: מד״ח מ׳", done: false },
                    { id: "114052_h1", title: "[פיסיקה 2] תרגיל בית 1: אלקטרוסטטיקה וחוק קולון", done: false },
                    { id: "114052_ww1", title: "[פיסיקה 2] WebWork 1: פיסיקה 2", done: false },
                    { id: "034053_h1", title: "[מוצקים 2] תרגיל בית 1: פיתול ומאמצים מורכבים", done: false },
                    { id: "034056_h1", title: "[חישוב הנדסי] תרגיל בית 1: אנליזה נומרית ב-MATLAB", done: false }
                ];
            }

            let tasksHtml = '';
            activeTasks.slice(0, 5).forEach(t => {
                tasksHtml += `
                    <div class="watch-task-item ${t.done ? 'completed' : ''}" id="task-item-${t.id}" onclick="window.toggleWatchTask('${t.id}')">
                        <div class="watch-task-title">${t.title}</div>
                        <div class="watch-task-chk" id="task-chk-${t.id}">${t.done ? '✓' : ''}</div>
                    </div>
                `;
            });
            tasksList.innerHTML = tasksHtml;
        }

        // D. Academic Stats (Dynamic from live state)
        const gpaValEl = document.getElementById('w-gpa-val');
        const creditsEl = document.getElementById('w-credits-text');
        const honorsEl = document.getElementById('w-honors-pill');
        const ringBar = document.getElementById('w-gpa-ring-bar');

        const gpaNumVal = (state && state.gpa !== undefined && Number(state.gpa) > 0) ? Number(state.gpa) : 86.04;
        const gpa = gpaNumVal.toFixed(2);
        const totalCr = (state && state.totalCredits !== undefined) ? Number(state.totalCredits) : 38.5;
        const targetCr = (state && state.userSettings && state.userSettings.isReservist) ? 155.5 : 157.5;
        if (gpaValEl) gpaValEl.innerText = gpa;
        if (creditsEl) creditsEl.innerText = `${totalCr.toFixed(1)} / ${targetCr.toFixed(1)} נק״ז`;
        if (honorsEl) {
            if (gpaNumVal >= 91.0) {
                honorsEl.innerText = "👑 הצטיינות נשיא";
            } else if (gpaNumVal >= 85.0) {
                honorsEl.innerText = "🎖️ הצטיינות דיקן";
            } else if (gpaNumVal >= 65.0) {
                honorsEl.innerText = "✅ מצב אקדמי תקין";
            } else {
                honorsEl.innerText = "⚠️ מעקב אקדמי";
            }
        }

        // SVG Ring calculation (Circumference = 2 * PI * 42 = ~264)
        if (ringBar) {
            const gpaNum = parseFloat(gpa);
            const pct = Math.min(100, Math.max(0, (gpaNum / 100)));
            const offset = 264 - (264 * pct);
            ringBar.style.strokeDashoffset = String(Math.round(offset));
        }
    }

    // 1-Tap Task Complete Handler with Persistent State Sync
    window.toggleWatchTask = function(taskId) {
        const item = document.getElementById(`task-item-${taskId}`);
        const chk = document.getElementById(`task-chk-${taskId}`);
        if (!item || !chk) return;

        const isNowDone = !item.classList.contains('completed');
        item.classList.toggle('completed', isNowDone);
        chk.innerText = isNowDone ? '✓' : '';

        try {
            const syncedRaw = localStorage.getItem('ast_synced_tasks_json');
            if (syncedRaw) {
                const syncedArr = JSON.parse(syncedRaw);
                if (Array.isArray(syncedArr)) {
                    const match = syncedArr.find(t => String(t.id) === String(taskId));
                    if (match) {
                        match.done = isNowDone;
                        localStorage.setItem('ast_synced_tasks_json', JSON.stringify(syncedArr));
                    }
                }
            }
            const stateKey = getStorageKey();
            const rawState = localStorage.getItem(stateKey);
            if (rawState) {
                const parsedState = JSON.parse(rawState);
                if (parsedState && parsedState.courses) {
                    let updated = false;
                    Object.values(parsedState.courses).forEach(c => {
                        if (c && Array.isArray(c.tasks)) {
                            c.tasks.forEach(t => {
                                if (t && String(t.id) === String(taskId)) {
                                    t.completed = isNowDone;
                                    t.status = isNowDone ? 'done' : 'open';
                                    updated = true;
                                }
                            });
                        }
                    });
                    if (updated) {
                        parsedState.lastModified = Date.now();
                        localStorage.setItem(stateKey, JSON.stringify(parsedState));
                    }
                }
            }
            if (window.opener && typeof window.opener.loadState === 'function') {
                window.opener.loadState();
                if (typeof window.opener.renderUI === 'function') window.opener.renderUI();
            }
        } catch (err) {
            console.warn('[WatchCompanion] Failed to persist task toggle:', err);
        }

        if (navigator.vibrate) {
            try { navigator.vibrate([30, 50, 30]); } catch(e) {}
        }
    };

    window.refreshWatchData = function() {
        loadWatchData();
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadWatchData);
    } else {
        loadWatchData();
    }

})(window);
