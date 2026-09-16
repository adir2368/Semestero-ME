// ==========================================================================
// Degree Planner Module (תכנון תואר אקדמי - גרור ושחרר קורסים וחוקי בחירה)
// Atlas ME - Technion Faculty of Mechanical Engineering
// ==========================================================================

(function(global) {
    'use strict';

    let currentMode = 'custom'; // 'custom' | 'suggested'
    let selectedCategory = 'ALL';
    let searchQuery = '';
    let customPlan = null;

    // Local Storage Key
    const PLANNER_STORAGE_KEY = 'atlas_me_custom_degree_plan_v1';

    function initPlannerState() {
        if (customPlan && Array.isArray(customPlan) && customPlan.length > 0) {
            return;
        }

        if (!global.PLANNER_CATALOG) {
            console.warn('[Planner] PLANNER_CATALOG not loaded yet');
            return;
        }

        // Try to load saved plan from localStorage
        try {
            const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
            if (saved) {
                customPlan = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[Planner] Error parsing saved plan:', e);
        }

        // If no saved plan, initialize with deep copy of SUGGESTED_MANDATORY_SYLLABUS
        if (!customPlan || !Array.isArray(customPlan) || customPlan.length === 0) {
            resetPlanToSuggested();
        }
    }

    function resetPlanToSuggested() {
        if (!global.PLANNER_CATALOG) return;
        customPlan = JSON.parse(JSON.stringify(global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS));
        saveCustomPlan();
    }

    function saveCustomPlan() {
        if (!customPlan) return;
        try {
            localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(customPlan));
            // Sync with global gameState if present
            if (global.gameState) {
                global.gameState.degreePlan = customPlan;
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

    // Build a map of course code -> semester number for the active plan
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

    // Check prerequisites for a specific course in a specific semester
    function checkPrerequisites(course, semesterNum, courseSemMap) {
        if (!course.prereqs || course.prereqs.length === 0) {
            return { valid: true, missing: [] };
        }

        const missing = [];
        course.prereqs.forEach(prereqCode => {
            const prereqSem = courseSemMap[prereqCode];
            if (prereqSem === undefined) {
                // Not planned at all
                const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[prereqCode];
                const name = prereqCourse ? prereqCourse.name : prereqCode;
                missing.push(`${name} (לא משובץ)`);
            } else if (prereqSem >= semesterNum) {
                // Planned in same or later semester
                const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[prereqCode];
                const name = prereqCourse ? prereqCourse.name : prereqCode;
                missing.push(`${name} (בסמסטר ${prereqSem})`);
            }
        });

        return {
            valid: missing.length === 0,
            missing: missing
        };
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
                const prereqStatus = checkPrerequisites(course, semNum, courseSemMap);
                const tagClass = course.list ? `tag-list-${course.list}` : (course.type ? `tag-${course.type}` : 'tag-mandatory');
                const tagLabel = course.list ? `בחירה ${course.list}׳` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה');
                const isElective = !!course.list;

                html += `
                    <div class="planner-course-card" 
                         draggable="${currentMode === 'custom' ? 'true' : 'false'}" 
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
                                ${!prereqStatus.valid ? `
                                    <span class="prereq-warning-pill" title="דרישות קדם חסרות: ${prereqStatus.missing.join(', ')}">
                                        ⚠️ קדם
                                    </span>
                                ` : ''}
                                ${isElective && currentMode === 'custom' ? `
                                    <button type="button" class="btn-card-remove" data-code="${course.code}" data-semester="${semNum}" title="הסר קורס בחירה זה מתוכנית הלימודים">
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
        // 1. Gather all electives currently placed in plan
        const placedCodes = new Set();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                placedCodes.add(c.code);
                if (c.altCode) placedCodes.add(c.altCode);
            });
        });

        // 2. Compute "Ready For You" (electives whose prereqs are completely met in the plan)
        const readyContainer = document.getElementById('planner-ready-electives-list');
        const readyCourses = [];

        ['A', 'B', 'C', 'D', 'E'].forEach(cat => {
            (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;

                // Check if prerequisites are satisfied
                const reqs = course.prereqs || [];
                const satisfied = reqs.every(req => courseSemMap[req] !== undefined);
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
                        <button type="button" class="btn-add-to-plan" data-code="${course.code}" title="הוסף לסמסטר 6">+</button>
                    </div>
                `).join('');
            }
        }

        // 3. Render Available Electives Pool based on filter & search
        const poolContainer = document.getElementById('planner-available-electives-list');
        if (!poolContainer) return;

        let electivesToShow = [];
        const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E'] : [selectedCategory];

        cats.forEach(cat => {
            (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                if (placedCodes.has(course.code) || (course.altCode && placedCodes.has(course.altCode))) return;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchName = course.name.toLowerCase().includes(q);
                    const matchCode = course.code.includes(q) || (course.altCode && course.altCode.includes(q));
                    if (!matchName && !matchCode) return;
                }
                electivesToShow.push(course);
            });
        });

        if (electivesToShow.length === 0) {
            poolContainer.innerHTML = '<div style="font-size: 0.76rem; color: #94a3b8; text-align: center; padding: 16px;">לא נמצאו קורסי בחירה מתאימים לסינון.</div>';
        } else {
            poolContainer.innerHTML = electivesToShow.map(course => `
                <div class="planner-pool-item" draggable="true" data-code="${course.code}">
                    <div class="pool-item-info">
                        <span class="pool-item-title">${course.name}</span>
                        <div class="pool-item-meta">
                            <span class="course-card-tag tag-list-${course.list}">רשימה ${course.list}׳</span>
                            <span>${course.code}</span>
                            <span>• ${course.credits} נק״ז</span>
                        </div>
                    </div>
                    <button type="button" class="btn-add-to-plan" data-code="${course.code}" title="הוסף קורס זה">+</button>
                </div>
            `).join('');
        }
    }

    // ==========================================================================
    // Drag & Drop Handling
    // ==========================================================================
    function setupDragAndDrop() {
        if (currentMode !== 'custom') return;

        // 1. Draggable cards inside semesters
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

        // 2. Draggable cards in electives pool
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

        // 3. Drop zones on semester lists
        const dropZones = document.querySelectorAll('.planner-course-list');
        dropZones.forEach(zone => {
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
                try {
                    data = JSON.parse(rawData);
                } catch (err) {
                    return;
                }

                const targetSemester = parseInt(zone.getAttribute('data-semester'));
                handleCourseDrop(data, targetSemester);
            });
        });
    }

    function handleCourseDrop(data, targetSemester) {
        if (!customPlan) return;

        const targetSemObj = customPlan.find(s => s.semester === targetSemester);
        if (!targetSemObj) return;

        if (data.type === 'semester-course') {
            const sourceSemester = data.sourceSemester;
            if (sourceSemester === targetSemester) return; // Same semester, no move

            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            if (!sourceSemObj) return;

            const courseIdx = (sourceSemObj.courses || []).findIndex(c => c.code === data.code || c.altCode === data.code);
            if (courseIdx === -1) return;

            const [course] = sourceSemObj.courses.splice(courseIdx, 1);
            if (!targetSemObj.courses) targetSemObj.courses = [];
            targetSemObj.courses.push(course);

            saveCustomPlan();
            renderDegreePlanner();

        } else if (data.type === 'pool-elective') {
            const course = global.PLANNER_CATALOG.ALL_COURSES_MAP[data.code];
            if (!course) return;

            // Check if already in any semester
            const alreadyInPlan = customPlan.some(s => (s.courses || []).some(c => c.code === data.code || c.altCode === data.code));
            if (alreadyInPlan) return;

            if (!targetSemObj.courses) targetSemObj.courses = [];
            targetSemObj.courses.push(JSON.parse(JSON.stringify(course)));

            saveCustomPlan();
            renderDegreePlanner();
        }
    }

    // ==========================================================================
    // Event Listeners for Controls
    // ==========================================================================
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

        // Add Semester Button (e.g. Semester 9 or Summer)
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

        // Filter Pills
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

        // Remove Course Click (Electives)
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
                    semObj.courses.splice(idx, 1);
                    saveCustomPlan();
                    renderDegreePlanner();
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
                const course = global.PLANNER_CATALOG.ALL_COURSES_MAP[code];
                if (!course || !customPlan) return;

                // Prompt or default to semester 6 or 7
                const semChoices = customPlan.map(s => s.semester).join(', ');
                const chosen = prompt(`לאיזה סמסטר תרצה להוסיף את "${course.name}"?\n(סמסטרים קיימים: ${semChoices})`, '6');
                if (!chosen) return;

                const targetSem = parseInt(chosen);
                const targetObj = customPlan.find(s => s.semester === targetSem);
                if (!targetObj) {
                    alert('סמסטר לא נמצא');
                    return;
                }

                if (!targetObj.courses) targetObj.courses = [];
                targetObj.courses.push(JSON.parse(JSON.stringify(course)));
                saveCustomPlan();
                renderDegreePlanner();
            });
        }
    }

    // Expose API
    global.DegreePlanner = {
        renderDegreePlanner: renderDegreePlanner,
        evaluateDegreeRules: evaluateDegreeRules,
        getCustomPlan: () => customPlan,
        resetPlanToSuggested: resetPlanToSuggested
    };

})(typeof window !== 'undefined' ? window : global);
