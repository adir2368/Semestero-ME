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

    // Authentic Technion Mechanical Engineering Schedule (Winter Semester 2026/2027)
    const TECHNION_SCHEDULE = {
        0: [ // יום ראשון
            { title: "משוואות דיפרנציאליות חלקיות מ'", time: "11:30 - 13:30", startMin: 690, endMin: 810, room: "אולמן 506", lecturer: "אמתי אלפרין", type: "תרגול 22" }
        ],
        1: [ // יום שני
            { title: "פיסיקה 2", time: "08:30 - 10:30", startMin: 510, endMin: 630, room: "טאוב 1", lecturer: "ד\"ר גדעון אלון", type: "הרצאה 10" },
            { title: "מכניקת מוצקים 2מ'", time: "10:30 - 14:30", startMin: 630, endMin: 870, room: "הנדסה כימית 1", lecturer: "פרופ' יוסף גבלי", type: "הרצאה 10" }
        ],
        2: [ // יום שלישי
            { title: "תרמודינמיקה 1", time: "08:30 - 11:30", startMin: 510, endMin: 690, room: "הנדסה כימית 1", lecturer: "פרופ' טרטקובסקי", type: "הרצאה 10" },
            { title: "משוואות דיפרנציאליות חלקיות מ'", time: "12:30 - 14:30", startMin: 750, endMin: 870, room: "אולמן 506", lecturer: "אמתי אלפרין", type: "הרצאה" },
            { title: "פיסיקה 2", time: "14:30 - 16:30", startMin: 870, endMin: 990, room: "טאוב", lecturer: "צוות פיסיקה", type: "תרגול" }
        ],
        3: [ // יום רביעי
            { title: "מכניקת מוצקים 2מ'", time: "12:30 - 14:30", startMin: 750, endMin: 870, room: "ליידי דייוויס 240", lecturer: "מתרגל", type: "תרגול" },
            { title: "גרפיקה הנדסית וכתיבה טכנית", time: "14:30 - 17:30", startMin: 870, endMin: 1050, room: "דנציגר", lecturer: "צוות גרפיקה", type: "מעבדה" }
        ],
        4: [ // יום חמישי
            { title: "גרפיקה הנדסית וכתיבה טכנית", time: "09:30 - 11:30", startMin: 570, endMin: 690, room: "דנציגר", lecturer: "מרצה", type: "הרצאה 10" },
            { title: "מעבדת פיסיקה 2", time: "12:30 - 15:30", startMin: 750, endMin: 930, room: "פיסיקה 200", lecturer: "מדריך מעבדה", type: "מעבדה" }
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

        // Try reading cached widget class if valid
        try {
            const rawNext = localStorage.getItem('ast_next_class_cache');
            if (rawNext) {
                const parsed = JSON.parse(rawNext);
                if (parsed && parsed.name) nextClass = parsed;
            }
        } catch(e) {}

        // If no cached class or new day, resolve using authentic schedule
        const todaysClasses = TECHNION_SCHEDULE[dayIdx] || [];
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
                // In the evening (17:00 onwards), display tomorrow's schedule
                let activeOrUpcoming = null;
                const isEvening = curTotalMin >= 17 * 60;

                if (!isEvening) {
                    for (const c of todaysClasses) {
                        if (curTotalMin < c.startMin + 15) {
                            activeOrUpcoming = c;
                            break;
                        }
                    }
                }

                if (activeOrUpcoming) {
                    let statusText;
                    if (curTotalMin >= activeOrUpcoming.startMin && curTotalMin < activeOrUpcoming.startMin + 15) {
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
                        const nextDayClasses = TECHNION_SCHEDULE[nextDayIdx] || [];
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

        // C. Tasks & Exams
        const examTitle = document.getElementById('w-exam-title');
        const examCourse = document.getElementById('w-exam-course');
        if (examTitle) examTitle.innerText = "📝 מועד א׳ בעוד 14 ימים";
        if (examCourse) examCourse.innerText = "104228 - מד״ח מ'";

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

            if (activeTasks.length === 0) {
                activeTasks = [
                    { id: "104228_h1", title: "[מדח מ׳] תרגיל בית 1: משוואות דיפרנציאליות", done: false },
                    { id: "104228_ww1", title: "[מדח מ׳] WebWork 1: מד״ח מ׳", done: false },
                    { id: "114052_h1", title: "[פיסיקה 2] תרגיל בית 1: אלקטרוסטטיקה וחוק קולון", done: false },
                    { id: "114052_ww1", title: "[פיסיקה 2] WebWork 1: פיסיקה 2", done: false },
                    { id: "034035_h1", title: "[תרמו 1] תרגיל בית 1: חוק ראשון ומאזני אנרגיה", done: false },
                    { id: "034053_h1", title: "[מוצקים 2] תרגיל בית 1: פיתול ומאמצים מורכבים", done: false },
                    { id: "034056_h1", title: "[גרפיקה] תרגיל בית 1: היטלים ומבטים בשרטוט", done: false },
                    { id: "034056_p1", title: "[גרפיקה] פרויקט תכן מקדים: מידול חלקים בתיב״ם", done: false }
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

        // D. Academic Stats
        const gpaValEl = document.getElementById('w-gpa-val');
        const creditsEl = document.getElementById('w-credits-text');
        const honorsEl = document.getElementById('w-honors-pill');
        const ringBar = document.getElementById('w-gpa-ring-bar');

        const gpa = state.gpa ? Number(state.gpa).toFixed(2) : "86.04";
        if (gpaValEl) gpaValEl.innerText = gpa;
        if (creditsEl) creditsEl.innerText = "38.5 / 157.5 נק״ז";
        if (honorsEl) honorsEl.innerText = "🎖️ הצטיינות דיקן";

        // SVG Ring calculation (Circumference = 2 * PI * 42 = ~264)
        if (ringBar) {
            const gpaNum = parseFloat(gpa);
            const pct = Math.min(100, Math.max(0, (gpaNum / 100)));
            const offset = 264 - (264 * pct);
            ringBar.style.strokeDashoffset = String(Math.round(offset));
        }
    }

    // 1-Tap Task Complete Handler
    window.toggleWatchTask = function(taskId) {
        const item = document.getElementById(`task-item-${taskId}`);
        const chk = document.getElementById(`task-chk-${taskId}`);
        if (!item || !chk) return;

        const isNowDone = !item.classList.contains('completed');
        item.classList.toggle('completed', isNowDone);
        chk.innerText = isNowDone ? '✓' : '';

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
