import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Code to append to app.js
hw_code = """

/* ==========================================================================
   Homework Progress & "Best N of M" Policy Tracker Engine (Macro & Micro Views)
   ========================================================================== */

const COURSE_HOMEWORK_POLICIES = {
    // 034053 - Solid Mechanics 2 (מוצקים 2)
    '034053': {
        code: '034053',
        name: 'מוצקים 2',
        totalSheets: 12,
        bestN: 10,
        isDualComponent: true,
        policyLabel: 'הטובים מ-12: 10',
        weightLabel: '10% מגן / חובה',
        sheetNames: {
            1: 'מאמצים ושיווי משקל (Stress Tensor)',
            2: 'מאמצים ראשיים ומוהר (Principal Stresses)',
            3: 'מעוותים ותאימות (Strain Tensor)',
            4: 'חוק הוק המוכלל (Generalized Hooke)',
            5: 'מאמץ ועיבור מישוריים (Plane Stress/Strain)',
            6: 'קריטריוני כשל (Failure Criteria)',
            7: 'פיתול חתכים לא עגולים (Non-Circular Torsion)',
            8: 'קורות דקות דופן ומרכז גזירה (Thin-Walled)',
            9: 'קורות עקומות ושיטות אנרגיה (Curved Beams)',
            10: 'עבודה וירטואלית וקסטיליאנו (Castigliano)',
            11: 'קריסה ויציבות אלסטית (Buckling)',
            12: 'פלסטיות ואנליזת גבול (Plasticity)'
        }
    },
    // 104228 - Partial Differential Equations (מד"ח)
    '104228': {
        code: '104228',
        name: 'מד"ח',
        totalSheets: 12,
        bestN: 10,
        isDualComponent: false,
        policyLabel: 'הטובים מ-12: 10',
        weightLabel: '10% מגן תרגילים'
    },
    // 114052 - Physics 2 (פיסיקה 2)
    '114052': {
        code: '114052',
        name: 'פיסיקה 2',
        totalSheets: 12,
        bestN: 10,
        isDualComponent: false,
        policyLabel: 'הטובים מ-12: 10',
        weightLabel: 'מגן שיעורי בית Lon-Capa'
    },
    // 034035 - Thermodynamics 1 (תרמודינמיקה 1)
    '034035': {
        code: '034035',
        name: 'תרמודינמיקה 1',
        totalSheets: 10,
        bestN: 8,
        isDualComponent: false,
        policyLabel: 'הטובים מ-10: 8',
        weightLabel: 'מגן תרגילי בית'
    },
    // 034056 - Scientific & Engineering Computing (חישוב מדעי והנדסי)
    '034056': {
        code: '034056',
        name: 'חישוב מדעי והנדסי',
        totalSheets: 6,
        bestN: 5,
        isDualComponent: false,
        policyLabel: 'הטובים מ-6: 5',
        weightLabel: 'מטלות תכנות ומעבדה'
    }
};

function getDynamicCourseHomeworkPolicy(course) {
    if (!course) return null;
    const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(course.code) : String(course.code).replace(/^0+/, '');
    if (COURSE_HOMEWORK_POLICIES[cleanCode]) return COURSE_HOMEWORK_POLICIES[cleanCode];

    const tasks = Array.isArray(course.tasks) ? course.tasks : [];
    const hwTasks = tasks.filter(t => t.type === 'hw' || (t.title && /תרגיל|מטלה|גיליון|גליון|hw/i.test(t.title)));
    if (hwTasks.length === 0) return null;

    const total = Math.max(hwTasks.length, 6);
    const bestN = total > 8 ? total - 2 : Math.max(1, total - 1);
    return {
        code: cleanCode,
        name: course.name || cleanCode,
        totalSheets: total,
        bestN: bestN,
        isDualComponent: false,
        policyLabel: `הטובים מ-${total}: ${bestN}`,
        weightLabel: 'חובת שיעורי בית'
    };
}

function getCourseHomeworkStatus(courseCode) {
    if (!courseCode || !window.gameState || !window.gameState.courses) return null;
    const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(courseCode) : String(courseCode).replace(/^0+/, '');
    const course = window.gameState.courses[cleanCode] || window.gameState.courses['0' + cleanCode] || window.gameState.courses[courseCode];
    if (!course) return null;

    const policy = COURSE_HOMEWORK_POLICIES[cleanCode] || getDynamicCourseHomeworkPolicy(course);
    if (!policy) return null;

    const tasks = Array.isArray(course.tasks) ? course.tasks : [];
    const hwTasks = tasks.filter(t => t.type === 'hw' || (t.title && /תרגיל|מטלה|גיליון|גליון|hw/i.test(t.title)));

    const sheets = [];
    let completedCount = 0;
    let submittedCount = 0;

    for (let i = 1; i <= policy.totalSheets; i++) {
        const sheetName = (policy.sheetNames && policy.sheetNames[i]) ? policy.sheetNames[i] : `גיליון ${i}`;
        
        // Find tasks matching sheet i
        const matchingTasks = hwTasks.filter(t => {
            const title = String(t.title || '').toLowerCase();
            const digitMatch = title.match(/\\b0*(\\d+)\\b/);
            if (digitMatch && parseInt(digitMatch[1], 10) === i) return true;
            const hebLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];
            if (hebLetters[i - 1]) {
                const hebRegex = new RegExp(`\\\\b${hebLetters[i - 1]}['״׳]?\\\\b`, 'i');
                if (hebRegex.test(title)) return true;
            }
            return false;
        });

        let digitalTask = null;
        let writtenTask = null;
        let singleTask = null;

        if (policy.isDualComponent) {
            digitalTask = matchingTasks.find(t => {
                const title = String(t.title || '').toLowerCase();
                return /(שאלון|דיגיטלי|מקוון|quiz|hw\\s*\\d+|stress|tensor|principle)/i.test(title) && !/(הגשת\\s*פתרון|פתרון\\s*בכתב|סריקה)/i.test(title);
            }) || matchingTasks.find(t => !/(הגשת\\s*פתרון|פתרון\\s*בכתב|סריקה)/i.test(t.title || '')) || null;

            writtenTask = matchingTasks.find(t => {
                const title = String(t.title || '').toLowerCase();
                return /(הגשת\\s*פתרון|פתרון\\s*בכתב|סריקה|upload|פתרון\\s*תרגיל)/i.test(title);
            }) || null;
        } else {
            singleTask = matchingTasks[0] || null;
        }

        let status = 'todo';
        let isDigitalDone = false;
        let isWrittenDone = false;
        let isDigitalSubmitted = false;
        let isWrittenSubmitted = false;

        if (policy.isDualComponent) {
            isDigitalDone = !!(digitalTask && (digitalTask.completed === true || digitalTask.status === 'done'));
            isWrittenDone = !!(writtenTask && (writtenTask.completed === true || writtenTask.status === 'done'));
            isDigitalSubmitted = !!(digitalTask && (digitalTask.status === 'submitted' || digitalTask.submittedAt));
            isWrittenSubmitted = !!(writtenTask && (writtenTask.status === 'submitted' || writtenTask.submittedAt));

            if (isDigitalDone && isWrittenDone) {
                status = 'done';
            } else if (isDigitalDone || isWrittenDone || isDigitalSubmitted || isWrittenSubmitted) {
                status = 'submitted';
            } else {
                status = 'todo';
            }
        } else {
            const isDone = !!(singleTask && (singleTask.completed === true || singleTask.status === 'done'));
            const isSub = !!(singleTask && (singleTask.status === 'submitted' || singleTask.submittedAt));
            if (isDone) status = 'done';
            else if (isSub) status = 'submitted';
            else status = 'todo';
        }

        if (status === 'done') completedCount++;
        else if (status === 'submitted') submittedCount++;

        sheets.push({
            index: i,
            name: sheetName,
            status: status,
            isDual: policy.isDualComponent,
            digitalTask: digitalTask,
            writtenTask: writtenTask,
            singleTask: singleTask,
            isDigitalDone: isDigitalDone,
            isWrittenDone: isWrittenDone,
            isDigitalSubmitted: isDigitalSubmitted,
            isWrittenSubmitted: isWrittenSubmitted
        });
    }

    const isMet = completedCount >= policy.bestN;
    const remaining = Math.max(0, policy.bestN - completedCount);
    const progressPct = Math.min(100, Math.round((completedCount / policy.bestN) * 100));

    return {
        course: course,
        policy: policy,
        sheets: sheets,
        completedCount: completedCount,
        submittedCount: submittedCount,
        totalSheets: policy.totalSheets,
        bestN: policy.bestN,
        isMet: isMet,
        remaining: remaining,
        progressPct: progressPct
    };
}

// 1. Macro View: Render Notion Tasks Board Homework Policy Strip
function renderNotionHomeworkPolicyStrip() {
    const stripContainer = document.getElementById("notion-hw-policy-strip");
    if (!stripContainer) return;

    if (!window.gameState || !window.gameState.courses) {
        stripContainer.style.display = "none";
        return;
    }

    const curActiveSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : 3;
    
    // Find active courses with homework policies
    const activeCourses = Object.values(window.gameState.courses).filter(c => {
        const cSem = c.semester || 1;
        const isEnrolled = c.status === 'active' || c.status === 'available' || cSem === curActiveSem;
        if (!isEnrolled) return false;
        const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(c.code) : String(c.code).replace(/^0+/, '');
        return !!(COURSE_HOMEWORK_POLICIES[cleanCode] || (Array.isArray(c.tasks) && c.tasks.some(t => t.type === 'hw')));
    });

    if (activeCourses.length === 0) {
        stripContainer.style.display = "none";
        return;
    }

    stripContainer.style.display = "block";

    let capsulesHtml = "";
    activeCourses.forEach(course => {
        const hwStatus = getCourseHomeworkStatus(course.code);
        if (!hwStatus) return;

        const iconHtml = (typeof getCourseNotionIconHtml === 'function') ? getCourseNotionIconHtml(course.code) : '📚';
        const displayName = (typeof getCourseDisplayNameByCode === 'function') ? getCourseDisplayNameByCode(course.code) : (course.name || course.code);

        // Build 12-dot track
        let dotsHtml = "";
        hwStatus.sheets.forEach(sheet => {
            if (sheet.index === hwStatus.bestN + 1) {
                dotsHtml += `<div class="hw-dot-threshold" title="סף מגן: ${hwStatus.bestN} גיליונות"></div>`;
            }
            const statusClass = sheet.status; // 'done', 'submitted', 'todo', 'locked'
            const statusLabel = sheet.status === 'done' ? 'הושלם ✓' : (sheet.status === 'submitted' ? 'הוגש (ממתין/חלקי)' : 'טרם הוגש');
            dotsHtml += `<div class="hw-dot ${statusClass}" title="גיליון ${sheet.index} - ${sheet.name}: ${statusLabel}"></div>`;
        });

        const ratioBadgeClass = hwStatus.isMet ? 'met' : 'progress';
        const ratioBadgeText = hwStatus.isMet ? `${hwStatus.completedCount}/${hwStatus.bestN} ✓` : `${hwStatus.completedCount}/${hwStatus.bestN}`;

        capsulesHtml += `
            <div class="course-hw-capsule" onclick="if (window.openCourseHomeworkDetail) window.openCourseHomeworkDetail('${course.code}');" title="לחץ לפירוט 12 הגיליונות וההגשות הכפולות">
                <div class="capsule-top">
                    <div class="capsule-course-info">
                        <span class="capsule-course-icon" style="display: inline-flex; align-items: center;">${iconHtml}</span>
                        <span class="capsule-course-name">${displayName}</span>
                        <span class="capsule-course-code">${course.code}</span>
                    </div>
                    <span class="capsule-ratio-badge ${ratioBadgeClass}">
                        ${ratioBadgeText}
                    </span>
                </div>
                <div class="capsule-meta-row">
                    <span class="capsule-policy-label">🎯 ${hwStatus.policy.policyLabel}</span>
                    <span style="font-size: 0.70rem; color: #94a3b8;">${hwStatus.remaining > 0 ? `נותרו עוד ${hwStatus.remaining}` : 'היעד הובטח!'}</span>
                </div>
                <div class="hw-dots-track">
                    ${dotsHtml}
                </div>
            </div>
        `;
    });

    stripContainer.innerHTML = `
        <div class="hw-strip-header">
            <div class="hw-strip-title">
                <span>🎯</span>
                <span>מעקב חובת שיעורי בית ("הטובים מ-N")</span>
                <span class="hw-strip-badge">סמסטר ${curActiveSem} פעיל</span>
            </div>
            <div class="hw-strip-hint">
                💡 לחץ על קורס לפירוט 12 הגיליונות, השאלון הדיגיטלי והפתרון בכתב ↗
            </div>
        </div>
        <div class="hw-capsules-grid">
            ${capsulesHtml}
        </div>
    `;
}

// 2. Micro View: Render Course Modal Homework Policy Section
function renderCourseModalHomeworkPolicy(course) {
    const container = document.getElementById("modal-hw-policy-section");
    if (!container) return;

    if (!course) {
        container.style.display = "none";
        return;
    }

    const hwStatus = getCourseHomeworkStatus(course.code);
    if (!hwStatus) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";

    const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(course.code) : String(course.code).replace(/^0+/, '');
    const driveUrl = (typeof getFacultyDriveCourseUrl === 'function') ? getFacultyDriveCourseUrl(cleanCode) : '';

    // Summary pills
    const statusMsg = hwStatus.isMet
        ? `<span style="color: #34d399; font-weight: 700;">🎉 יעד המגן הובטח בהצלחה! (${hwStatus.completedCount}/${hwStatus.bestN} הושלמו)</span>`
        : `<span style="color: #fbbf24; font-weight: 600;">נותרו עוד ${hwStatus.remaining} גיליונות להבטחת המגן המלא (${hwStatus.completedCount}/${hwStatus.bestN})</span>`;

    // Sheets cards
    let sheetsGridHtml = "";
    hwStatus.sheets.forEach(sheet => {
        const cardClass = sheet.status === 'done' ? 'is-done' : (sheet.status === 'submitted' ? 'is-submitted' : '');
        const statusBadgeClass = sheet.status;
        const statusBadgeLabel = sheet.status === 'done' ? 'הושלם ✓' : (sheet.status === 'submitted' ? 'בהגשה ⏳' : 'פתוח');

        let componentsHtml = "";
        if (sheet.isDual) {
            // Part A: Digital Online Quiz
            const digDone = sheet.isDigitalDone;
            const digBtnClass = digDone ? 'active' : '';
            const digBtnText = digDone ? 'הושלם ✓' : 'סמן כהוגש';
            const digLink = (sheet.digitalTask && sheet.digitalTask.moodleUrl)
                ? `<a href="javascript:void(0)" onclick="if (window.openExternalUrlOrBrowser) window.openExternalUrlOrBrowser('${sheet.digitalTask.moodleUrl}', '_blank');" class="hw-link-btn" title="פתח שאלון במודל">מודל ↗</a>`
                : '';

            // Part B: Written Solution Upload
            const writDone = sheet.isWrittenDone;
            const writBtnClass = writDone ? 'active' : '';
            const writBtnText = writDone ? 'הושלם ✓' : 'סמן כהוגש';
            const writLink = (sheet.writtenTask && sheet.writtenTask.moodleUrl)
                ? `<a href="javascript:void(0)" onclick="if (window.openExternalUrlOrBrowser) window.openExternalUrlOrBrowser('${sheet.writtenTask.moodleUrl}', '_blank');" class="hw-link-btn" title="פתח הגשת פתרון במודל">מודל ↗</a>`
                : '';

            componentsHtml = `
                <div class="hw-components-container">
                    <div class="hw-component-row">
                        <span class="hw-component-label">
                            <span>📝</span>
                            <span title="${sheet.digitalTask ? sheet.digitalTask.title : 'שאלון דיגיטלי'}">${sheet.digitalTask ? sheet.digitalTask.title : 'שאלון מקוון / דיגיטלי'}</span>
                        </span>
                        <div class="hw-component-actions">
                            ${digLink}
                            <button type="button" class="btn-hw-toggle ${digBtnClass}" onclick="if (window.toggleHomeworkSheetComponent) window.toggleHomeworkSheetComponent('${course.code}', ${sheet.index}, 'digital');">
                                ${digBtnText}
                            </button>
                        </div>
                    </div>
                    <div class="hw-component-row">
                        <span class="hw-component-label">
                            <span>📄</span>
                            <span title="${sheet.writtenTask ? sheet.writtenTask.title : 'הגשת פתרון בכתב'}">${sheet.writtenTask ? sheet.writtenTask.title : 'הגשת פתרון בכתב (סריקה)'}</span>
                        </span>
                        <div class="hw-component-actions">
                            ${writLink}
                            <button type="button" class="btn-hw-toggle ${writBtnClass}" onclick="if (window.toggleHomeworkSheetComponent) window.toggleHomeworkSheetComponent('${course.code}', ${sheet.index}, 'written');">
                                ${writBtnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Single Component
            const sDone = sheet.status === 'done';
            const sBtnClass = sDone ? 'active' : '';
            const sBtnText = sDone ? 'הושלם ✓' : 'סמן כהוגש';
            const sLink = (sheet.singleTask && sheet.singleTask.moodleUrl)
                ? `<a href="javascript:void(0)" onclick="if (window.openExternalUrlOrBrowser) window.openExternalUrlOrBrowser('${sheet.singleTask.moodleUrl}', '_blank');" class="hw-link-btn" title="פתח מטלה במודל">מודל ↗</a>`
                : '';

            componentsHtml = `
                <div class="hw-components-container">
                    <div class="hw-component-row">
                        <span class="hw-component-label">
                            <span>📜</span>
                            <span title="${sheet.singleTask ? sheet.singleTask.title : sheet.name}">${sheet.singleTask ? sheet.singleTask.title : sheet.name}</span>
                        </span>
                        <div class="hw-component-actions">
                            ${sLink}
                            <button type="button" class="btn-hw-toggle ${sBtnClass}" onclick="if (window.toggleHomeworkSheetStatus) window.toggleHomeworkSheetStatus('${course.code}', ${sheet.index});">
                                ${sBtnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        sheetsGridHtml += `
            <div class="hw-sheet-card ${cardClass}">
                <div class="hw-sheet-card-top">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="hw-sheet-index">גיליון ${sheet.index}</span>
                        <span class="hw-sheet-topic" title="${sheet.name}">${sheet.name}</span>
                    </div>
                    <span class="hw-sheet-status-badge ${statusBadgeClass}">
                        ${statusBadgeLabel}
                    </span>
                </div>
                ${componentsHtml}
            </div>
        `;
    });

    container.innerHTML = `
        <div class="modal-hw-box">
            <div class="modal-hw-header">
                <div class="modal-hw-title-group">
                    <h3>
                        <span>🎯 מעקב חובת שיעורי בית ("${hwStatus.policy.policyLabel}")</span>
                    </h3>
                    <div class="modal-hw-subtitle">
                        משקל: ${hwStatus.policy.weightLabel} &bull; ${statusMsg}
                    </div>
                </div>
                ${driveUrl ? `
                    <button type="button" class="btn btn-xs btn-outline" onclick="if (window.openExternalUrlOrBrowser) window.openExternalUrlOrBrowser('${driveUrl}', '_blank');" style="border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; display: inline-flex; align-items: center; gap: 5px;">
                        📁 רפרנסים לקורס בדרייב ↗
                    </button>
                ` : ''}
            </div>

            <!-- Stats Strip -->
            <div class="modal-hw-stats-strip">
                <div class="modal-hw-stat-pill done">
                    <span>🟢</span>
                    <span>הושלמו: ${hwStatus.completedCount}</span>
                </div>
                <div class="modal-hw-stat-pill submitted">
                    <span>🟣</span>
                    <span>בהגשה / חלקי: ${hwStatus.submittedCount}</span>
                </div>
                <div class="modal-hw-stat-pill target">
                    <span>🎯</span>
                    <span>יעד: ${hwStatus.bestN} מתוך ${hwStatus.totalSheets}</span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="modal-hw-progress-track">
                <div class="modal-hw-progress-bar" style="width: ${hwStatus.progressPct}%;"></div>
            </div>

            <!-- 12-Sheets Grid -->
            <div class="hw-sheets-grid">
                ${sheetsGridHtml}
            </div>
        </div>
    `;
}

// Interactive Toggle for Individual Component (Digital Quiz vs Written Solution)
function toggleHomeworkSheetComponent(courseCode, sheetIndex, compType) {
    if (!courseCode || !window.gameState || !window.gameState.courses) return;
    const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(courseCode) : String(courseCode).replace(/^0+/, '');
    const course = window.gameState.courses[cleanCode] || window.gameState.courses['0' + cleanCode] || window.gameState.courses[courseCode];
    if (!course) return;

    if (!Array.isArray(course.tasks)) course.tasks = [];

    const policy = COURSE_HOMEWORK_POLICIES[cleanCode] || getDynamicCourseHomeworkPolicy(course);
    const sheetName = (policy && policy.sheetNames && policy.sheetNames[sheetIndex]) ? policy.sheetNames[sheetIndex] : `גיליון ${sheetIndex}`;

    // Look for matching task
    let targetTask = null;
    course.tasks.forEach(t => {
        const title = String(t.title || '').toLowerCase();
        const digitMatch = title.match(/\\b0*(\\d+)\\b/);
        const matchesIndex = (digitMatch && parseInt(digitMatch[1], 10) === sheetIndex);
        if (!matchesIndex) return;

        if (compType === 'written') {
            if (/(הגשת\\s*פתרון|פתרון\\s*בכתב|סריקה|upload)/i.test(title)) targetTask = t;
        } else {
            if (!/(הגשת\\s*פתרון|פתרון\\s*בכתב|סריקה)/i.test(title)) targetTask = t;
        }
    });

    if (!targetTask) {
        // Create task dynamically if not yet in course.tasks
        const isWritten = (compType === 'written');
        targetTask = {
            id: `${cleanCode}_hw_${sheetIndex}_${isWritten ? 'written' : 'dig'}`,
            title: isWritten ? `הגשת פתרון תרגיל בית ${sheetIndex}` : `HW ${sheetIndex} - ${sheetName}`,
            type: 'hw',
            xp: 50,
            completed: true,
            status: 'done'
        };
        course.tasks.push(targetTask);
    } else {
        targetTask.completed = !targetTask.completed;
        targetTask.status = targetTask.completed ? 'done' : 'not_started';
    }

    // Sync registry
    if (window.MoodleSync) {
        if (targetTask.completed && typeof window.MoodleSync.markTaskCompletedInRegistry === 'function') {
            window.MoodleSync.markTaskCompletedInRegistry(course.code, targetTask);
        } else if (!targetTask.completed && typeof window.MoodleSync.unmarkTaskCompletedInRegistry === 'function') {
            window.MoodleSync.unmarkTaskCompletedInRegistry(course.code, targetTask);
        }
    }

    if (typeof saveState === 'function') saveState();

    // Re-render
    renderCourseModalHomeworkPolicy(course);
    if (typeof renderModalTaskList === 'function') renderModalTaskList(course);
    renderNotionHomeworkPolicyStrip();
    if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
}

// Interactive Toggle for entire Sheet
function toggleHomeworkSheetStatus(courseCode, sheetIndex) {
    if (!courseCode || !window.gameState || !window.gameState.courses) return;
    const cleanCode = (typeof cleanTechnionCourseCode === 'function') ? cleanTechnionCourseCode(courseCode) : String(courseCode).replace(/^0+/, '');
    const course = window.gameState.courses[cleanCode] || window.gameState.courses['0' + cleanCode] || window.gameState.courses[courseCode];
    if (!course) return;

    const hwStatus = getCourseHomeworkStatus(courseCode);
    if (!hwStatus) return;

    const sheet = hwStatus.sheets.find(s => s.index === sheetIndex);
    if (!sheet) return;

    const nextCompleted = (sheet.status !== 'done');

    if (sheet.isDual) {
        // Toggle both digital and written parts
        if (sheet.digitalTask) {
            sheet.digitalTask.completed = nextCompleted;
            sheet.digitalTask.status = nextCompleted ? 'done' : 'not_started';
        } else if (nextCompleted) {
            toggleHomeworkSheetComponent(courseCode, sheetIndex, 'digital');
        }
        if (sheet.writtenTask) {
            sheet.writtenTask.completed = nextCompleted;
            sheet.writtenTask.status = nextCompleted ? 'done' : 'not_started';
        } else if (nextCompleted) {
            toggleHomeworkSheetComponent(courseCode, sheetIndex, 'written');
        }
    } else {
        if (sheet.singleTask) {
            sheet.singleTask.completed = nextCompleted;
            sheet.singleTask.status = nextCompleted ? 'done' : 'not_started';
        } else if (nextCompleted) {
            toggleHomeworkSheetComponent(courseCode, sheetIndex, 'single');
        }
    }

    if (typeof saveState === 'function') saveState();

    renderCourseModalHomeworkPolicy(course);
    if (typeof renderModalTaskList === 'function') renderModalTaskList(course);
    renderNotionHomeworkPolicyStrip();
    if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
}

// Open Course Modal & Focus on Homework Policy Section
function openCourseHomeworkDetail(courseCode) {
    if (typeof openCourseDetails === 'function') {
        openCourseDetails(courseCode);
    }
    setTimeout(() => {
        const section = document.getElementById("modal-hw-policy-section");
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            section.classList.remove('hw-sheet-highlight-pulse');
            void section.offsetWidth; // Trigger reflow
            section.classList.add('hw-sheet-highlight-pulse');
        }
    }, 150);
}

window.renderNotionHomeworkPolicyStrip = renderNotionHomeworkPolicyStrip;
window.renderCourseModalHomeworkPolicy = renderCourseModalHomeworkPolicy;
window.toggleHomeworkSheetComponent = toggleHomeworkSheetComponent;
window.toggleHomeworkSheetStatus = toggleHomeworkSheetStatus;
window.openCourseHomeworkDetail = openCourseHomeworkDetail;
window.getCourseHomeworkStatus = getCourseHomeworkStatus;
window.COURSE_HOMEWORK_POLICIES = COURSE_HOMEWORK_POLICIES;
"""

# Now write code to also hook into:
# 1. renderNotionTasksTable(): add renderNotionHomeworkPolicyStrip(); at the start
# 2. openCourseDetails(): add renderCourseModalHomeworkPolicy(course); after renderCoursePeerConsensus(course)

if 'renderNotionHomeworkPolicyStrip()' not in app_js:
    target_tasks = "function renderNotionTasksTable() {"
    if target_tasks in app_js:
        app_js = app_js.replace(target_tasks, target_tasks + "\n    if (typeof renderNotionHomeworkPolicyStrip === 'function') renderNotionHomeworkPolicyStrip();", 1)
        print("Hooked into renderNotionTasksTable")
    else:
        print("Could not find renderNotionTasksTable")

if 'renderCourseModalHomeworkPolicy(course)' not in app_js:
    target_modal = "renderCoursePeerConsensus(course);"
    if target_modal in app_js:
        app_js = app_js.replace(target_modal, target_modal + "\n    if (typeof renderCourseModalHomeworkPolicy === 'function') renderCourseModalHomeworkPolicy(course);", 1)
        print("Hooked into openCourseDetails")
    else:
        print("Could not find renderCoursePeerConsensus(course);")

app_js += hw_code

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("app.js updated successfully!")
