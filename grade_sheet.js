// ==============================================================================
// Semestero ME - Technion Academic Grade Sheet & What-If Simulator Engine
// Module: grade_sheet.js
// Handles:
// 1. Official Technion-style Academic Transcript calculations (Quality Points,
//    Semester GPAs, Degree Cumulative GPA, Graded vs Binary Credits).
// 2. Honors classification (Dean's List >= 84 + >= 18 cr, President's List >= 91 + >= 18 cr).
// 3. Interactive What-If Simulator (Target GPA solver, scenario presets, live grade projection).
// 4. A4 Printable Transcript Layout & Export (Clean A4 print/PDF with Technion styling).
// 5. UTF-8 BOM CSV Export for Excel & external transcript verification.
// ==============================================================================

(function(window) {
    'use strict';

    const DEGREE_TOTAL_CREDITS = 157.5;
    const DEAN_HONORS_MIN_GPA = 84.0;
    const PRESIDENT_HONORS_MIN_GPA = 91.0;
    const HONORS_MIN_CREDITS = 18.0;

    const GradeSheet = {
        isOpen: false,
        isSimActive: false,
        simGrades: {}, // Map of courseCode -> numeric grade
        targetGpa: 85.0,
        studentInfo: {
            name: '',
            id: '',
            faculty: 'הפקולטה להנדסת מכונות',
            program: '034 - בוגר למדעים (B.Sc.) בהנדסת מכונות',
            currentTerm: 'אביב תשפ"ד (סמסטר 3)'
        },

        init() {
            this.loadStoredStudentInfo();
            this.setupKeybindings();
        },

        loadStoredStudentInfo() {
            try {
                const stored = localStorage.getItem('ast_grade_sheet_student_info');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && typeof parsed === 'object') {
                        this.studentInfo = Object.assign(this.studentInfo, parsed);
                    }
                }
            } catch (e) {
                console.warn('[GradeSheet] Error reading stored student info:', e);
            }

            // Fallback to active user identity
            if (!this.studentInfo.name) {
                if (window.AuthSync && typeof window.AuthSync.getCurrentUser === 'function') {
                    const u = window.AuthSync.getCurrentUser();
                    if (u && u.name) this.studentInfo.name = u.name;
                }
                if (!this.studentInfo.name && window.gameState && window.gameState.userProfile && window.gameState.userProfile.name) {
                    this.studentInfo.name = window.gameState.userProfile.name;
                }
                if (!this.studentInfo.name) {
                    const isAdir = window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive();
                    this.studentInfo.name = isAdir ? 'אדיר משה' : 'סטודנט להנדסת מכונות';
                }
            }

            if (!this.studentInfo.id) {
                if (window.gameState && window.gameState.userProfile && window.gameState.userProfile.studentId) {
                    this.studentInfo.id = window.gameState.userProfile.studentId;
                } else {
                    this.studentInfo.id = '318942516';
                }
            }
        },

        saveStudentInfo() {
            const nameEl = document.getElementById('grade-sheet-student-name');
            const idEl = document.getElementById('grade-sheet-student-id');
            if (nameEl && nameEl.innerText && nameEl.innerText.trim()) {
                this.studentInfo.name = nameEl.innerText.trim();
            }
            if (idEl && idEl.innerText && idEl.innerText.trim()) {
                this.studentInfo.id = idEl.innerText.trim();
            }

            try {
                localStorage.setItem('ast_grade_sheet_student_info', JSON.stringify(this.studentInfo));
                if (window.gameState && !window.gameState.userProfile) window.gameState.userProfile = {};
                if (window.gameState) {
                    window.gameState.userProfile.name = this.studentInfo.name;
                    window.gameState.userProfile.studentId = this.studentInfo.id;
                }
            } catch (e) {
                console.warn('[GradeSheet] Failed to persist student info:', e);
            }
        },

        setupKeybindings() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+G or Cmd+Shift+G opens Grade Sheet
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'G' || e.key === 'g' || e.key === 'ע')) {
                    e.preventDefault();
                    if (this.isOpen) {
                        this.closeModal();
                    } else {
                        this.openModal();
                    }
                } else if (e.key === 'Escape' && this.isOpen) {
                    this.closeModal();
                }
            });
        },

        getRawCourses() {
            if (window.gameState && window.gameState.courses) {
                return window.gameState.courses;
            }
            if (window.PRELOADED_USER_STATE && window.PRELOADED_USER_STATE.courses) {
                return window.PRELOADED_USER_STATE.courses;
            }
            return {};
        },

        // Extracts all relevant courses grouped by semester with full math metrics
        getTranscriptData() {
            const raw = this.getRawCourses();
            const list = Object.values(raw).filter(c => {
                if (c.status === 'exempt') return false;
                // Exclude mutually exclusive alternatives if one is mastered
                if (['114071', '104016', '104166', '01140071'].includes(c.code) && !c.grade && c.status !== 'mastered') return false;
                if (c.mutuallyExclusiveWith && Array.isArray(c.mutuallyExclusiveWith)) {
                    const hasMasteredPartner = c.mutuallyExclusiveWith.some(code => 
                        raw[code] && (raw[code].status === 'mastered' || (raw[code].grade && Number(raw[code].grade) >= 55))
                    );
                    if (hasMasteredPartner && c.status !== 'mastered') return false;
                }
                return true;
            });

            // Group into semesters 1..8 plus summer (2.5 / 9)
            const semesters = {};
            for (let s = 1; s <= 8; s++) {
                semesters[s] = { semester: s, name: this.getSemesterName(s), courses: [] };
            }

            list.forEach(c => {
                let s = Number(c.semester || 1);
                if (s === 2.5 || s === 9) s = 2.5;
                if (!semesters[s]) {
                    semesters[s] = { semester: s, name: this.getSemesterName(s), courses: [] };
                }
                semesters[s].courses.push(c);
            });

            // Sort courses inside each semester by code
            Object.values(semesters).forEach(sem => {
                sem.courses.sort((a, b) => String(a.code).localeCompare(String(b.code)));
            });

            // Calculate metrics per semester & cumulative
            let totalEarnedCredits = 0;
            let totalGradedCredits = 0;
            let totalQualityPoints = 0;
            let totalSimulatedGradedCredits = 0;
            let totalSimulatedQualityPoints = 0;

            const semesterReports = Object.values(semesters).map(sem => {
                let semEarnedCredits = 0;
                let semGradedCredits = 0;
                let semQualityPoints = 0;

                let simSemGradedCredits = 0;
                let simSemQualityPoints = 0;

                const coursesProcessed = sem.courses.map(c => {
                    const cr = Number(c.credits) || 0;
                    const isBinary = (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS');
                    const isMastered = (c.status === 'mastered');
                    const hasNumericGrade = !isBinary && c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade)) && Number(c.grade) >= 55;
                    const actualGrade = hasNumericGrade ? Number(c.grade) : null;

                    // Simulation logic
                    let simGrade = null;
                    if (this.isSimActive && !isMastered && !isBinary) {
                        if (this.simGrades[c.code] !== undefined && this.simGrades[c.code] !== null && this.simGrades[c.code] !== '') {
                            const parsed = Number(this.simGrades[c.code]);
                            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                                simGrade = parsed;
                            }
                        }
                    }

                    const effectiveGrade = actualGrade !== null ? actualGrade : simGrade;
                    const qp = effectiveGrade !== null ? (effectiveGrade * cr) : 0;

                    if (isMastered) {
                        semEarnedCredits += cr;
                        if (actualGrade !== null) {
                            semGradedCredits += cr;
                            semQualityPoints += qp;
                            simSemGradedCredits += cr;
                            simSemQualityPoints += qp;
                        }
                    } else if (this.isSimActive && simGrade !== null && simGrade >= 55) {
                        // In simulation, passing grade counts to sim totals
                        simSemGradedCredits += cr;
                        simSemQualityPoints += qp;
                    }

                    return {
                        code: c.code,
                        name: c.name,
                        credits: cr,
                        status: c.status || 'available',
                        isBinary,
                        isMastered,
                        actualGrade,
                        simGrade,
                        effectiveGrade,
                        qualityPoints: qp
                    };
                });

                const semGpa = semGradedCredits > 0 ? (semQualityPoints / semGradedCredits) : null;
                const simSemGpa = simSemGradedCredits > 0 ? (simSemQualityPoints / simSemGradedCredits) : null;

                // Honors calculation
                let honors = null;
                const checkGpa = this.isSimActive ? (simSemGpa || semGpa) : semGpa;
                const checkCredits = this.isSimActive ? (simSemGradedCredits || semGradedCredits) : semGradedCredits;
                if (checkGpa !== null && checkCredits >= HONORS_MIN_CREDITS) {
                    if (checkGpa >= PRESIDENT_HONORS_MIN_GPA) {
                        honors = { type: 'president', label: 'הצטיינות נשיא ⭐' };
                    } else if (checkGpa >= DEAN_HONORS_MIN_GPA) {
                        honors = { type: 'dean', label: 'הצטיינות דיקן 🎖️' };
                    }
                }

                totalEarnedCredits += semEarnedCredits;
                totalGradedCredits += semGradedCredits;
                totalQualityPoints += semQualityPoints;

                totalSimulatedGradedCredits += simSemGradedCredits;
                totalSimulatedQualityPoints += simSemQualityPoints;

                return {
                    semester: sem.semester,
                    name: sem.name,
                    courses: coursesProcessed,
                    earnedCredits: semEarnedCredits,
                    gradedCredits: semGradedCredits,
                    qualityPoints: semQualityPoints,
                    gpa: semGpa,
                    simGpa: simSemGpa,
                    simGradedCredits: simSemGradedCredits,
                    simQualityPoints: simSemQualityPoints,
                    honors
                };
            });

            // Cumulative calculations
            const cumulativeGpa = totalGradedCredits > 0 ? (totalQualityPoints / totalGradedCredits) : 0;
            const simCumulativeGpa = totalSimulatedGradedCredits > 0 ? (totalSimulatedQualityPoints / totalSimulatedGradedCredits) : cumulativeGpa;

            // Cumulative Honors
            let cumulativeStanding = 'תקין';
            const evalGpa = this.isSimActive ? simCumulativeGpa : cumulativeGpa;
            if (evalGpa >= PRESIDENT_HONORS_MIN_GPA) {
                cumulativeStanding = 'הצטיינות יתרה (Summa Cum Laude) ⭐';
            } else if (evalGpa >= DEAN_HONORS_MIN_GPA) {
                cumulativeStanding = 'הצטיינות (Cum Laude) 🎖️';
            } else if (evalGpa < 65.0 && totalGradedCredits > 0) {
                cumulativeStanding = 'מעקב אקדמי ⚠️';
            }

            return {
                semesters: semesterReports,
                totalDegreeCredits: DEGREE_TOTAL_CREDITS,
                totalEarnedCredits,
                totalGradedCredits,
                totalQualityPoints,
                cumulativeGpa,
                simCumulativeGpa,
                totalSimulatedGradedCredits,
                totalSimulatedQualityPoints,
                cumulativeStanding
            };
        },

        getSemesterName(semNumber) {
            const num = Number(semNumber);
            if (num === 2.5 || num === 9) return 'סמסטר קיץ';
            const names = {
                1: 'סמסטר 1 (חורף א׳)',
                2: 'סמסטר 2 (אביב א׳)',
                3: 'סמסטר 3 (חורף ב׳)',
                4: 'סמסטר 4 (אביב ב׳)',
                5: 'סמסטר 5 (חורף ג׳)',
                6: 'סמסטר 6 (אביב ג׳)',
                7: 'סמסטר 7 (חורף ד׳)',
                8: 'סמסטר 8 (אביב ד׳)'
            };
            return names[num] || `סמסטר ${num}`;
        },

        openModal() {
            this.loadStoredStudentInfo();
            const modal = document.getElementById('modal-grade-sheet');
            if (!modal) {
                console.error('[GradeSheet] Modal element #modal-grade-sheet not found.');
                return;
            }

            // Populate issue date
            const dateEl = document.getElementById('grade-sheet-issue-date');
            if (dateEl) {
                const now = new Date();
                const formattedDate = now.toLocaleDateString('he-IL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const formattedTime = now.toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                dateEl.innerText = `${formattedDate} (${formattedTime})`;
            }

            // Populate student fields
            const nameEl = document.getElementById('grade-sheet-student-name');
            const idEl = document.getElementById('grade-sheet-student-id');
            if (nameEl) nameEl.innerText = this.studentInfo.name || 'אדיר משה';
            if (idEl) idEl.innerText = this.studentInfo.id || '318942516';

            this.render();

            modal.style.display = 'flex';
            modal.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        },

        closeModal() {
            const modal = document.getElementById('modal-grade-sheet');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
            this.isOpen = false;
            document.body.style.overflow = '';
        },

        toggleSimulation(forceState) {
            this.isSimActive = typeof forceState === 'boolean' ? forceState : !this.isSimActive;
            const simPanel = document.getElementById('grade-sheet-sim-panel');
            const toggleBtn = document.getElementById('btn-toggle-gradesheet-sim');

            if (simPanel) {
                simPanel.style.display = this.isSimActive ? 'block' : 'none';
            }
            if (toggleBtn) {
                toggleBtn.classList.toggle('active', this.isSimActive);
                toggleBtn.innerText = this.isSimActive ? '🔮 סגור סימולטור' : '🔮 סימולטור What-If';
            }

            this.render();
            if (this.isSimActive) {
                this.calcTargetGpa();
            }
        },

        setSimGrade(courseCode, val) {
            if (val === '' || val === null || val === undefined) {
                delete this.simGrades[courseCode];
            } else {
                const num = Number(val);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                    this.simGrades[courseCode] = num;
                }
            }
            this.render();
            this.calcTargetGpa();
        },

        applyPreset(presetVal) {
            const transcript = this.getTranscriptData();
            let gradeToSet = 85;

            if (presetVal === 'current') {
                gradeToSet = Math.round(transcript.cumulativeGpa || 85);
            } else if (typeof presetVal === 'number') {
                gradeToSet = presetVal;
            }

            // Set for all uncompleted courses
            transcript.semesters.forEach(sem => {
                sem.courses.forEach(c => {
                    if (!c.isMastered && !c.isBinary) {
                        this.simGrades[c.code] = gradeToSet;
                    }
                });
            });

            this.render();
            this.calcTargetGpa();
        },

        resetSimulation() {
            this.simGrades = {};
            this.render();
            this.calcTargetGpa();
        },

        calcTargetGpa() {
            const targetInput = document.getElementById('sim-target-gpa');
            const feedbackEl = document.getElementById('sim-target-feedback');
            if (!targetInput || !feedbackEl) return;

            const target = Number(targetInput.value);
            if (isNaN(target) || target < 55 || target > 100) {
                feedbackEl.innerHTML = '<span style="color: #ef4444;">נא להזין ממוצע יעד תקין בין 55 ל-100.</span>';
                return;
            }

            const data = this.getTranscriptData();
            const curQp = data.totalQualityPoints;
            const curGradedCredits = data.totalGradedCredits;

            // Total remaining graded credits
            let remainingGradedCredits = 0;
            data.semesters.forEach(sem => {
                sem.courses.forEach(c => {
                    if (!c.isMastered && !c.isBinary) {
                        remainingGradedCredits += c.credits;
                    }
                });
            });

            if (remainingGradedCredits <= 0) {
                feedbackEl.innerHTML = `<strong>כל הקורסים הושלמו!</strong> הממוצע הסופי הוא <strong>${data.cumulativeGpa.toFixed(2)}</strong>.`;
                return;
            }

            const totalProjectedGradedCredits = curGradedCredits + remainingGradedCredits;
            const requiredTotalQp = target * totalProjectedGradedCredits;
            const neededQp = requiredTotalQp - curQp;
            const requiredAverage = neededQp / remainingGradedCredits;

            if (requiredAverage > 100) {
                feedbackEl.innerHTML = `
                    <div style="color: #f87171; display: flex; align-items: center; gap: 6px;">
                        <span>⚠️</span>
                        <span>ממוצע יעד של <strong>${target.toFixed(2)}</strong> אינו אפשרי מתמטית (נדרש ממוצע <strong>${requiredAverage.toFixed(2)}</strong> ב-${remainingGradedCredits.toFixed(1)} נק״ז הנותרות).</span>
                    </div>
                `;
            } else if (requiredAverage < 55) {
                feedbackEl.innerHTML = `
                    <div style="color: #34d399; display: flex; align-items: center; gap: 6px;">
                        <span>🎉</span>
                        <span>ממוצע היעד <strong>${target.toFixed(2)}</strong> מובטח כבר עתה בכל ציוני המעבר (נדרש רק <strong>${Math.max(55, requiredAverage).toFixed(2)}</strong> ב-${remainingGradedCredits.toFixed(1)} נק״ז הנותרות).</span>
                    </div>
                `;
            } else {
                feedbackEl.innerHTML = `
                    <div style="color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                        <span>🎯</span>
                        <span>כדי להגיע לממוצע תואר <strong>${target.toFixed(2)}</strong>, עליך להשיג ממוצע של <strong style="color: #38bdf8; font-size: 1.05rem;">${requiredAverage.toFixed(2)}</strong> ב-${remainingGradedCredits.toFixed(1)} נק״ז שנותרו לציון.</span>
                    </div>
                `;
            }
        },

        render() {
            const data = this.getTranscriptData();

            // 1. Update KPI Summary Cards
            const gpaEl = document.getElementById('gs-kpi-cumulative-gpa');
            const gpaSubEl = document.getElementById('gs-kpi-cumulative-gpa-sub');
            const earnedEl = document.getElementById('gs-kpi-earned-credits');
            const earnedPctEl = document.getElementById('gs-kpi-earned-pct');
            const gradedCrEl = document.getElementById('gs-kpi-graded-credits');
            const qpEl = document.getElementById('gs-kpi-quality-points');
            const honorsEl = document.getElementById('gs-kpi-honors');
            const standingEl = document.getElementById('grade-sheet-academic-standing');

            if (gpaEl) {
                if (this.isSimActive && data.simCumulativeGpa !== data.cumulativeGpa) {
                    gpaEl.innerHTML = `<span style="color: #a855f7;">${data.simCumulativeGpa.toFixed(2)}</span> <span class="sim-badge-inline">חזוי</span>`;
                    if (gpaSubEl) gpaSubEl.innerText = `ממוצע נוכחי בפועל: ${data.cumulativeGpa.toFixed(2)}`;
                } else {
                    gpaEl.innerText = data.cumulativeGpa > 0 ? data.cumulativeGpa.toFixed(2) : '0.00';
                    if (gpaSubEl) gpaSubEl.innerText = 'מכלל הקורסים שנלמדו';
                }
            }

            if (earnedEl) {
                earnedEl.innerHTML = `<bdi dir="ltr">${data.totalEarnedCredits.toFixed(1)} / ${data.totalDegreeCredits}</bdi>`;
            }
            if (earnedPctEl) {
                const pct = Math.min(100, (data.totalEarnedCredits / data.totalDegreeCredits) * 100);
                earnedPctEl.innerText = `${pct.toFixed(1)}% מדרישות התואר`;
            }

            if (gradedCrEl) {
                if (this.isSimActive && data.totalSimulatedGradedCredits !== data.totalGradedCredits) {
                    gradedCrEl.innerHTML = `<span style="color: #a855f7;">${data.totalSimulatedGradedCredits.toFixed(1)}</span> <span style="font-size: 0.72rem; color: #94a3b8;">(${data.totalGradedCredits.toFixed(1)} בפועל)</span>`;
                } else {
                    gradedCrEl.innerText = data.totalGradedCredits.toFixed(1);
                }
            }

            if (qpEl) {
                if (this.isSimActive && data.totalSimulatedQualityPoints !== data.totalQualityPoints) {
                    qpEl.innerHTML = `<span style="color: #a855f7;">${data.totalSimulatedQualityPoints.toFixed(1)}</span>`;
                } else {
                    qpEl.innerText = data.totalQualityPoints.toFixed(1);
                }
            }

            if (honorsEl) {
                const evalGpa = this.isSimActive ? data.simCumulativeGpa : data.cumulativeGpa;
                if (evalGpa >= PRESIDENT_HONORS_MIN_GPA) {
                    honorsEl.innerHTML = '<span style="color: #fbbf24;">הצטיינות יתרה ⭐</span>';
                } else if (evalGpa >= DEAN_HONORS_MIN_GPA) {
                    honorsEl.innerHTML = '<span style="color: #38bdf8;">הצטיינות דיקן 🎖️</span>';
                } else {
                    honorsEl.innerHTML = '<span style="color: #94a3b8;">רף דיקן: 84.0</span>';
                }
            }

            if (standingEl) {
                standingEl.innerText = data.cumulativeStanding;
            }

            // 2. Render Semester Tables
            const container = document.getElementById('grade-sheet-semesters-container');
            if (!container) return;

            let html = '';
            data.semesters.forEach(sem => {
                if (sem.courses.length === 0) return;

                const hasGrades = sem.gradedCredits > 0;
                const hasSimGrades = sem.simGradedCredits > sem.gradedCredits;
                const displayGpa = this.isSimActive && sem.simGpa !== null ? sem.simGpa : sem.gpa;

                html += `
                    <div class="grade-sheet-sem-block" id="gs-sem-block-${sem.semester}">
                        <div class="grade-sheet-sem-header">
                            <div class="sem-header-title">
                                <span class="sem-icon">📅</span>
                                <h4>${sem.name}</h4>
                                ${sem.honors ? `<span class="sem-honors-badge ${sem.honors.type}">${sem.honors.label}</span>` : ''}
                            </div>
                            <div class="sem-header-stats">
                                <span>נק״ז: <strong>${sem.earnedCredits.toFixed(1)}</strong></span>
                                ${displayGpa !== null ? `
                                    <span class="sem-gpa-badge ${this.isSimActive && hasSimGrades ? 'is-sim' : ''}">
                                        ממוצע: <strong>${displayGpa.toFixed(2)}</strong>
                                        ${this.isSimActive && hasSimGrades ? '<small>(חזוי)</small>' : ''}
                                    </span>
                                ` : '<span class="sem-gpa-pending">בהמתנה לציונים</span>'}
                            </div>
                        </div>

                        <div class="grade-sheet-table-wrapper">
                            <table class="grade-sheet-table">
                                <thead>
                                    <tr>
                                        <th style="width: 100px;">מס׳ מקצוע</th>
                                        <th>שם המקצוע</th>
                                        <th style="width: 60px; text-align: center;">נק״ז</th>
                                        <th style="width: 90px; text-align: center;">סוג ציון</th>
                                        <th style="width: 95px; text-align: center;">ציון</th>
                                        <th style="width: 90px; text-align: center;">נק׳ איכות</th>
                                        <th style="width: 110px; text-align: center;" class="no-print">סטטוס</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                sem.courses.forEach(c => {
                    let gradeCellContent = '';
                    let qpCellContent = '';
                    let statusLabel = '';
                    let statusClass = '';

                    if (c.isMastered) {
                        if (c.isBinary) {
                            gradeCellContent = '<span class="badge-binary-pass">עובר</span>';
                            qpCellContent = '<span style="color: #64748b;">-</span>';
                        } else {
                            gradeCellContent = `<strong class="grade-value-cell">${c.actualGrade}</strong>`;
                            qpCellContent = `<span>${c.qualityPoints.toFixed(1)}</span>`;
                        }
                        statusLabel = 'הושלם ✓';
                        statusClass = 'status-mastered';
                    } else {
                        // Course in progress or future
                        if (c.status === 'active') {
                            statusLabel = 'בביצוע ⏳';
                            statusClass = 'status-active';
                        } else {
                            statusLabel = 'מתוכנן 📌';
                            statusClass = 'status-planned';
                        }

                        if (c.isBinary) {
                            gradeCellContent = '<span style="color: #94a3b8;">עובר (בינארי)</span>';
                            qpCellContent = '<span style="color: #64748b;">-</span>';
                        } else if (this.isSimActive) {
                            const currentSimVal = this.simGrades[c.code] !== undefined ? this.simGrades[c.code] : '';
                            gradeCellContent = `
                                <div class="sim-input-wrapper">
                                    <input type="number" 
                                           class="sim-grade-input no-print" 
                                           min="0" max="100" 
                                           placeholder="הזן" 
                                           value="${currentSimVal}"
                                           oninput="window.handleGradeSheetSimInput('${c.code}', this.value)"
                                           title="הזן ציון תרחיש">
                                    <span class="sim-print-val">${currentSimVal || '-'}</span>
                                </div>
                            `;
                            qpCellContent = c.simGrade !== null 
                                ? `<span style="color: #a855f7; font-weight: 700;">${c.qualityPoints.toFixed(1)}</span>` 
                                : '<span style="color: #64748b;">-</span>';
                        } else {
                            gradeCellContent = '<span style="color: #64748b;">טרם נקבע</span>';
                            qpCellContent = '<span style="color: #64748b;">-</span>';
                        }
                    }

                    html += `
                        <tr class="${c.isMastered ? 'row-mastered' : 'row-pending'}">
                            <td class="cell-code"><bdi dir="ltr">${c.code}</bdi></td>
                            <td class="cell-name">${c.name}</td>
                            <td class="cell-cr" style="text-align: center;">${c.credits.toFixed(1)}</td>
                            <td class="cell-type" style="text-align: center;">${c.isBinary ? 'בינארי' : 'מספרי'}</td>
                            <td class="cell-grade" style="text-align: center;">${gradeCellContent}</td>
                            <td class="cell-qp" style="text-align: center;">${qpCellContent}</td>
                            <td class="cell-status no-print" style="text-align: center;"><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                        </tr>
                    `;
                });

                // Semester Subtotal Row
                const semTotalCr = sem.courses.reduce((acc, cur) => acc + cur.credits, 0);
                const subGradedCr = this.isSimActive ? sem.simGradedCredits : sem.gradedCredits;
                const subQp = this.isSimActive ? sem.simQualityPoints : sem.qualityPoints;
                const subGpa = this.isSimActive ? sem.simGpa : sem.gpa;

                html += `
                                </tbody>
                                <tfoot>
                                    <tr class="table-subtotal-row">
                                        <td colspan="2"><strong>סיכום ${sem.name}</strong></td>
                                        <td style="text-align: center;"><strong>${semTotalCr.toFixed(1)}</strong></td>
                                        <td style="text-align: center;"><small>${subGradedCr.toFixed(1)} לציון</small></td>
                                        <td style="text-align: center;">${subGpa !== null ? `<strong>${subGpa.toFixed(2)}</strong>` : '-'}</td>
                                        <td style="text-align: center;"><strong>${subQp.toFixed(1)}</strong></td>
                                        <td class="no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        },

        printTranscript() {
            document.body.classList.add('is-printing-grade-sheet');
            
            const cleanup = () => {
                document.body.classList.remove('is-printing-grade-sheet');
                window.removeEventListener('afterprint', cleanup);
            };

            window.addEventListener('afterprint', cleanup);
            
            // Trigger browser print dialog
            setTimeout(() => {
                window.print();
                // Fallback cleanup if afterprint doesn't fire
                setTimeout(cleanup, 2000);
            }, 50);
        },

        exportCSV() {
            const data = this.getTranscriptData();
            const lines = [];

            // UTF-8 BOM
            const BOM = '\uFEFF';

            // Transcript Header Metadata
            lines.push(`גיליון ציונים אקדמי רשמי - הטכניון מכון טכנולוגי לישראל`);
            lines.push(`הפקולטה להנדסת מכונות (תוכנית 034)`);
            lines.push(`שם הסטודנט,${this.studentInfo.name || 'אדיר משה'},מספר ת.ז/סטודנט,${this.studentInfo.id || '318942516'}`);
            lines.push(`תאריך הפקה,${new Date().toLocaleDateString('he-IL')},מעמד אקדמי,${data.cumulativeStanding}`);
            lines.push(`ממוצע מצטבר,${data.cumulativeGpa.toFixed(2)},נק״ז שנצברו לתואר,${data.totalEarnedCredits.toFixed(1)} / ${data.totalDegreeCredits}`);
            lines.push(`סך נק״ז לציון,${data.totalGradedCredits.toFixed(1)},סך נקודות איכות,${data.totalQualityPoints.toFixed(1)}`);
            lines.push(``); // Blank line

            // Table Columns
            lines.push(`סמסטר,מספר מקצוע,שם מקצוע,נק״ז,סוג ציון,ציון,נקודות איכות,סטטוס`);

            data.semesters.forEach(sem => {
                if (sem.courses.length === 0) return;

                sem.courses.forEach(c => {
                    const gradeStr = c.isMastered 
                        ? (c.isBinary ? 'עובר' : c.actualGrade)
                        : (c.simGrade !== null ? `${c.simGrade} (חזוי)` : 'טרם נקבע');
                    const qpStr = c.qualityPoints > 0 ? c.qualityPoints.toFixed(1) : '-';
                    const statusStr = c.isMastered ? 'הושלם' : (c.status === 'active' ? 'בביצוע' : 'מתוכנן');

                    // Escape quotes and commas in name
                    const cleanName = `"${c.name.replace(/"/g, '""')}"`;
                    lines.push(`${sem.name},${c.code},${cleanName},${c.credits.toFixed(1)},${c.isBinary ? 'בינארי' : 'מספרי'},${gradeStr},${qpStr},${statusStr}`);
                });

                // Semester Subtotal
                const semGpaStr = sem.gpa !== null ? sem.gpa.toFixed(2) : '-';
                lines.push(`סיכום ${sem.name},-,,${sem.earnedCredits.toFixed(1)},${sem.gradedCredits.toFixed(1)} לציון,${semGpaStr},${sem.qualityPoints.toFixed(1)},-`);
                lines.push(``);
            });

            // Degree Grand Summary Row
            lines.push(`סך הכל תואר לתעודה,-,,${data.totalEarnedCredits.toFixed(1)},${data.totalGradedCredits.toFixed(1)} לציון,${data.cumulativeGpa.toFixed(2)},${data.totalQualityPoints.toFixed(1)},${data.cumulativeStanding}`);

            const csvContent = BOM + lines.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Academic_Transcript_Technion_ME_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            if (typeof a.click === 'function') {
                a.click();
            }
            if (a.parentNode) {
                document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
        }
    };

    // Global Window Bindings
    window.GradeSheet = GradeSheet;
    window.openGradeSheetModal = () => GradeSheet.openModal();
    window.closeGradeSheetModal = () => GradeSheet.closeModal();
    window.printGradeSheet = () => GradeSheet.printTranscript();
    window.exportGradeSheetCSV = () => GradeSheet.exportCSV();
    window.toggleGradeSheetSimulation = (state) => GradeSheet.toggleSimulation(state);
    window.applyGradeSheetPreset = (preset) => GradeSheet.applyPreset(preset);
    window.resetGradeSheetSimulation = () => GradeSheet.resetSimulation();
    window.saveGradeSheetStudentInfo = () => GradeSheet.saveStudentInfo();
    window.calcGradeSheetTargetGpa = () => GradeSheet.calcTargetGpa();
    window.handleGradeSheetSimInput = (code, val) => GradeSheet.setSimGrade(code, val);

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GradeSheet.init());
    } else {
        GradeSheet.init();
    }

})(window);
