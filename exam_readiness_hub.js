/**
 * Semestero ME • Past Exams Solved Tracker & Exam Readiness Ring Engine
 * Provides:
 * 1. Interactive 2021-2026 past exams session checklist (Winter/Spring Moed A/B)
 * 2. 3-state toggle: ⬜ Unsolved -> ⏳ Attempted (with self-score) -> ✅ Mastered
 * 3. Animated circular SVG Exam Readiness Ring (0-100%)
 * 4. 1-click links to Pangea in-app worked solutions, Faculty Google Drive, and Moodle
 * 5. Full cloud persistence via gameState.examPrep and AuthSync
 */
(function(window) {
    'use strict';

    const ExamReadinessHub = {
        /**
         * Resolves or initializes the exam prep model for a course
         */
        getCourseExamPrep: function(courseCode) {
            if (!courseCode) return null;
            const cleanCode = String(courseCode).replace(/\D/g, '');
            if (!window.gameState) window.gameState = {};
            if (!window.gameState.examPrep) window.gameState.examPrep = {};

            if (!window.gameState.examPrep[cleanCode]) {
                window.gameState.examPrep[cleanCode] = {
                    courseCode: cleanCode,
                    exams: this.generateDefaultPastExamsList(cleanCode),
                    updatedAt: Date.now()
                };
            }
            return window.gameState.examPrep[cleanCode];
        },

        /**
         * Generates the standard past exams list for the last 5 academic years (2021-2026)
         */
        generateDefaultPastExamsList: function(cleanCode) {
            const list = [];
            const currentYear = 2026;
            const earliestYear = 2021;

            // Check if Pangea has mapped exams for this course
            let pangeaExams = [];
            if (window.PangeaHub && typeof window.PangeaHub.getCourseData === 'function') {
                const cData = window.PangeaHub.getCourseData(cleanCode);
                if (cData && Array.isArray(cData.exams)) {
                    pangeaExams = cData.exams;
                }
            }

            for (let y = currentYear; y >= earliestYear; y--) {
                const moeds = [
                    { id: `${y}_w_a`, name: `${y} חורף - מועד א'`, term: 'חורף', moed: "מועד א'" },
                    { id: `${y}_w_b`, name: `${y} חורף - מועד ב'`, term: 'חורף', moed: "מועד ב'" },
                    { id: `${y}_s_a`, name: `${y} אביב - מועד א'`, term: 'אביב', moed: "מועד א'" },
                    { id: `${y}_s_b`, name: `${y} אביב - מועד ב'`, term: 'אביב', moed: "מועד ב'" }
                ];

                moeds.forEach(m => {
                    // Try to find matching Pangea exam
                    const pMatch = pangeaExams.find(pe => {
                        const title = (pe.displayTitle || pe.name || '').toLowerCase();
                        return title.includes(String(y)) && (
                            (m.term === 'חורף' && (title.includes('חורף') || title.includes('winter') || title.includes('w_'))) ||
                            (m.term === 'אביב' && (title.includes('אביב') || title.includes('spring') || title.includes('s_')))
                        ) && (
                            (m.moed.includes("א'") && (title.includes("מועד א'") || title.includes("moed a") || title.includes("_a"))) ||
                            (m.moed.includes("ב'") && (title.includes("מועד ב'") || title.includes("moed b") || title.includes("_b")))
                        );
                    });

                    list.push({
                        id: m.id,
                        year: y,
                        name: m.name,
                        term: m.term,
                        moed: m.moed,
                        status: 'unsolved', // 'unsolved' | 'attempted' | 'mastered'
                        score: null,
                        timeSpentMinutes: null,
                        notes: '',
                        pangeaUrl: pMatch ? pMatch.url : null,
                        pangeaTitle: pMatch ? pMatch.displayTitle : null
                    });
                });
            }

            return list;
        },

        /**
         * Calculates the readiness score and summary stats
         */
        calculateReadiness: function(courseCode) {
            const prep = this.getCourseExamPrep(courseCode);
            if (!prep || !prep.exams || prep.exams.length === 0) {
                return {
                    total: 0,
                    mastered: 0,
                    attempted: 0,
                    unsolved: 0,
                    readinessPct: 0,
                    avgScore: null,
                    statusText: 'טרם החל תרגול',
                    color: '#94a3b8'
                };
            }

            // Window: Focus on recent 12 moeds (3 years) as primary readiness benchmark
            const targetWindow = prep.exams.slice(0, 12);
            const total = targetWindow.length;
            const mastered = targetWindow.filter(e => e.status === 'mastered').length;
            const attempted = targetWindow.filter(e => e.status === 'attempted').length;
            const unsolved = total - mastered - attempted;

            // Mastered counts as 1.0, attempted counts as 0.5
            const effectiveScore = mastered + (attempted * 0.5);
            const readinessPct = Math.min(100, Math.round((effectiveScore / Math.max(1, total)) * 100));

            // Calculate average score for attempted/mastered tests
            const scoredExams = targetWindow.filter(e => e.score !== null && !isNaN(Number(e.score)));
            let avgScore = null;
            if (scoredExams.length > 0) {
                const sum = scoredExams.reduce((acc, curr) => acc + Number(curr.score), 0);
                avgScore = Math.round(sum / scoredExams.length);
            }

            let statusText = 'טרם החל תרגול';
            let color = '#94a3b8';

            if (readinessPct >= 75) {
                statusText = 'מוכן לבחינה ברמת שליטה גבוהה 🟢';
                color = '#10b981';
            } else if (readinessPct >= 45) {
                statusText = 'בתהליך הכנה מתקדם 🟡';
                color = '#f59e0b';
            } else if (readinessPct > 0) {
                statusText = 'החל תרגול מבחני עבר 🟠';
                color = '#fb923c';
            }

            return {
                total,
                mastered,
                attempted,
                unsolved,
                readinessPct,
                avgScore,
                statusText,
                color
            };
        },

        /**
         * Cycles status: unsolved -> attempted -> mastered -> unsolved
         */
        cycleStatus: function(courseCode, examId) {
            const prep = this.getCourseExamPrep(courseCode);
            if (!prep) return;
            const exam = prep.exams.find(e => e.id === examId);
            if (!exam) return;

            if (exam.status === 'unsolved') {
                exam.status = 'attempted';
                if (exam.score === null) {
                    const promptScore = window.prompt(`הזן ציון שקיבלת במבחן ${exam.name} (או השאר ריק):`, '');
                    if (promptScore !== null && promptScore.trim() !== '' && !isNaN(Number(promptScore))) {
                        exam.score = Math.max(0, Math.min(100, Math.round(Number(promptScore))));
                    }
                }
            } else if (exam.status === 'attempted') {
                exam.status = 'mastered';
            } else {
                exam.status = 'unsolved';
                exam.score = null;
            }

            prep.updatedAt = Date.now();
            this.saveAndSync();
            this.renderExamReadinessCard(courseCode, document.getElementById('modal-exam-readiness-container'));
        },

        /**
         * Sets exam score manually
         */
        setScore: function(courseCode, examId) {
            const prep = this.getCourseExamPrep(courseCode);
            if (!prep) return;
            const exam = prep.exams.find(e => e.id === examId);
            if (!exam) return;

            const promptScore = window.prompt(`עדכן ציון עצמי עבור ${exam.name} (0-100):`, exam.score !== null ? String(exam.score) : '');
            if (promptScore !== null) {
                const trimmed = promptScore.trim();
                if (trimmed === '') {
                    exam.score = null;
                } else if (!isNaN(Number(trimmed))) {
                    exam.score = Math.max(0, Math.min(100, Math.round(Number(trimmed))));
                    if (exam.status === 'unsolved') exam.status = 'attempted';
                }
                prep.updatedAt = Date.now();
                this.saveAndSync();
                this.renderExamReadinessCard(courseCode, document.getElementById('modal-exam-readiness-container'));
            }
        },

        /**
         * Saves state and triggers debounced cloud sync
         */
        saveAndSync: function() {
            if (typeof saveState === 'function') {
                saveState(true);
            }
            if (window.AuthSync && typeof window.AuthSync.triggerDebouncedCloudSync === 'function') {
                window.AuthSync.triggerDebouncedCloudSync();
            }
        },

        /**
         * Bidirectional merge from remote cloud state
         */
        loadFromGameState: function(remoteExamPrep) {
            if (!remoteExamPrep || typeof remoteExamPrep !== 'object') return;
            if (!window.gameState) window.gameState = {};
            if (!window.gameState.examPrep) window.gameState.examPrep = {};

            Object.keys(remoteExamPrep).forEach(courseCode => {
                const remoteCourse = remoteExamPrep[courseCode];
                if (!remoteCourse || !Array.isArray(remoteCourse.exams)) return;

                const localCourse = window.gameState.examPrep[courseCode] || {
                    courseCode: courseCode,
                    exams: ExamReadinessHub.generateDefaultPastExamsList(courseCode),
                    updatedAt: 0
                };

                // Merge exam by exam preserving mastered status or newer data
                remoteCourse.exams.forEach(remoteExam => {
                    const localExam = localCourse.exams.find(e => e.id === remoteExam.id);
                    if (localExam) {
                        if (remoteExam.status === 'mastered' || (localExam.status === 'unsolved' && remoteExam.status === 'attempted')) {
                            localExam.status = remoteExam.status;
                            if (remoteExam.score !== null) localExam.score = remoteExam.score;
                            if (remoteExam.notes) localExam.notes = remoteExam.notes;
                        }
                    } else {
                        localCourse.exams.push(remoteExam);
                    }
                });

                localCourse.updatedAt = Math.max(localCourse.updatedAt || 0, remoteCourse.updatedAt || 0);
                window.gameState.examPrep[courseCode] = localCourse;
            });
        },

        /**
         * Renders the complete Exam Readiness Card into container
         */
        renderExamReadinessCard: function(courseCode, container) {
            if (!container || !courseCode) return;
            const cleanCode = String(courseCode).replace(/\D/g, '');
            const prep = this.getCourseExamPrep(cleanCode);
            if (!prep) return;

            const stats = this.calculateReadiness(cleanCode);

            // Drive and Pangea links
            const driveMap = (typeof COURSE_FACULTY_DRIVE_MAP !== 'undefined') ? COURSE_FACULTY_DRIVE_MAP : {};
            const driveUrl = driveMap[cleanCode] || driveMap['0' + cleanCode] || 'https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx?id=/personal/mech_info_asat_technion_ac_il/Documents/Mechanical%20Engineering%20Drive/General%20Drive';
            const moodleMap = (typeof MOODLE26_COURSE_MAP !== 'undefined') ? MOODLE26_COURSE_MAP : {};
            const moodleCourseId = moodleMap[cleanCode] || moodleMap['0' + cleanCode];
            const moodleUrl = moodleCourseId ? `https://moodle26.technion.ac.il/course/view.php?id=${moodleCourseId}` : `https://moodle26.technion.ac.il/course/search.php?search=${cleanCode}`;

            // SVG Circular Gauge parameters
            const radius = 32;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (stats.readinessPct / 100) * circumference;

            let html = `
                <div class="exam-readiness-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 16px; margin: 14px 0; direction: rtl; box-shadow: 0 4px 18px rgba(0,0,0,0.35);">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <!-- Animated Circular Gauge -->
                            <div style="position: relative; width: 76px; height: 76px; flex-shrink: 0;">
                                <svg width="76" height="76" viewBox="0 0 76 76" style="transform: rotate(-90deg);">
                                    <circle cx="38" cy="38" r="${radius}" stroke="rgba(255,255,255,0.08)" stroke-width="7" fill="transparent" />
                                    <circle cx="38" cy="38" r="${radius}" stroke="${stats.color}" stroke-width="7" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" fill="transparent" style="transition: stroke-dashoffset 0.6s ease, stroke 0.6s ease;" />
                                </svg>
                                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; color: #f8fafc;">
                                    <span>${stats.readinessPct}%</span>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.98rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                    <span>🎯 מדד מוכנות למבחן סופי</span>
                                    <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); color: ${stats.color}; border: 1px solid ${stats.color}40;">
                                        ${stats.statusText}
                                    </span>
                                </div>
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                                    ${stats.mastered} מועדים נשלטו ✓ • ${stats.attempted} בתרגול • ${stats.unsolved} טרם נפתרו
                                    ${stats.avgScore !== null ? `<span style="margin-right: 8px; color: #38bdf8; font-weight: 700;">(ממוצע ציונים עצמי: ${stats.avgScore})</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline" style="color: #c084fc; border-color: rgba(192, 132, 252, 0.4); border-radius: 6px; padding: 4px 10px; font-size: 0.76rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                <span>📁</span> דרייב מבחנים ↗
                            </a>
                            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 6px; padding: 4px 10px; font-size: 0.76rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                <span>🎓</span> מודל 26 ↗
                            </a>
                        </div>
                    </div>

                    <!-- Past Exams Solved Checklist Table -->
                    <div style="background: rgba(10, 15, 29, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; max-height: 280px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: right;">
                            <thead>
                                <tr style="background: rgba(30, 41, 59, 0.8); color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                    <th style="padding: 8px 12px; font-weight: 700;">מועד ובחינה</th>
                                    <th style="padding: 8px 10px; font-weight: 700; text-align: center;">סטטוס מוכנות</th>
                                    <th style="padding: 8px 10px; font-weight: 700; text-align: center;">ציון עצמי</th>
                                    <th style="padding: 8px 12px; font-weight: 700; text-align: left;">פתרונות ורפרנס</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            prep.exams.slice(0, 16).forEach(exam => {
                let statusBadge = '';
                if (exam.status === 'mastered') {
                    statusBadge = `<button type="button" onclick="window.ExamReadinessHub.cycleStatus('${cleanCode}', '${exam.id}')" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-weight: 700; border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 0.74rem;">✅ פתור ונשלט</button>`;
                } else if (exam.status === 'attempted') {
                    statusBadge = `<button type="button" onclick="window.ExamReadinessHub.cycleStatus('${cleanCode}', '${exam.id}')" style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fbbf24; font-weight: 700; border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 0.74rem;">⏳ נוסה בתרגול</button>`;
                } else {
                    statusBadge = `<button type="button" onclick="window.ExamReadinessHub.cycleStatus('${cleanCode}', '${exam.id}')" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; font-weight: 600; border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 0.74rem;">⬜ טרם נפתר</button>`;
                }

                let scoreCell = '';
                if (exam.score !== null) {
                    scoreCell = `<button type="button" onclick="window.ExamReadinessHub.setScore('${cleanCode}', '${exam.id}')" style="background: none; border: 1px dashed rgba(56, 189, 248, 0.4); color: #38bdf8; font-weight: 700; border-radius: 4px; padding: 2px 6px; cursor: pointer; font-size: 0.74rem;" title="לחץ לעריכת ציון">${exam.score}</button>`;
                } else {
                    scoreCell = `<button type="button" onclick="window.ExamReadinessHub.setScore('${cleanCode}', '${exam.id}')" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.74rem;" title="הזן ציון">+ ציון</button>`;
                }

                let solutionLinks = '';
                if (exam.pangeaUrl) {
                    solutionLinks += `
                        <button type="button" onclick="if(window.PangeaHub) window.PangeaHub.openQuickPeek('${exam.pangeaUrl}', '${exam.name} - פתרון פנגייה', '${exam.pangeaUrl}');" style="background: rgba(14, 165, 233, 0.15); border: 1px solid #0284c7; color: #38bdf8; border-radius: 4px; padding: 2px 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; margin-left: 4px;" title="פתרון מלא ומודרך בפנגייה">
                            📖 פנגייה
                        </button>
                    `;
                }

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); color: #e2e8f0;">
                        <td style="padding: 7px 12px; font-weight: 600;">${exam.name}</td>
                        <td style="padding: 7px 10px; text-align: center;">${statusBadge}</td>
                        <td style="padding: 7px 10px; text-align: center;">${scoreCell}</td>
                        <td style="padding: 7px 12px; text-align: left;">
                            ${solutionLinks}
                            <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" style="color: #94a3b8; text-decoration: none; font-size: 0.7rem; padding: 2px 4px;" title="דרייב הפקולטה">📁</a>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }
    };

    window.ExamReadinessHub = ExamReadinessHub;
})(window);
