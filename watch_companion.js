// ==============================================================================
// Semestero ME • Galaxy Watch 8 (Wear OS) Companion Controller
// Module: watch_companion.js
// Handles:
// 1. Circular smartwatch rotary bezel & touch swipe navigation
// 2. Real-time class radar & countdown updates
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

    // 1. Digital Clock
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

    // 4. Data Extraction & Rendering
    function loadWatchData() {
        const state = (window.opener && window.opener.gameState) || window.gameState || window.PRELOADED_USER_STATE || {};

        // A. Next Class Radar
        const titleEl = document.getElementById('w-class-title');
        const timeEl = document.getElementById('w-class-time');
        const roomEl = document.getElementById('w-class-room');
        const statusEl = document.getElementById('w-class-status');
        const lecturerEl = document.getElementById('w-class-lecturer');

        // Check if there are cached widget classes
        let nextClass = {
            name: "חדו״א 2מ׳",
            time: "10:30 - 12:30",
            room: "דנציגר 101",
            lecturer: "פרופ' כהן",
            type: "הרצאה",
            status: "🟢 מתקיים כעת!"
        };

        try {
            const rawNext = localStorage.getItem('ast_next_class_cache');
            if (rawNext) {
                const parsed = JSON.parse(rawNext);
                if (parsed && parsed.name) nextClass = parsed;
            }
        } catch(e) {}

        if (titleEl) titleEl.innerText = nextClass.name;
        if (timeEl) timeEl.innerText = nextClass.time;
        if (roomEl) roomEl.innerText = `📍 ${nextClass.room}`;
        if (statusEl) statusEl.innerText = nextClass.status;
        if (lecturerEl) lecturerEl.innerText = `👨‍🏫 ${nextClass.lecturer} • ${nextClass.type}`;

        // B. Today's Timeline
        const timelineList = document.getElementById('w-timeline-list');
        if (timelineList) {
            const sampleTimeline = [
                { title: "חדו״א 2מ׳", time: "10:30 - 12:30", room: "דנציגר 101", active: true },
                { title: "מכניקת מוצקים 1", time: "12:30 - 14:30", room: "ליידי דייוויס 240", active: false },
                { title: "פיסיקה 1", time: "15:30 - 17:30", room: "פיסיקה 100", active: false }
            ];

            let timelineHtml = '';
            sampleTimeline.forEach(c => {
                timelineHtml += `
                    <div class="timeline-item ${c.active ? 'active' : ''}">
                        <div class="timeline-item-title">
                            <div>${c.title}</div>
                            <div class="timeline-item-room">📍 ${c.room}</div>
                        </div>
                        <div class="timeline-item-time">${c.time}</div>
                    </div>
                `;
            });
            timelineList.innerHTML = timelineHtml;
        }

        // C. Tasks & Exams
        const examTitle = document.getElementById('w-exam-title');
        const examCourse = document.getElementById('w-exam-course');
        if (examTitle) examTitle.innerText = "📝 מועד א׳ בעוד 14 ימים";
        if (examCourse) examCourse.innerText = "034028 - מכניקת מוצקים 1";

        const tasksList = document.getElementById('w-tasks-list');
        if (tasksList) {
            const sampleTasks = [
                { id: "t1", title: "תרגיל 3: פיתול ומאמצים", done: false },
                { id: "t2", title: "מעבדה 2: דוח מכין", done: false }
            ];

            let tasksHtml = '';
            sampleTasks.forEach(t => {
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
