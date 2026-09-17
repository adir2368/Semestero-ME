// ==========================================================================
// Degree Planner Module (תכנון תואר אקדמי - גרור ושחרר קורסים וחוקי בחירה)
// Atlas ME - Technion Faculty of Mechanical Engineering
// Multi-Pass Audited & Refactored Engine (v1.8.11)
// ==========================================================================

(function(global) {
    'use strict';

    // --------------------------------------------------------------------------
    // Module State & Configuration
    // --------------------------------------------------------------------------
    let currentMode = 'custom'; // 'custom' | 'suggested'
    let selectedCategory = 'ALL'; // 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'UNASSIGNED'
    let searchQuery = '';
    let customPlan = null;
    let unassignedCourses = [];
    let isWhatIfMode = false;
    let whatIfGrades = {};
    let defaultWhatIfGrade = 85;

    // Local Storage Keys
    const PLANNER_STORAGE_KEY_V2 = 'atlas_me_custom_degree_plan_v2';
    const PLANNER_STORAGE_KEY_V1 = 'atlas_me_custom_degree_plan_v1';

    // Purged Courses List (Removed/Exempt for user: English B & Creative Intro)
    const PURGED_CODES = new Set([
        '03240033', '324033',
        '00350026', '035026', '35026',
        '035044'
    ]);

    // Active drag tracking object
    let activeDragPayload = null;

    // Debounce timer for saving state
    let saveDebounceTimer = null;

    // Search input debounce timer
    let searchDebounceTimer = null;

    // --------------------------------------------------------------------------
    // Helper: Code Normalization
    // --------------------------------------------------------------------------
    function getNormalizedCodes(code, altCode) {
        const codes = [];
        if (code) {
            const cStr = String(code).trim();
            codes.push(cStr);
            const stripped = cStr.replace(/^0+/, '');
            if (stripped && stripped !== cStr) codes.push(stripped);
        }
        if (altCode) {
            const aStr = String(altCode).trim();
            codes.push(aStr);
            const strippedAlt = aStr.replace(/^0+/, '');
            if (strippedAlt && strippedAlt !== aStr) codes.push(strippedAlt);
        }
        return codes;
    }

    // --------------------------------------------------------------------------
    // Helpers: Course Completion & Grade Lookup
    // --------------------------------------------------------------------------
    function isCourseCompleted(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return false;
        const candidateCodes = getNormalizedCodes(code, altCode);

        for (let i = 0; i < candidateCodes.length; i++) {
            const c = global.gameState.courses[candidateCodes[i]];
            if (c) {
                // Priority 1: Numeric passing grade
                if (c.grade !== undefined && c.grade !== null && c.grade !== '') {
                    const num = Number(c.grade);
                    if (!isNaN(num) && num >= 55) return true;
                }
                // Priority 2: Mastered status
                if (c.status === 'mastered') return true;
                // Priority 3: Explicit binary pass only if not locked or available
                if (c.status !== 'locked' && c.status !== 'available' && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS')) {
                    return true;
                }
            }
        }
        return false;
    }

    function getCourseGrade(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return null;
        const candidateCodes = getNormalizedCodes(code, altCode);

        for (let i = 0; i < candidateCodes.length; i++) {
            const c = global.gameState.courses[candidateCodes[i]];
            if (c) {
                // Numeric grade always takes precedence!
                if (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade))) {
                    return String(c.grade);
                }
                if (c.status === 'mastered' && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS')) {
                    return 'עובר';
                }
            }
        }
        return null;
    }

    // --------------------------------------------------------------------------
    // State Initialization & Persistence
    // --------------------------------------------------------------------------
    function initPlannerState() {
        if (customPlan && Array.isArray(customPlan) && customPlan.length > 0) {
            return;
        }

        if (!global.PLANNER_CATALOG) {
            console.warn('[Planner] PLANNER_CATALOG not loaded yet');
            return;
        }

        try {
            const savedV2 = localStorage.getItem(PLANNER_STORAGE_KEY_V2);
            if (savedV2) {
                const parsed = JSON.parse(savedV2);
                if (parsed && Array.isArray(parsed.semesters)) {
                    customPlan = parsed.semesters;
                    unassignedCourses = Array.isArray(parsed.unassigned) ? parsed.unassigned : [];
                } else if (Array.isArray(parsed)) {
                    customPlan = parsed;
                    unassignedCourses = [];
                }
            } else {
                const savedV1 = localStorage.getItem(PLANNER_STORAGE_KEY_V1);
                if (savedV1) {
                    const parsedV1 = JSON.parse(savedV1);
                    if (Array.isArray(parsedV1)) {
                        customPlan = parsedV1;
                        unassignedCourses = [];
                    }
                }
            }
        } catch (e) {
            console.error('[Planner] Error parsing saved plan:', e);
        }

        // Initialize from official suggested syllabus if empty
        if (!customPlan || !Array.isArray(customPlan) || customPlan.length === 0) {
            resetPlanToSuggested();
        }

        // 1. Purge removed/exempt courses (English B & Creative Intro)
        if (customPlan) {
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(c => !PURGED_CODES.has(c.code) && !PURGED_CODES.has(c.altCode));
            });
        }
        if (unassignedCourses) {
            unassignedCourses = unassignedCourses.filter(c => !PURGED_CODES.has(c.code) && !PURGED_CODES.has(c.altCode));
        }

        // 2. Ensure unassigned courses do not appear inside semesters
        if (unassignedCourses && unassignedCourses.length > 0) {
            const unassignedCodes = new Set();
            unassignedCourses.forEach(c => {
                getNormalizedCodes(c.code, c.altCode).forEach(k => unassignedCodes.add(k));
            });
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(c => {
                    const cKeys = getNormalizedCodes(c.code, c.altCode);
                    return !cKeys.some(k => unassignedCodes.has(k));
                });
            });
        }

        // 3. Synchronize completed courses from gameState into their exact completed semester
        syncCompletedCoursesFromGameState();

        // 4. Persist clean state
        saveCustomPlan(true);
    }

    function syncCompletedCoursesFromGameState() {
        if (!global.gameState || !global.gameState.courses || !customPlan) return;

        Object.values(global.gameState.courses).forEach(c => {
            if (!c || !c.code) return;
            if (PURGED_CODES.has(c.code)) return;

            const hasNumeric = (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade)) && Number(c.grade) >= 55);
            const isBinary = (c.status === 'mastered') && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS');
            const isDone = (c.status === 'mastered') || hasNumeric || isBinary;

            if (isDone) {
                const actualSem = Number(c.semester);
                if (actualSem >= 1 && actualSem <= 8) {
                    const cKeys = new Set(getNormalizedCodes(c.code, c.altCode));

                    // Remove from unassigned if present
                    unassignedCourses = unassignedCourses.filter(u => {
                        const uKeys = getNormalizedCodes(u.code, u.altCode);
                        return !uKeys.some(k => cKeys.has(k));
                    });

                    // Check if already in customPlan
                    let foundCourse = null;
                    customPlan.forEach(sem => {
                        const idx = (sem.courses || []).findIndex(x => {
                            const xKeys = getNormalizedCodes(x.code, x.altCode);
                            return xKeys.some(k => cKeys.has(k));
                        });
                        if (idx !== -1) {
                            foundCourse = sem.courses.splice(idx, 1)[0];
                        }
                    });

                    // If not found in customPlan, reconstruct from catalog or gameState
                    if (!foundCourse) {
                        const catCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[c.code] ||
                                          (c.altCode && global.PLANNER_CATALOG.ALL_COURSES_MAP[c.altCode]);
                        if (catCourse) {
                            foundCourse = { ...catCourse };
                        } else {
                            foundCourse = {
                                code: c.code,
                                altCode: c.altCode || '',
                                name: c.name || c.title || c.code,
                                credits: Number(c.credits) || 3.0,
                                type: c.type || 'elective',
                                prereqs: c.prerequisites || []
                            };
                        }
                    }

                    // Place in correct semester
                    const targetSemObj = customPlan.find(s => s.semester === actualSem);
                    if (targetSemObj) {
                        targetSemObj.courses = targetSemObj.courses || [];
                        targetSemObj.courses.push(foundCourse);
                    }
                }
            }
        });
    }

    function resetPlanToSuggested() {
        if (!global.PLANNER_CATALOG) return;
        customPlan = JSON.parse(JSON.stringify(global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS));
        unassignedCourses = [];
        syncCompletedCoursesFromGameState();
        saveCustomPlan(true);
    }

    function saveCustomPlan(immediate = false) {
        if (!customPlan) return;

        const performSave = () => {
            try {
                const dataToSave = {
                    semesters: customPlan,
                    unassigned: unassignedCourses
                };
                const jsonStr = JSON.stringify(dataToSave);
                localStorage.setItem(PLANNER_STORAGE_KEY_V2, jsonStr);
                localStorage.setItem(PLANNER_STORAGE_KEY_V1, JSON.stringify(customPlan));

                if (global.gameState) {
                    global.gameState.degreePlan = customPlan;
                    global.gameState.degreePlanUnassigned = unassignedCourses;
                }

                // Notify other components (HUD, Timetable, Flowchart) of state change
                if (typeof global.notifyStateChanged === 'function') {
                    global.notifyStateChanged({ source: 'planner' });
                }
            } catch (e) {
                console.error('[Planner] Failed to save plan:', e);
            }
        };

        if (immediate) {
            if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
            performSave();
        } else {
            if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
            saveDebounceTimer = setTimeout(performSave, 200);
        }
    }

    function getActivePlan() {
        if (currentMode === 'suggested') {
            return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS;
        }
        return customPlan || global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS;
    }

    function buildCourseSemesterMap(plan) {
        const map = {};
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                const keys = getNormalizedCodes(c.code, c.altCode);
                keys.forEach(k => { map[k] = sem.semester; });
            });
        });
        return map;
    }

    // --------------------------------------------------------------------------
    // Prerequisite Engine & Visual Feedback
    // --------------------------------------------------------------------------
    function checkPrerequisites(course, semesterNum, courseSemMap) {
        if (!course.prereqs || course.prereqs.length === 0) {
            return { valid: true, missing: [], missingCodes: [] };
        }

        const missing = [];
        const missingCodes = [];

        course.prereqs.forEach(prereqCode => {
            const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[prereqCode];
            const alt = prereqCourse ? prereqCourse.altCode : null;

            // Check 1: Already completed in student transcript
            if (isCourseCompleted(prereqCode, alt)) {
                return;
            }

            // Check 2: Scheduled in a semester strictly prior to semesterNum
            let pSem = courseSemMap[prereqCode];
            if (pSem === undefined && alt) pSem = courseSemMap[alt];
            if (pSem === undefined) {
                const stripped = prereqCode.replace(/^0+/, '');
                if (stripped) pSem = courseSemMap[stripped];
            }

            const name = prereqCourse ? prereqCourse.name : prereqCode;
            if (pSem === undefined) {
                missing.push(`${name} (${prereqCode})`);
                missingCodes.push(prereqCode);
                if (alt) missingCodes.push(alt);
            } else if (pSem >= semesterNum) {
                missing.push(`${name} (בסמסטר ${pSem})`);
                missingCodes.push(prereqCode);
                if (alt) missingCodes.push(alt);
            }
        });

        return {
            valid: missing.length === 0,
            missing: missing,
            missingCodes: missingCodes
        };
    }

    function highlightMissingPrerequisites(missingCodes, reasonMsg, targetSemester) {
        showPlannerToast(reasonMsg, true);

        // Shake the target semester column to provide immediate visceral feedback
        if (targetSemester) {
            const semCol = document.querySelector(`.planner-semester-col[data-semester="${targetSemester}"]`);
            if (semCol) {
                semCol.classList.remove('semester-col-shake');
                void semCol.offsetWidth; // Force CSS reflow
                semCol.classList.add('semester-col-shake');
                setTimeout(() => {
                    if (semCol) semCol.classList.remove('semester-col-shake');
                }, 1200);
            }
        }

        // Pulse prerequisite beacon cards
        const highlightedEls = [];
        (missingCodes || []).forEach(code => {
            const selector = `[data-code="${code}"], [data-alt-code="${code}"]`;
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                el.classList.add('prereq-pulse-beacon');
                highlightedEls.push(el);
            });
        });

        if (highlightedEls.length > 0) {
            highlightedEls[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setTimeout(() => {
            highlightedEls.forEach(el => el.classList.remove('prereq-pulse-beacon'));
        }, 4000);
    }

    function showPlannerToast(message, isError = true) {
        let toast = document.getElementById('planner-active-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'planner-active-toast';
            toast.className = 'planner-toast-alert';
            document.body.appendChild(toast);
        }

        if (navigator.vibrate) {
            try { navigator.vibrate([80, 50, 80]); } catch (e) {}
        }

        toast.innerHTML = `
            <span style="font-size: 1.35rem; line-height: 1;">${isError ? '⛔' : 'ℹ️'}</span>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <strong style="font-size: 0.90rem; color: ${isError ? '#f87171' : '#38bdf8'};">${isError ? 'חסימת דרישות קדם' : 'הודעת מערכת'}</strong>
                <span style="font-size: 0.80rem; color: #f1f5f9; line-height: 1.35;">${escapeHtml(message)}</span>
            </div>
        `;
        toast.style.display = 'flex';
        toast.classList.remove('toast-active');
        void toast.offsetWidth;
        toast.classList.add('toast-active');

        if (toast._timer) clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            if (toast) {
                toast.classList.remove('toast-active');
                setTimeout(() => {
                    if (toast && !toast.classList.contains('toast-active')) {
                        toast.style.display = 'none';
                    }
                }, 300);
            }
        }, 5000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // --------------------------------------------------------------------------
    // Degree Rules Engine
    // --------------------------------------------------------------------------
    function evaluateDegreeRules(plan) {
        let countA = 0;
        let countB = 0;
        let countC = 0;
        let countD = 0;
        let creditsBCD = 0;
        let totalElectiveCredits = 0;
        let totalDegreeCredits = 0;

        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                const creds = Number(c.credits) || 0;
                totalDegreeCredits += creds;

                if (c.list === 'A') {
                    countA++;
                    totalElectiveCredits += creds;
                } else if (c.list === 'B') {
                    countB++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'C') {
                    countC++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'D') {
                    countD++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'E') {
                    totalElectiveCredits += creds;
                }
            });
        });

        return {
            countA,
            countB,
            countC,
            countD,
            creditsBCD,
            totalElectiveCredits,
            totalDegreeCredits,
            ruleA_met: countA >= 1,
            ruleB_met: countB >= 2,
            ruleC_met: countC >= 2,
            ruleD_met: countD >= 1,
            ruleBCD_met: creditsBCD >= 14.0,
            ruleTotalElectives_met: totalElectiveCredits >= 32.5,
            ruleDegreeTotal_met: totalDegreeCredits >= 157.5
        };
    }

    // --------------------------------------------------------------------------
    // Rendering Sub-systems
    // --------------------------------------------------------------------------
    function renderDegreePlanner() {
        initPlannerState();
        if (!global.PLANNER_CATALOG) return;

        requestAnimationFrame(() => {
            const plan = getActivePlan();
            const courseSemMap = buildCourseSemesterMap(plan);
            const rulesEval = evaluateDegreeRules(plan);

            renderHeaderStats(rulesEval);
            renderWhatIfBanner();
            renderSemesterColumns(plan, courseSemMap);
            renderRulesCard(rulesEval);
            renderAddElectivesSection(plan, courseSemMap);
            bindDelegatedPlannerEvents();
        });
    }

    
    // --------------------------------------------------------------------------
    // What-If Degree GPA Simulator Engine
    // --------------------------------------------------------------------------
    function calculateWhatIfGPA() {
        let realWeightedSum = 0;
        let realGradedCredits = 0;

        if (global.gameState && global.gameState.courses) {
            Object.values(global.gameState.courses).forEach(c => {
                if (!c) return;
                const cr = Number(c.credits) || 0;
                const hasNumeric = (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade)) && Number(c.grade) >= 55);
                const isBinary = !hasNumeric && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS');
                if (c.status === 'mastered' && hasNumeric && !isBinary) {
                    realWeightedSum += Number(c.grade) * cr;
                    realGradedCredits += cr;
                }
            });
        }

        const realGpa = realGradedCredits > 0 ? (realWeightedSum / realGradedCredits) : 0;

        let whatIfWeightedSum = 0;
        let whatIfCredits = 0;

        const plan = getActivePlan();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                if (isCourseCompleted(c.code, c.altCode)) return;
                if (c.type === 'sports' || (c.name && c.name.includes('חינוך גופני')) || c.isBinaryPass) return;

                const cr = Number(c.credits) || 0;
                const grade = (whatIfGrades[c.code] !== undefined) ? Number(whatIfGrades[c.code]) : defaultWhatIfGrade;
                whatIfWeightedSum += grade * cr;
                whatIfCredits += cr;
            });
        });

        const totalGraded = realGradedCredits + whatIfCredits;
        const projectedGpa = totalGraded > 0 ? ((realWeightedSum + whatIfWeightedSum) / totalGraded) : realGpa;

        return {
            realGpa,
            realGradedCredits,
            whatIfCredits,
            projectedGpa
        };
    }

    function renderWhatIfBanner() {
        const bannerEl = document.getElementById('planner-whatif-container');
        if (!bannerEl) return;
        if (!isWhatIfMode) {
            bannerEl.style.display = 'none';
            bannerEl.innerHTML = '';
            return;
        }

        const stats = calculateWhatIfGPA();
        bannerEl.style.display = 'flex';
        bannerEl.className = 'planner-whatif-banner';
        bannerEl.innerHTML = `
            <div class="whatif-stats-cluster">
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">ממוצע קיים (הושלם)</span>
                    <span class="whatif-stat-val">${stats.realGpa.toFixed(2)}</span>
                </div>
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">נק״ז מדורג קיים</span>
                    <span class="whatif-stat-val">${stats.realGradedCredits.toFixed(1)}</span>
                </div>
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">נק״ז מתוכנן בסימולציה</span>
                    <span class="whatif-stat-val">${stats.whatIfCredits.toFixed(1)}</span>
                </div>
                <div class="whatif-stat-box" style="border-right: 2px solid rgba(234, 179, 8, 0.4); padding-right: 14px;">
                    <span class="whatif-stat-label" style="color: #fde047;">🎯 ממוצע סיום תואר צפוי</span>
                    <span class="whatif-stat-val highlight">${stats.projectedGpa.toFixed(2)}</span>
                </div>
            </div>
            <div class="whatif-controls">
                <span style="font-size: 0.72rem; color: #94a3b8;">הגדרה גורפת:</span>
                <button type="button" class="btn-whatif-preset" data-preset="80">80</button>
                <button type="button" class="btn-whatif-preset" data-preset="85">85</button>
                <button type="button" class="btn-whatif-preset" data-preset="90">90</button>
                <button type="button" class="btn-whatif-preset" data-preset="95">95</button>
                <button type="button" class="btn-whatif-preset" data-preset="reset" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">איפוס</button>
            </div>
        `;
    }

    function renderHeaderStats(rulesEval) {
        const totalCredsEl = document.getElementById('planner-total-credits-val');
        const electivesCredsEl = document.getElementById('planner-electives-credits-val');

        if (totalCredsEl) {
            totalCredsEl.innerText = `${rulesEval.totalDegreeCredits.toFixed(1)} / 157.5`;
            totalCredsEl.style.color = rulesEval.ruleDegreeTotal_met ? '#10b981' : '#38bdf8';
        }
        if (electivesCredsEl) {
            electivesCredsEl.innerText = `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5`;
            electivesCredsEl.style.color = rulesEval.ruleTotalElectives_met ? '#10b981' : '#38bdf8';
        }

        const btnCustom = document.getElementById('btn-planner-mode-custom');
        const btnSuggested = document.getElementById('btn-planner-mode-suggested');
        if (btnCustom) btnCustom.classList.toggle('active', currentMode === 'custom');
        if (btnSuggested) btnSuggested.classList.toggle('active', currentMode === 'suggested');
    }

    function renderSemesterColumns(plan, courseSemMap) {
        const container = document.getElementById('planner-semesters-container');
        if (!container) return;

        const chunks = [];
        plan.forEach((sem, idx) => {
            const semNum = sem.semester || (idx + 1);
            let semCredits = 0;
            (sem.courses || []).forEach(c => { semCredits += Number(c.credits) || 0; });

            chunks.push(`
                <div class="planner-semester-col" data-semester="${semNum}">
                    <div class="semester-col-header">
                        <span class="semester-col-title">סמסטר ${semNum}</span>
                        <span class="semester-col-credits">${semCredits.toFixed(1)} נק״ז</span>
                    </div>
                    <div class="planner-course-list" data-semester="${semNum}">
            `);

            (sem.courses || []).forEach(course => {
                const completed = isCourseCompleted(course.code, course.altCode);
                const grade = getCourseGrade(course.code, course.altCode);
                const prereqStatus = checkPrerequisites(course, semNum, courseSemMap);

                const tagClass = completed ? 'tag-completed' : (course.list ? `tag-list-${course.list}` : (course.type ? `tag-${course.type}` : 'tag-mandatory'));
                const tagLabel = completed ? (grade ? `✓ הושלם [${grade}]` : '✓ הושלם') : (course.list ? `בחירה ${course.list}׳` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה'));

                const canDrag = currentMode === 'custom' && !completed;
                const canRemove = currentMode === 'custom' && !completed;

                chunks.push(`
                    <div class="planner-course-card ${completed ? 'course-card-completed' : ''}" 
                         draggable="${canDrag ? 'true' : 'false'}" 
                         data-code="${escapeHtml(course.code)}" 
                         data-alt-code="${escapeHtml(course.altCode || '')}" 
                         data-semester="${semNum}">
                        <div class="course-card-top">
                            <span class="course-card-code">${escapeHtml(course.code)}</span>
                            <span class="course-card-tag ${tagClass}">${tagLabel}</span>
                        </div>
                        <div class="course-card-title">${escapeHtml(course.name)}</div>
                        <div class="course-card-bottom">
                            <span class="course-card-credits">${course.credits} נק״ז</span>
                            ${isWhatIfMode && !completed ? `
                                <div class="course-card-whatif-wrap" title="ציון משוער בסימולטור">
                                    <span style="font-size: 0.68rem; color: #fde047;">ציון:</span>
                                    <input type="number" min="0" max="100" class="course-card-whatif-input" 
                                           data-code="${escapeHtml(course.code)}" 
                                           value="${whatIfGrades[course.code] !== undefined ? whatIfGrades[course.code] : defaultWhatIfGrade}">
                                </div>
                            ` : ''}
                            <div class="course-card-actions">
                                ${!completed && !prereqStatus.valid ? `
                                    <span class="prereq-warning-pill" title="דרישות קדם חסרות: ${escapeHtml(prereqStatus.missing.join(', '))}">
                                        ⚠️ קדם
                                    </span>
                                ` : ''}
                                ${canRemove ? `
                                    <button type="button" class="btn-card-remove" data-code="${escapeHtml(course.code)}" data-semester="${semNum}" title="הסר קורס זה מהתכנון והעבר לרשימת הקורסים שלא שובצו">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `);
            });

            chunks.push(`
                    </div>
                </div>
            `);
        });

        container.innerHTML = chunks.join('');
    }

    function renderRulesCard(rulesEval) {
        const updateRuleRow = (idPrefix, valText, isMet) => {
            const valEl = document.getElementById(`rule-val-${idPrefix}`);
            const statusEl = document.getElementById(`rule-status-${idPrefix}`);
            const rowEl = document.getElementById(`rule-row-${idPrefix}`);
            if (valEl) valEl.innerText = valText;
            if (statusEl) statusEl.innerText = isMet ? '✅' : '⏳';
            if (rowEl) rowEl.classList.toggle('rule-completed', isMet);
        };

        updateRuleRow('A', `${rulesEval.countA} / 1`, rulesEval.ruleA_met);
        updateRuleRow('B', `${rulesEval.countB} / 2`, rulesEval.ruleB_met);
        updateRuleRow('D', `${rulesEval.countD} / 1`, rulesEval.ruleD_met);
        updateRuleRow('C', `${rulesEval.countC} / 2`, rulesEval.ruleC_met);
        updateRuleRow('BCD', `${rulesEval.creditsBCD.toFixed(1)} / 14.0 נק״ז`, rulesEval.ruleBCD_met);
        updateRuleRow('total', `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5 נק״ז`, rulesEval.ruleTotalElectives_met);

        const summaryBadge = document.getElementById('planner-rules-summary-badge');
        if (summaryBadge) {
            summaryBadge.innerText = `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5 נק״ז ${rulesEval.ruleTotalElectives_met ? '✅' : '⏳'}`;
            summaryBadge.style.color = rulesEval.ruleTotalElectives_met ? '#10b981' : '#38bdf8';
        }
    }

    function renderAddElectivesSection(plan, courseSemMap) {
        // 1. Gather all course codes currently placed in plan
        const placedCodes = new Set();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                getNormalizedCodes(c.code, c.altCode).forEach(k => placedCodes.add(k));
            });
        });

        // 2. Compute "Ready For You" electives
        const readyContainer = document.getElementById('planner-ready-electives-list');
        const readyCourses = [];

        ['A', 'B', 'C', 'D', 'E'].forEach(cat => {
            (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                const keys = getNormalizedCodes(course.code, course.altCode);
                if (keys.some(k => placedCodes.has(k))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;

                const reqs = course.prereqs || [];
                const satisfied = reqs.every(req => {
                    const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[req];
                    const alt = prereqCourse ? prereqCourse.altCode : null;
                    const rKeys = getNormalizedCodes(req, alt);
                    return isCourseCompleted(req, alt) || rKeys.some(k => courseSemMap[k] !== undefined);
                });

                if (satisfied && reqs.length > 0) {
                    readyCourses.push(course);
                }
            });
        });

        if (readyContainer) {
            if (readyCourses.length === 0) {
                readyContainer.innerHTML = '<div style="font-size: 0.72rem; color: #94a3b8; padding: 4px;">קורסי החובה המשובצים עדיין אינם פותחים קורסי בחירה מתקדמים.</div>';
            } else {
                readyContainer.innerHTML = readyCourses.slice(0, 6).map(course => `
                    <div class="planner-pool-item" draggable="true" data-code="${escapeHtml(course.code)}" data-alt-code="${escapeHtml(course.altCode || '')}">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${escapeHtml(course.name)}</span>
                            <div class="pool-item-meta">
                                <span class="course-card-tag tag-list-${course.list}">רשימה ${course.list}׳</span>
                                <span>${course.credits} נק״ז</span>
                            </div>
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${escapeHtml(course.code)}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `).join('');
            }
        }

        // 3. Render Filtered Pool
        const poolContainer = document.getElementById('planner-available-electives-list');
        if (!poolContainer) return;

        const coursesToShow = [];
        const q = searchQuery.toLowerCase();

        const matchesSearch = (course) => {
            if (!q) return true;
            const matchName = (course.name || '').toLowerCase().includes(q);
            const matchCode = (course.code || '').includes(q) || (course.altCode && course.altCode.includes(q));
            return matchName || matchCode;
        };

        if (selectedCategory === 'UNASSIGNED') {
            (unassignedCourses || []).forEach(course => {
                const keys = getNormalizedCodes(course.code, course.altCode);
                if (keys.some(k => placedCodes.has(k))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;
                if (!matchesSearch(course)) return;
                coursesToShow.push({ ...course, isUnassignedItem: true });
            });
        } else {
            if (selectedCategory === 'ALL') {
                (unassignedCourses || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push({ ...course, isUnassignedItem: true });
                });
            }

            const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E'] : [selectedCategory];
            cats.forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push(course);
                });
            });
        }

        if (coursesToShow.length === 0) {
            const emptyMsg = selectedCategory === 'UNASSIGNED' 
                ? 'אין כרגע קורסים שלא שובצו. גרור קורסים מכל סמסטר לכאן כדי להסיר אותם מהתכנון.' 
                : 'לא נמצאו קורסי בחירה מתאימים לסינון.';
            poolContainer.innerHTML = `<div style="font-size: 0.76rem; color: #94a3b8; text-align: center; padding: 16px;">${emptyMsg}</div>`;
        } else {
            poolContainer.innerHTML = coursesToShow.map(course => {
                const tagClass = course.isUnassignedItem 
                    ? 'tag-mandatory' 
                    : (course.list ? `tag-list-${course.list}` : 'tag-mandatory');
                const tagLabel = course.isUnassignedItem 
                    ? 'שלא שובץ' 
                    : (course.list ? `רשימה ${course.list}׳` : 'חובה');

                return `
                    <div class="planner-pool-item" draggable="true" data-code="${escapeHtml(course.code)}" data-alt-code="${escapeHtml(course.altCode || '')}">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${escapeHtml(course.name)}</span>
                            <div class="pool-item-meta">
                                <span class="course-card-tag ${tagClass}">${tagLabel}</span>
                                <span>${escapeHtml(course.code)}</span>
                                <span>• ${course.credits} נק״ז</span>
                            </div>
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${escapeHtml(course.code)}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `;
            }).join('');
        }
    }

    // --------------------------------------------------------------------------
    // Event Delegation Architecture (Zero memory leaks, robust lifecycle)
    // --------------------------------------------------------------------------
    let isEventsBound = false;

    function bindDelegatedPlannerEvents() {
        if (isEventsBound) return;
        isEventsBound = true;

        const plannerTab = document.getElementById('planner-workspace');
        if (!plannerTab) return;

        // 1. Drag Start Delegation
        plannerTab.addEventListener('dragstart', (e) => {
            const card = e.target.closest('[draggable="true"]');
            if (!card) return;

            if (card.classList.contains('planner-course-card')) {
                const code = card.getAttribute('data-code');
                const sem = parseInt(card.getAttribute('data-semester'));
                activeDragPayload = {
                    type: 'semester-course',
                    code: code,
                    sourceSemester: sem
                };
            } else if (card.classList.contains('planner-pool-item')) {
                const code = card.getAttribute('data-code');
                activeDragPayload = {
                    type: 'pool-elective',
                    code: code
                };
            }

            e.dataTransfer.setData('text/plain', JSON.stringify(activeDragPayload));
            card.classList.add('dragging');
        });

        // 2. Drag End Delegation
        plannerTab.addEventListener('dragend', (e) => {
            const card = e.target.closest('[draggable="true"]');
            if (card) card.classList.remove('dragging');
            activeDragPayload = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // 3. Drag Over & Drag Leave Delegation
        plannerTab.addEventListener('dragover', (e) => {
            const dropZone = e.target.closest('.planner-course-list, .planner-sidebar, #planner-unassigned-dropzone');
            if (dropZone) {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            }
        });

        plannerTab.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.planner-course-list, .planner-sidebar, #planner-unassigned-dropzone');
            if (dropZone && !dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });

        // 4. Drop Delegation
        plannerTab.addEventListener('drop', (e) => {
            const semZone = e.target.closest('.planner-course-list');
            const sidebarZone = e.target.closest('.planner-sidebar, #planner-unassigned-dropzone');

            let payload = activeDragPayload;
            if (!payload) {
                try {
                    const raw = e.dataTransfer.getData('text/plain');
                    if (raw) payload = JSON.parse(raw);
                } catch (err) {
                    return;
                }
            }
            if (!payload) return;

            if (semZone) {
                e.preventDefault();
                e.stopPropagation();
                semZone.classList.remove('drag-over');
                const targetSemester = parseInt(semZone.getAttribute('data-semester'));
                handleCourseDrop(payload, targetSemester);
            } else if (sidebarZone && payload.type === 'semester-course') {
                e.preventDefault();
                e.stopPropagation();
                sidebarZone.classList.remove('drag-over');
                handleSidebarDrop(payload);
            }
        });

        // 5. Global Click Delegation inside Planner
        plannerTab.addEventListener('click', (e) => {
            // Mode buttons
            const modeBtn = e.target.closest('#btn-planner-mode-custom, #btn-planner-mode-suggested');
            if (modeBtn) {
                currentMode = modeBtn.id === 'btn-planner-mode-custom' ? 'custom' : 'suggested';
                renderDegreePlanner();
                return;
            }

            // Rules toggle collapse
            const rulesToggle = e.target.closest('#planner-rules-toggle');
            if (rulesToggle) {
                const body = document.getElementById('planner-rules-body');
                const icon = document.getElementById('planner-rules-toggle-icon');
                if (body) {
                    const isCollapsed = body.classList.toggle('collapsed');
                    body.style.display = isCollapsed ? 'none' : 'flex';
                    if (icon) icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
                }
                return;
            }

            // Add Semester Button
            const addSemBtn = e.target.closest('#btn-planner-add-semester');
            if (addSemBtn) {
                if (!customPlan) initPlannerState();
                const nextSemNum = customPlan.length + 1;
                customPlan.push({
                    semester: nextSemNum,
                    title: `סמסטר ${nextSemNum}`,
                    targetCredits: 18.0,
                    courses: []
                });
                currentMode = 'custom';
                saveCustomPlan();
                renderDegreePlanner();
                return;
            }

            // Reset to Suggested Button
            const resetBtn = e.target.closest('#btn-planner-reset-suggested');
            if (resetBtn) {
                if (confirm('האם אתה בטוח שברצונך לאפס את התוכנית לשיבוץ המומלץ הרשמי של הפקולטה?')) {
                    resetPlanToSuggested();
                    currentMode = 'custom';
                    renderDegreePlanner();
                }
                return;
            }

            // Manual Save Button
            const saveBtn = e.target.closest('#btn-planner-save');
            if (saveBtn) {
                saveCustomPlan(true);
                const oldHtml = saveBtn.innerHTML;
                saveBtn.innerHTML = '<span>✅ נשמר בהצלחה!</span>';
                saveBtn.style.background = '#059669';
                setTimeout(() => {
                    saveBtn.innerHTML = oldHtml;
                    saveBtn.style.background = '#10b981';
                }, 1500);
                return;
            }

            // Filter Pills
            const pill = e.target.closest('.planner-elective-filters .filter-pill');
            if (pill) {
                const filterPills = document.querySelectorAll('.planner-elective-filters .filter-pill');
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedCategory = pill.getAttribute('data-category');
                renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                return;
            }

            // Remove Course Click (✕ button)
            const removeBtn = e.target.closest('.btn-card-remove');
            if (removeBtn) {
                e.stopPropagation();
                const code = removeBtn.getAttribute('data-code');
                const semNum = parseInt(removeBtn.getAttribute('data-semester'));
                handleSidebarDrop({
                    type: 'semester-course',
                    code: code,
                    sourceSemester: semNum
                });
                return;
            }

            // Add to Plan Click (+ button)
            const addBtn = e.target.closest('.btn-add-to-plan');
            if (addBtn) {
                e.stopPropagation();
                const code = addBtn.getAttribute('data-code');
                promptAddCourseToSemester(code);
                return;
            }

            // What-If GPA Simulator Toggle
            const whatIfBtn = e.target.closest('#btn-planner-what-if');
            if (whatIfBtn) {
                isWhatIfMode = !isWhatIfMode;
                whatIfBtn.classList.toggle('active', isWhatIfMode);
                whatIfBtn.style.background = isWhatIfMode ? '#ca8a04' : '';
                whatIfBtn.style.color = isWhatIfMode ? '#ffffff' : '#fde047';
                renderWhatIfBanner();
                renderSemesterColumns(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                return;
            }

            // What-If Presets
            const presetBtn = e.target.closest('.btn-whatif-preset');
            if (presetBtn) {
                const preset = presetBtn.getAttribute('data-preset');
                if (preset === 'reset') {
                    whatIfGrades = {};
                    defaultWhatIfGrade = 85;
                } else {
                    const num = parseInt(preset, 10);
                    if (!isNaN(num)) {
                        defaultWhatIfGrade = num;
                        whatIfGrades = {};
                    }
                }
                renderWhatIfBanner();
                renderSemesterColumns(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                return;
            }

            // Export Plan Button
            const exportBtn = e.target.closest('#btn-planner-export');
            if (exportBtn) {
                promptExportPlan();
                return;
            }

            // Course card tap -> Mobile tap-to-move action sheet
            const card = e.target.closest('.planner-course-card, .planner-pool-item');
            if (card) {
                if (e.target.closest('.course-card-whatif-input, .btn-card-remove, .btn-add-to-plan')) return;

                const code = card.getAttribute('data-code');
                const altCode = card.getAttribute('data-alt-code');
                const semAttr = card.getAttribute('data-semester');
                const semNum = semAttr ? parseInt(semAttr, 10) : null;

                if (isCourseCompleted(code, altCode)) {
                    showPlannerToast('✓ קורס זה הושלם כבר בהצלחה - אינו ניתן להזזה.', false);
                    return;
                }

                openCourseActionSheet(code, semNum);
                return;
            }
        });

        // 6. What-If input live updates
        plannerTab.addEventListener('input', (e) => {
            const whatIfInput = e.target.closest('.course-card-whatif-input');
            if (whatIfInput) {
                const code = whatIfInput.getAttribute('data-code');
                const val = parseFloat(whatIfInput.value);
                if (!isNaN(val) && val >= 0 && val <= 100) {
                    whatIfGrades[code] = val;
                } else if (whatIfInput.value === '') {
                    delete whatIfGrades[code];
                }
                renderWhatIfBanner();
            }
        });

        // 6. Search Input Delegation (Debounced 150ms)
        const searchInput = document.getElementById('planner-elective-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    searchQuery = e.target.value.trim();
                    renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                }, 150);
            });
        }
    }

    // --------------------------------------------------------------------------
    // Course Placement & Rejection Engine
    // --------------------------------------------------------------------------
    
    // --------------------------------------------------------------------------
    // Mobile Tap-to-Move Action Sheet (Touch Ergonomics)
    // --------------------------------------------------------------------------
    function openCourseActionSheet(courseCode, currentSemester) {
        const overlay = document.getElementById('planner-action-sheet-overlay');
        const sheet = document.getElementById('planner-action-sheet');
        if (!overlay || !sheet) return;

        let course = null;
        const plan = getActivePlan();
        if (currentSemester) {
            const sem = plan.find(s => s.semester === currentSemester);
            if (sem) course = (sem.courses || []).find(c => c.code === courseCode);
        }
        if (!course) {
            course = unassignedCourses.find(c => c.code === courseCode) ||
                     (global.PLANNER_CATALOG ? global.PLANNER_CATALOG.ALL_COURSES_MAP[courseCode] : null);
        }
        if (!course) return;

        const currentLocText = currentSemester ? `משובץ בסמסטר ${currentSemester}` : `במאגר (לא משובץ)`;

        let semButtonsHtml = '';
        plan.forEach(s => {
            const semNum = s.semester;
            const isCurrent = semNum === currentSemester;
            semButtonsHtml += `
                <button type="button" class="sheet-sem-btn ${isCurrent ? 'current' : ''}" data-target-sem="${semNum}">
                    סמסטר ${semNum} ${isCurrent ? '📍' : ''}
                </button>
            `;
        });

        sheet.innerHTML = `
            <div class="sheet-handle-bar"></div>
            <div class="sheet-header-title">${escapeHtml(course.name)}</div>
            <div class="sheet-header-sub">
                <span>קוד: ${escapeHtml(course.code)}</span>
                <span>•</span>
                <span>${course.credits} נק״ז</span>
                <span>•</span>
                <span style="color: #38bdf8;">${currentLocText}</span>
            </div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">העבר לסמסטר:</div>
            <div class="sheet-semesters-grid">
                ${semButtonsHtml}
            </div>
            <div class="sheet-actions-row">
                ${currentSemester ? `
                    <button type="button" class="sheet-btn-remove" id="sheet-btn-remove-course">
                        🗑️ הסר מהתכנון (העבר למאגר)
                    </button>
                ` : ''}
                <button type="button" class="sheet-btn-cancel" id="sheet-btn-cancel">ביטול</button>
            </div>
        `;

        overlay.classList.add('active');

        const closeSheet = () => {
            overlay.classList.remove('active');
        };

        const cancelBtn = sheet.querySelector('#sheet-btn-cancel');
        if (cancelBtn) cancelBtn.onclick = closeSheet;

        overlay.onclick = (e) => {
            if (e.target === overlay) closeSheet();
        };

        const semBtns = sheet.querySelectorAll('.sheet-sem-btn');
        semBtns.forEach(btn => {
            btn.onclick = () => {
                const targetSem = parseInt(btn.getAttribute('data-target-sem'));
                closeSheet();
                if (targetSem === currentSemester) return;
                handleCourseDrop({
                    type: currentSemester ? 'semester-course' : 'pool-course',
                    code: courseCode,
                    sourceSemester: currentSemester
                }, targetSem);
            };
        });

        const removeBtn = sheet.querySelector('#sheet-btn-remove-course');
        if (removeBtn) {
            removeBtn.onclick = () => {
                closeSheet();
                handleSidebarDrop({
                    type: 'semester-course',
                    code: courseCode,
                    sourceSemester: currentSemester
                });
            };
        }
    }

    // --------------------------------------------------------------------------
    // Plan Export Engine (Image PNG & Clean Print)
    // --------------------------------------------------------------------------
    function promptExportPlan() {
        const overlay = document.getElementById('planner-export-modal-overlay');
        if (!overlay) return;
        overlay.classList.add('active');

        if (!overlay._isBound) {
            overlay._isBound = true;

            const btnPng = document.getElementById('btn-choice-export-png');
            const btnPdf = document.getElementById('btn-choice-export-pdf');
            const btnClose = document.getElementById('btn-close-export-modal');

            const closeExportModal = () => {
                overlay.classList.remove('active');
            };

            if (btnClose) btnClose.onclick = closeExportModal;
            overlay.onclick = (e) => {
                if (e.target === overlay) closeExportModal();
            };

            if (btnPng) {
                btnPng.onclick = () => {
                    closeExportModal();
                    exportPlanToCanvasPNG();
                };
            }

            if (btnPdf) {
                btnPdf.onclick = () => {
                    closeExportModal();
                    setTimeout(() => {
                        window.print();
                    }, 150);
                };
            }
        }
    }

    function exportPlanToCanvasPNG() {
        const plan = getActivePlan();
        if (!plan || plan.length === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Dark RPG Canvas Background
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Banner
        const grad = ctx.createLinearGradient(0, 0, 1920, 0);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1920, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🎓 טכניון - הפקולטה להנדסת מכונות | תוכנית לימודים לתואר ראשון', 1880, 50);

        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(new Date().toLocaleDateString('he-IL'), 40, 50);

        // 8 Semesters Grid (2 rows x 4 cols)
        const colWidth = 430;
        const colGap = 35;
        const startX = 40;
        const rowHeight = 440;
        const startY = 110;

        plan.slice(0, 8).forEach((sem, idx) => {
            const colIdx = idx % 4;
            const rowIdx = Math.floor(idx / 4);
            const x = startX + colIdx * (colWidth + colGap);
            const y = startY + rowIdx * (rowHeight + 40);

            ctx.fillStyle = '#111827';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, colWidth, rowHeight, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`סמסטר ${sem.semester || (idx + 1)}`, x + colWidth - 15, y + 30);

            let semCr = 0;
            (sem.courses || []).forEach(c => semCr += Number(c.credits) || 0);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${semCr.toFixed(1)} נק״ז`, x + 15, y + 30);

            let curY = y + 45;
            (sem.courses || []).slice(0, 7).forEach(c => {
                const completed = isCourseCompleted(c.code, c.altCode);
                ctx.fillStyle = completed ? 'rgba(16, 185, 129, 0.15)' : '#1e293b';
                ctx.strokeStyle = completed ? '#10b981' : '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(x + 10, curY, colWidth - 20, 48, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = completed ? '#34d399' : '#f8fafc';
                ctx.font = 'bold 13px Arial, sans-serif';
                ctx.textAlign = 'right';
                const courseName = c.name.length > 28 ? c.name.substring(0, 26) + '...' : c.name;
                ctx.fillText(courseName, x + colWidth - 20, curY + 22);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '12px Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`${c.code} • ${c.credits} נק״ז`, x + colWidth - 20, curY + 40);

                if (completed) {
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 12px Arial, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('✓ הושלם', x + 20, curY + 30);
                }

                curY += 54;
            });
        });

        const link = document.createElement('a');
        link.download = `Technion_ME_Degree_Plan_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showPlannerToast('✓ תמונת התוכנית נוצרה והורדה בהצלחה!', false);
    }

    function handleCourseDrop(data, targetSemester) {
        if (!customPlan) return;

        const targetSemObj = customPlan.find(s => s.semester === targetSemester);
        if (!targetSemObj) return;

        let courseObj = null;
        let sourceSemester = null;

        if (data.type === 'semester-course') {
            sourceSemester = data.sourceSemester;
            if (sourceSemester === targetSemester) return; // Same column, no-op

            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            if (!sourceSemObj) return;

            const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
                const keys = getNormalizedCodes(c.code, c.altCode);
                return keys.includes(data.code);
            });
            if (courseIdx === -1) return;
            courseObj = sourceSemObj.courses[courseIdx];

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן להזזה.`);
                return;
            }
        } else {
            const cKeys = new Set(getNormalizedCodes(data.code, data.code));
            courseObj = (unassignedCourses || []).find(c => {
                const uKeys = getNormalizedCodes(c.code, c.altCode);
                return uKeys.some(k => cKeys.has(k));
            }) || (global.PLANNER_CATALOG.ALL_COURSES_MAP && (global.PLANNER_CATALOG.ALL_COURSES_MAP[data.code] || global.PLANNER_CATALOG.ALL_COURSES_MAP[data.code.replace(/^0+/, '')]));

            if (!courseObj) return;

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן לשיבוץ חוזר.`);
                return;
            }

            // Check if already placed in plan
            const alreadyInPlan = customPlan.some(s => (s.courses || []).some(c => {
                const placedKeys = getNormalizedCodes(c.code, c.altCode);
                return placedKeys.some(k => cKeys.has(k));
            }));
            if (alreadyInPlan) return;
        }

        if (!courseObj) return;

        // Build temporary map excluding moving course
        const activeCourseMap = buildCourseSemesterMap(customPlan);
        if (sourceSemester !== null) {
            getNormalizedCodes(courseObj.code, courseObj.altCode).forEach(k => {
                delete activeCourseMap[k];
            });
        }

        // === STRICT PREREQUISITE VALIDATION ===
        const prereqStatus = checkPrerequisites(courseObj, targetSemester, activeCourseMap);
        if (!prereqStatus.valid) {
            highlightMissingPrerequisites(
                prereqStatus.missingCodes,
                `לא ניתן לשבץ את "${courseObj.name}" בסמסטר ${targetSemester}: חסרים קדמים בסמסטרים קודמים! (${prereqStatus.missing.join(', ')})`,
                targetSemester
            );
            return; // REJECT DROP!
        }

        // Apply placement
        if (data.type === 'semester-course') {
            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
                const keys = getNormalizedCodes(c.code, c.altCode);
                return keys.includes(data.code);
            });
            if (courseIdx !== -1) {
                const [moved] = sourceSemObj.courses.splice(courseIdx, 1);
                if (!targetSemObj.courses) targetSemObj.courses = [];
                targetSemObj.courses.push(moved);
            }
        } else {
            if (!targetSemObj.courses) targetSemObj.courses = [];
            targetSemObj.courses.push({ ...courseObj });
            const cKeys = new Set(getNormalizedCodes(data.code, data.code));
            unassignedCourses = unassignedCourses.filter(c => {
                const uKeys = getNormalizedCodes(c.code, c.altCode);
                return !uKeys.some(k => cKeys.has(k));
            });
        }

        saveCustomPlan();
        renderDegreePlanner();
    }

    function handleSidebarDrop(data) {
        if (!customPlan) return;
        if (data.type !== 'semester-course') return;

        const sourceSemester = data.sourceSemester;
        const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
        if (!sourceSemObj) return;

        const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
            const keys = getNormalizedCodes(c.code, c.altCode);
            return keys.includes(data.code);
        });
        if (courseIdx === -1) return;

        const course = sourceSemObj.courses[courseIdx];
        if (isCourseCompleted(course.code, course.altCode)) {
            showPlannerToast(`הקורס "${course.name}" כבר הושלם ואינו ניתן להסרה.`);
            return;
        }

        const [removedCourse] = sourceSemObj.courses.splice(courseIdx, 1);
        const remKeys = new Set(getNormalizedCodes(removedCourse.code, removedCourse.altCode));
        if (!unassignedCourses.some(c => {
            const uKeys = getNormalizedCodes(c.code, c.altCode);
            return uKeys.some(k => remKeys.has(k));
        })) {
            unassignedCourses.push(removedCourse);
        }

        saveCustomPlan();
        renderDegreePlanner();
        showPlannerToast(`הקורס "${removedCourse.name}" הוסר מהתכנון והועבר לרשימת הקורסים שלא שובצו.`);
    }

    // Interactive Non-Blocking Semester Selector Modal
    function promptAddCourseToSemester(code) {
        const cKeys = new Set(getNormalizedCodes(code, code));
        const course = (unassignedCourses || []).find(c => {
            const uKeys = getNormalizedCodes(c.code, c.altCode);
            return uKeys.some(k => cKeys.has(k));
        }) || (global.PLANNER_CATALOG.ALL_COURSES_MAP && (global.PLANNER_CATALOG.ALL_COURSES_MAP[code] || global.PLANNER_CATALOG.ALL_COURSES_MAP[code.replace(/^0+/, '')]));

        if (!course || !customPlan) return;

        // Check completion
        if (isCourseCompleted(course.code, course.altCode)) {
            showPlannerToast(`הקורס "${course.name}" כבר הושלם ואינו ניתן לשיבוץ חוזר.`);
            return;
        }

        const existingModal = document.getElementById('planner-sem-picker-modal');
        if (existingModal) existingModal.remove();

        const activeMap = buildCourseSemesterMap(customPlan);

        const modal = document.createElement('div');
        modal.id = 'planner-sem-picker-modal';
        modal.className = 'modal-backdrop active';
        modal.style.zIndex = '999999';

        const semButtons = customPlan.map(s => {
            const semNum = s.semester;
            const prereqCheck = checkPrerequisites(course, semNum, activeMap);
            const isValid = prereqCheck.valid;
            return `
                <button type="button" class="btn btn-outline sem-choice-btn" data-semester="${semNum}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; border-radius: 8px; border: 1px solid ${isValid ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; background: ${isValid ? 'rgba(15, 23, 42, 0.7)' : 'rgba(239, 68, 68, 0.08)'}; cursor: pointer; transition: all 0.15s ease;">
                    <span style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">סמסטר ${semNum}</span>
                    <span style="font-size: 0.72rem; color: ${isValid ? '#34d399' : '#f87171'}; margin-top: 4px;">${isValid ? '✓ זמין לשיבוץ' : '⚠️ קדמים חסרים'}</span>
                </button>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 480px; width: 90%; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <h3 style="font-size: 1.05rem; color: #f8fafc; margin: 0;">שיבוץ קורס: ${escapeHtml(course.name)}</h3>
                    <button type="button" class="btn-close-picker" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
                </div>
                <p style="font-size: 0.80rem; color: #cbd5e1; margin-bottom: 14px; line-height: 1.4;">
                    בחר את הסמסטר הרצוי לשיבוץ הקורס (${course.credits} נק״ז):
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                    ${semButtons}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary btn-close-picker">ביטול</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelectorAll('.btn-close-picker').forEach(b => b.addEventListener('click', closeModal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.querySelectorAll('.sem-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const chosenSem = parseInt(btn.getAttribute('data-semester'));
                closeModal();
                handleCourseDrop({ type: 'pool-elective', code: course.code }, chosenSem);
            });
        });
    }

    // --------------------------------------------------------------------------
    // Public API
    // --------------------------------------------------------------------------
    global.DegreePlanner = {
        init: initPlannerState,
        renderDegreePlanner: renderDegreePlanner,
        evaluateDegreeRules: evaluateDegreeRules,
        getCustomPlan: () => customPlan,
        getUnassignedCourses: () => unassignedCourses,
        resetPlanToSuggested: resetPlanToSuggested,
        checkPrerequisites: checkPrerequisites,
        isCourseCompleted: isCourseCompleted,
        getCourseGrade: getCourseGrade,
        syncFromGameState: () => {
            syncCompletedCoursesFromGameState();
            renderDegreePlanner();
        }
    };

    // Auto initialize events on DOM load
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initPlannerState();
                bindDelegatedPlannerEvents();
            });
        } else {
            initPlannerState();
            bindDelegatedPlannerEvents();
        }
    }

})(typeof window !== 'undefined' ? window : global);
