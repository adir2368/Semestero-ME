// ==========================================================================
// Degree Planner Module (תכנון תואר אקדמי - גרור ושחרר קורסים וחוקי בחירה)
// Atlas ME - Technion Faculty of Mechanical Engineering
// ==========================================================================

(function(global) {
    'use strict';

    let currentMode = 'custom'; // 'custom' | 'suggested'
    let selectedCategory = 'ALL'; // 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'UNASSIGNED'
    let searchQuery = '';
    let customPlan = null;
    let unassignedCourses = [];

    // Local Storage Keys
    const PLANNER_STORAGE_KEY_V2 = 'atlas_me_custom_degree_plan_v2';
    const PLANNER_STORAGE_KEY_V1 = 'atlas_me_custom_degree_plan_v1';

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

        // If still no saved plan, initialize with suggested syllabus
        if (!customPlan || !Array.isArray(customPlan) || customPlan.length === 0) {
            resetPlanToSuggested();
        }

        // Clean user exemptions / removed courses:
        // Ensure courses in unassignedCourses do not appear inside semester columns
        if (unassignedCourses && unassignedCourses.length > 0) {
            const unassignedCodes = new Set();
            unassignedCourses.forEach(c => {
                unassignedCodes.add(c.code);
                if (c.altCode) unassignedCodes.add(c.altCode);
            });
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(c => !unassignedCodes.has(c.code) && !(c.altCode && unassignedCodes.has(c.altCode)));
            });
        }
    }

    function resetPlanToSuggested() {
        if (!global.PLANNER_CATALOG) return;
        customPlan = JSON.parse(JSON.stringify(global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS));
        unassignedCourses = [];
        saveCustomPlan();
    }

    function saveCustomPlan() {
        if (!customPlan) return;
        try {
            const dataToSave = {
                semesters: customPlan,
                unassigned: unassignedCourses
            };
            localStorage.setItem(PLANNER_STORAGE_KEY_V2, JSON.stringify(dataToSave));
            // Backwards-compatible legacy key
            localStorage.setItem(PLANNER_STORAGE_KEY_V1, JSON.stringify(customPlan));

            if (global.gameState) {
                global.gameState.degreePlan = customPlan;
                global.gameState.degreePlanUnassigned = unassignedCourses;
            }
        } catch (e) {
            console.error('[Planner] Failed to save plan:', e);
        }
    }

    function getActivePlan() {
        if (currentMode === 'suggested') {
            return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS;
        }
        return customPlan || global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS;
    }

    // --------------------------------------------------------------------------
    // Helpers: Course Completion & Semester Mapping
    // --------------------------------------------------------------------------
    function isCourseCompleted(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return false;
        const c1 = global.gameState.courses[code];
        const c2 = altCode ? global.gameState.courses[altCode] : null;
        const check = (c) => {
            if (!c) return false;
            if (c.status === 'mastered') return true;
            if (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS') return true;
            if (c.grade !== undefined && c.grade !== null && c.grade !== '' && Number(c.grade) >= 55) return true;
            return false;
        };
        return check(c1) || check(c2);
    }

    function getCourseGrade(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return null;
        const c1 = global.gameState.courses[code];
        const c2 = altCode ? global.gameState.courses[altCode] : null;
        const c = c1 || c2;
        if (!c) return null;
        if (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS') return 'עובר';
        if (c.grade !== undefined && c.grade !== null && c.grade !== '') return String(c.grade);
        return null;
    }

    function buildCourseSemesterMap(plan) {
        const map = {};
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                map[c.code] = sem.semester;
                if (c.altCode) map[c.altCode] = sem.semester;
            });
        });
        return map;
    }

    // --------------------------------------------------------------------------
    // Prerequisite Engine & Visual Highlighting
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

            // Check 1: Already completed in gameState
            if (isCourseCompleted(prereqCode, alt)) {
                return; // Prereq satisfied!
            }

            // Check 2: Planned in a semester strictly earlier than semesterNum
            let pSem = courseSemMap[prereqCode];
            if (pSem === undefined && alt) pSem = courseSemMap[alt];

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

    function highlightMissingPrerequisites(missingCodes, reasonMsg) {
        showPlannerToast(reasonMsg);

        const highlightedEls = [];
        missingCodes.forEach(code => {
            const els = document.querySelectorAll(`[data-code="${code}"]`);
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
        }, 3500);
    }

    function showPlannerToast(message) {
        let toast = document.getElementById('planner-active-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'planner-active-toast';
            toast.className = 'planner-toast-alert';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<span>⚠️ ${message}</span>`;
        toast.style.display = 'flex';

        if (toast._timer) clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            if (toast) toast.style.display = 'none';
        }, 4500);
    }

    // Evaluate degree rules
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

    // Render the complete Degree Planner view
    function renderDegreePlanner() {
        initPlannerState();
        if (!global.PLANNER_CATALOG) return;

        const plan = getActivePlan();
        const courseSemMap = buildCourseSemesterMap(plan);
        const rulesEval = evaluateDegreeRules(plan);

        renderHeaderStats(rulesEval);
        renderSemesterColumns(plan, courseSemMap);
        renderRulesCard(rulesEval);
        renderAddElectivesSection(plan, courseSemMap);
        bindPlannerEvents();
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

        // Update active mode buttons
        const btnCustom = document.getElementById('btn-planner-mode-custom');
        const btnSuggested = document.getElementById('btn-planner-mode-suggested');
        if (btnCustom) btnCustom.classList.toggle('active', currentMode === 'custom');
        if (btnSuggested) btnSuggested.classList.toggle('active', currentMode === 'suggested');
    }

    function renderSemesterColumns(plan, courseSemMap) {
        const container = document.getElementById('planner-semesters-container');
        if (!container) return;

        let html = '';
        plan.forEach((sem, idx) => {
            const semNum = sem.semester || (idx + 1);
            let semCredits = 0;
            (sem.courses || []).forEach(c => { semCredits += Number(c.credits) || 0; });

            html += `
                <div class="planner-semester-col" data-semester="${semNum}">
                    <div class="semester-col-header">
                        <span class="semester-col-title">סמסטר ${semNum}</span>
                        <span class="semester-col-credits">${semCredits.toFixed(1)} נק״ז</span>
                    </div>
                    <div class="planner-course-list" data-semester="${semNum}">
            `;

            (sem.courses || []).forEach(course => {
                const completed = isCourseCompleted(course.code, course.altCode);
                const grade = getCourseGrade(course.code, course.altCode);
                const prereqStatus = checkPrerequisites(course, semNum, courseSemMap);

                const tagClass = completed ? 'tag-completed' : (course.list ? `tag-list-${course.list}` : (course.type ? `tag-${course.type}` : 'tag-mandatory'));
                const tagLabel = completed ? (grade ? `✓ הושלם [${grade}]` : '✓ הושלם') : (course.list ? `בחירה ${course.list}׳` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה'));

                const canDrag = currentMode === 'custom' && !completed;
                const canRemove = currentMode === 'custom' && !completed;

                html += `
                    <div class="planner-course-card ${completed ? 'course-card-completed' : ''}" 
                         draggable="${canDrag ? 'true' : 'false'}" 
                         data-code="${course.code}" 
                         data-semester="${semNum}">
                        <div class="course-card-top">
                            <span class="course-card-code">${course.code}</span>
                            <span class="course-card-tag ${tagClass}">${tagLabel}</span>
                        </div>
                        <div class="course-card-title">${course.name}</div>
                        <div class="course-card-bottom">
                            <span class="course-card-credits">${course.credits} נק״ז</span>
                            <div class="course-card-actions">
                                ${!completed && !prereqStatus.valid ? `
                                    <span class="prereq-warning-pill" title="דרישות קדם חסרות: ${prereqStatus.missing.join(', ')}">
                                        ⚠️ קדם
                                    </span>
                                ` : ''}
                                ${canRemove ? `
                                    <button type="button" class="btn-card-remove" data-code="${course.code}" data-semester="${semNum}" title="הסר קורס זה מהתכנון והעבר לרשימת הקורסים שלא שובצו">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        setupDragAndDrop();
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
    }

    function renderAddElectivesSection(plan, courseSemMap) {
        // 1. Gather all course codes currently placed in plan
        const placedCodes = new Set();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                placedCodes.add(c.code);
                if (c.altCode) placedCodes.add(c.altCode);
            });
        });

        // 2. Compute "Ready For You" (electives whose prereqs are satisfied, and not yet placed or completed)
        const readyContainer = document.getElementById('planner-ready-electives-list');
        const readyCourses = [];

        ['A', 'B', 'C', 'D', 'E'].forEach(cat => {
            (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;

                const reqs = course.prereqs || [];
                const satisfied = reqs.every(req => {
                    const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[req];
                    const alt = prereqCourse ? prereqCourse.altCode : null;
                    return isCourseCompleted(req, alt) || courseSemMap[req] !== undefined || (alt && courseSemMap[alt] !== undefined);
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
                    <div class="planner-pool-item" draggable="true" data-code="${course.code}">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${course.name}</span>
                            <div class="pool-item-meta">
                                <span class="course-card-tag tag-list-${course.list}">רשימה ${course.list}׳</span>
                                <span>${course.credits} נק״ז</span>
                            </div>
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${course.code}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `).join('');
            }
        }

        // 3. Render Available Pool based on filter & search
        const poolContainer = document.getElementById('planner-available-electives-list');
        if (!poolContainer) return;

        let coursesToShow = [];

        if (selectedCategory === 'UNASSIGNED') {
            // Show only unassigned courses that are not placed in plan
            (unassignedCourses || []).forEach(course => {
                if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchName = (course.name || '').toLowerCase().includes(q);
                    const matchCode = (course.code || '').includes(q) || (course.altCode && course.altCode.includes(q));
                    if (!matchName && !matchCode) return;
                }
                coursesToShow.push(Object.assign({}, course, { isUnassignedItem: true }));
            });
        } else {
            // First, if ALL, include any unassigned courses
            if (selectedCategory === 'ALL') {
                (unassignedCourses || []).forEach(course => {
                    if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        const matchName = (course.name || '').toLowerCase().includes(q);
                        const matchCode = (course.code || '').includes(q) || (course.altCode && course.altCode.includes(q));
                        if (!matchName && !matchCode) return;
                    }
                    coursesToShow.push(Object.assign({}, course, { isUnassignedItem: true }));
                });
            }

            const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E'] : [selectedCategory];
            cats.forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                    if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        const matchName = (course.name || '').toLowerCase().includes(q);
                        const matchCode = (course.code || '').includes(q) || (course.altCode && course.altCode.includes(q));
                        if (!matchName && !matchCode) return;
                    }
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
                    <div class="planner-pool-item" draggable="true" data-code="${course.code}">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${course.name}</span>
                            <div class="pool-item-meta">
                                <span class="course-card-tag ${tagClass}">${tagLabel}</span>
                                <span>${course.code}</span>
                                <span>• ${course.credits} נק״ז</span>
                            </div>
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${course.code}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `;
            }).join('');
        }
    }

    // --------------------------------------------------------------------------
    // Drag & Drop Engine (With Prerequisite Blocking & Sidebar Drop Zone)
    // --------------------------------------------------------------------------
    function setupDragAndDrop() {
        if (currentMode !== 'custom') return;

        // 1. Draggable cards inside semesters (only non-completed!)
        const semesterCards = document.querySelectorAll('.planner-course-card[draggable="true"]');
        semesterCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                const code = card.getAttribute('data-code');
                const sem = card.getAttribute('data-semester');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'semester-course',
                    code: code,
                    sourceSemester: parseInt(sem)
                }));
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        // 2. Draggable cards in electives & unassigned pool
        const poolItems = document.querySelectorAll('.planner-pool-item[draggable="true"]');
        poolItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const code = item.getAttribute('data-code');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'pool-elective',
                    code: code
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        // 3. Drop zones on semester lists (Adds / Moves course)
        const semesterDropZones = document.querySelectorAll('.planner-course-list');
        semesterDropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');

                const rawData = e.dataTransfer.getData('text/plain');
                if (!rawData) return;

                let data;
                try { data = JSON.parse(rawData); } catch (err) { return; }

                const targetSemester = parseInt(zone.getAttribute('data-semester'));
                handleCourseDrop(data, targetSemester);
            });
        });

        // 4. Drop zones on Sidebar / Unassigned Banner (Removes course to pool)
        const sidebarDropTargets = [
            document.getElementById('planner-unassigned-dropzone'),
            document.getElementById('planner-available-electives-list'),
            document.querySelector('.planner-sidebar')
        ].filter(Boolean);

        sidebarDropTargets.forEach(target => {
            if (target._boundDrop) return;
            target._boundDrop = true;

            target.addEventListener('dragover', (e) => {
                e.preventDefault();
                target.classList.add('drag-over');
            });

            target.addEventListener('dragleave', () => {
                target.classList.remove('drag-over');
            });

            target.addEventListener('drop', (e) => {
                e.preventDefault();
                target.classList.remove('drag-over');

                const rawData = e.dataTransfer.getData('text/plain');
                if (!rawData) return;

                let data;
                try { data = JSON.parse(rawData); } catch (err) { return; }

                handleSidebarDrop(data);
            });
        });
    }

    // Handle course placement into a semester (Strict prerequisite enforcement!)
    function handleCourseDrop(data, targetSemester) {
        if (!customPlan) return;

        const targetSemObj = customPlan.find(s => s.semester === targetSemester);
        if (!targetSemObj) return;

        let courseObj = null;
        let sourceSemester = null;

        if (data.type === 'semester-course') {
            sourceSemester = data.sourceSemester;
            if (sourceSemester === targetSemester) return; // Same semester

            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            if (!sourceSemObj) return;

            const courseIdx = (sourceSemObj.courses || []).findIndex(c => c.code === data.code || c.altCode === data.code);
            if (courseIdx === -1) return;
            courseObj = sourceSemObj.courses[courseIdx];

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן להזזה.`);
                return;
            }

        } else if (data.type === 'pool-elective' || data.type === 'unassigned-course') {
            courseObj = (unassignedCourses || []).find(c => c.code === data.code || c.altCode === data.code)
                        || (global.PLANNER_CATALOG.ALL_COURSES_MAP && global.PLANNER_CATALOG.ALL_COURSES_MAP[data.code]);
            if (!courseObj) return;

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן לשיבוץ חוזר.`);
                return;
            }

            // Check if already placed
            const alreadyInPlan = customPlan.some(s => (s.courses || []).some(c => c.code === data.code || c.altCode === data.code));
            if (alreadyInPlan) return;
        }

        if (!courseObj) return;

        // Build temporary course-to-semester map without the moving course
        const activeCourseMap = buildCourseSemesterMap(customPlan);
        if (sourceSemester !== null) {
            delete activeCourseMap[courseObj.code];
            if (courseObj.altCode) delete activeCourseMap[courseObj.altCode];
        }

        // === STRICT PREREQUISITE VALIDATION ===
        const prereqStatus = checkPrerequisites(courseObj, targetSemester, activeCourseMap);
        if (!prereqStatus.valid) {
            highlightMissingPrerequisites(
                prereqStatus.missingCodes,
                `לא ניתן לשבץ את "${courseObj.name}" בסמסטר ${targetSemester}: חסרים קדמים בסמסטרים קודמים! (${prereqStatus.missing.join(', ')})`
            );
            return; // REJECT PLACEMENT!
        }

        // Prerequisite passed: proceed with placement
        if (data.type === 'semester-course') {
            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            const courseIdx = (sourceSemObj.courses || []).findIndex(c => c.code === data.code || c.altCode === data.code);
            if (courseIdx !== -1) {
                const [moved] = sourceSemObj.courses.splice(courseIdx, 1);
                if (!targetSemObj.courses) targetSemObj.courses = [];
                targetSemObj.courses.push(moved);
            }
        } else {
            if (!targetSemObj.courses) targetSemObj.courses = [];
            targetSemObj.courses.push(JSON.parse(JSON.stringify(courseObj)));
            unassignedCourses = unassignedCourses.filter(c => c.code !== data.code && c.altCode !== data.code);
        }

        saveCustomPlan();
        renderDegreePlanner();
    }

    // Handle course removal to the sidebar / unassigned pool
    function handleSidebarDrop(data) {
        if (!customPlan) return;
        if (data.type !== 'semester-course') return;

        const sourceSemester = data.sourceSemester;
        const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
        if (!sourceSemObj) return;

        const courseIdx = (sourceSemObj.courses || []).findIndex(c => c.code === data.code || c.altCode === data.code);
        if (courseIdx === -1) return;

        const course = sourceSemObj.courses[courseIdx];
        if (isCourseCompleted(course.code, course.altCode)) {
            showPlannerToast(`הקורס "${course.name}" כבר הושלם ואינו ניתן להסרה.`);
            return;
        }

        const [removedCourse] = sourceSemObj.courses.splice(courseIdx, 1);
        if (!unassignedCourses.some(c => c.code === removedCourse.code || (removedCourse.altCode && c.code === removedCourse.altCode))) {
            unassignedCourses.push(removedCourse);
        }

        saveCustomPlan();
        renderDegreePlanner();
        showPlannerToast(`הקורס "${removedCourse.name}" הוסר מהתכנון והועבר לרשימת הקורסים שלא שובצו.`);
    }

    // --------------------------------------------------------------------------
    // Event Listeners for Controls
    // --------------------------------------------------------------------------
    function bindPlannerEvents() {
        // Mode Switchers
        const btnCustom = document.getElementById('btn-planner-mode-custom');
        const btnSuggested = document.getElementById('btn-planner-mode-suggested');

        if (btnCustom && !btnCustom._bound) {
            btnCustom._bound = true;
            btnCustom.addEventListener('click', () => {
                currentMode = 'custom';
                renderDegreePlanner();
            });
        }

        if (btnSuggested && !btnSuggested._bound) {
            btnSuggested._bound = true;
            btnSuggested.addEventListener('click', () => {
                currentMode = 'suggested';
                renderDegreePlanner();
            });
        }

        // Add Semester Button
        const btnAddSemester = document.getElementById('btn-planner-add-semester');
        if (btnAddSemester && !btnAddSemester._bound) {
            btnAddSemester._bound = true;
            btnAddSemester.addEventListener('click', () => {
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
            });
        }

        // Reset to Suggested Button
        const btnReset = document.getElementById('btn-planner-reset-suggested');
        if (btnReset && !btnReset._bound) {
            btnReset._bound = true;
            btnReset.addEventListener('click', () => {
                if (confirm('האם אתה בטוח שברצונך לאפס את התוכנית לשיבוץ המומלץ הרשמי של הפקולטה?')) {
                    resetPlanToSuggested();
                    currentMode = 'custom';
                    renderDegreePlanner();
                }
            });
        }

        // Master Save Button
        const btnSave = document.getElementById('btn-planner-save');
        if (btnSave && !btnSave._bound) {
            btnSave._bound = true;
            btnSave.addEventListener('click', () => {
                saveCustomPlan();
                const oldHtml = btnSave.innerHTML;
                btnSave.innerHTML = '<span>✅ נשמר בהצלחה!</span>';
                btnSave.style.background = '#059669';
                setTimeout(() => {
                    btnSave.innerHTML = oldHtml;
                    btnSave.style.background = '#10b981';
                }, 1500);
            });
        }

        // Filter Pills (ALL, A, B, C, D, E, UNASSIGNED)
        const filterPills = document.querySelectorAll('.planner-elective-filters .filter-pill');
        filterPills.forEach(pill => {
            if (!pill._bound) {
                pill._bound = true;
                pill.addEventListener('click', () => {
                    filterPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    selectedCategory = pill.getAttribute('data-category');
                    renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                    setupDragAndDrop();
                });
            }
        });

        // Search Input
        const searchInput = document.getElementById('planner-elective-search-input');
        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                setupDragAndDrop();
            });
        }

        // Remove Course Click (✕ button on cards)
        const container = document.getElementById('planner-semesters-container');
        if (container && !container._boundRemove) {
            container._boundRemove = true;
            container.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.btn-card-remove');
                if (!removeBtn) return;
                const code = removeBtn.getAttribute('data-code');
                const semNum = parseInt(removeBtn.getAttribute('data-semester'));

                if (!customPlan) return;
                const semObj = customPlan.find(s => s.semester === semNum);
                if (!semObj) return;

                const idx = (semObj.courses || []).findIndex(c => c.code === code || c.altCode === code);
                if (idx !== -1) {
                    const [removed] = semObj.courses.splice(idx, 1);
                    if (!unassignedCourses.some(c => c.code === removed.code || (removed.altCode && c.code === removed.altCode))) {
                        unassignedCourses.push(removed);
                    }
                    saveCustomPlan();
                    renderDegreePlanner();
                    showPlannerToast(`הקורס "${removed.name}" הוסר מהתכנון והועבר לרשימת הקורסים שלא שובצו.`);
                }
            });
        }

        // Add from sidebar click (+)
        const sidebar = document.querySelector('.planner-sidebar');
        if (sidebar && !sidebar._boundAdd) {
            sidebar._boundAdd = true;
            sidebar.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.btn-add-to-plan');
                if (!addBtn) return;
                const code = addBtn.getAttribute('data-code');
                const course = (unassignedCourses || []).find(c => c.code === code || c.altCode === code)
                               || (global.PLANNER_CATALOG.ALL_COURSES_MAP && global.PLANNER_CATALOG.ALL_COURSES_MAP[code]);
                if (!course || !customPlan) return;

                const semChoices = customPlan.map(s => s.semester).join(', ');
                const chosen = prompt(`לאיזה סמסטר תרצה להוסיף את "${course.name}"?\n(סמסטרים קיימים: ${semChoices})`, '6');
                if (!chosen) return;

                const targetSem = parseInt(chosen);
                const targetObj = customPlan.find(s => s.semester === targetSem);
                if (!targetObj) {
                    alert('סמסטר לא נמצא');
                    return;
                }

                // Check prerequisites
                const courseSemMap = buildCourseSemesterMap(customPlan);
                const prereqStatus = checkPrerequisites(course, targetSem, courseSemMap);
                if (!prereqStatus.valid) {
                    highlightMissingPrerequisites(
                        prereqStatus.missingCodes,
                        `לא ניתן לשבץ את "${course.name}" בסמסטר ${targetSem}: חסרים קדמים בסמסטרים קודמים! (${prereqStatus.missing.join(', ')})`
                    );
                    return;
                }

                if (!targetObj.courses) targetObj.courses = [];
                targetObj.courses.push(JSON.parse(JSON.stringify(course)));
                unassignedCourses = unassignedCourses.filter(c => c.code !== code && c.altCode !== code);

                saveCustomPlan();
                renderDegreePlanner();
            });
        }
    }

    // --------------------------------------------------------------------------
    // Public API
    // --------------------------------------------------------------------------
    global.DegreePlanner = {
        renderDegreePlanner: renderDegreePlanner,
        evaluateDegreeRules: evaluateDegreeRules,
        getCustomPlan: () => customPlan,
        getUnassignedCourses: () => unassignedCourses,
        resetPlanToSuggested: resetPlanToSuggested,
        checkPrerequisites: checkPrerequisites,
        isCourseCompleted: isCourseCompleted
    };

})(typeof window !== 'undefined' ? window : global);
