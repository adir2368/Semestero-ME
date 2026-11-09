/**
 * Semestero ME • Universal Academic Calendar Sync Engine (RFC 5545 iCalendar)
 * Generates standards-compliant .ics feeds with:
 * 1. Recurring weekly classes (RRULE) with rooms, lecturers, and 15-min alarms
 * 2. Homework & assignment deadlines (Moodle & user tasks) with dual 24h & 2h alarms
 * 3. Moed A and Moed B exam dates with 1-day alarms
 * Supports direct download, native Android sharing, and Google Calendar / Apple Calendar subscription.
 */
(function(window) {
    'use strict';

    const CalendarSyncEngine = {
        // Fallback semester boundary dates for Technion Winter 2026/27 (תשפ״ז)
        DEFAULT_SEM_START: new Date(2026, 9, 18), // Oct 18, 2026
        DEFAULT_SEM_END_STR: '20270215T235959Z',  // Feb 15, 2027

        /**
         * Converts day index (0=Sunday ... 6=Saturday) to standard ICS day abbreviations
         */
        dayIndexToIcsDay: function(idx) {
            const map = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };
            return map[idx] || 'SU';
        },

        /**
         * Generates a deterministic date string YYYYMMDD for the first occurrence of a weekday in the semester
         */
        getFirstWeekdayDate: function(dayIndex, semStartDate) {
            const start = semStartDate || this.DEFAULT_SEM_START;
            const d = new Date(start);
            const diff = (dayIndex - start.getDay() + 7) % 7;
            d.setDate(start.getDate() + diff);
            return d.toISOString().split('T')[0].replace(/-/g, '');
        },

        /**
         * Cleans time string "08:30" to "083000"
         */
        cleanTime: function(timeStr) {
            if (!timeStr) return '080000';
            const parts = timeStr.trim().split(':');
            const h = (parts[0] || '08').padStart(2, '0');
            const m = (parts[1] || '00').padStart(2, '0');
            return `${h}${m}00`;
        },

        /**
         * Escapes special characters for RFC 5545 text fields
         */
        escapeIcsText: function(str) {
            if (!str) return '';
            return String(str)
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\r?\n/g, '\\n');
        },

        /**
         * Generates the complete unified RFC 5545 .ics string
         * @param {Object} options Options toggling components and alarms
         */
        generateUnifiedICS: function(options) {
            const opts = Object.assign({
                includeTimetable: true,
                includeTasks: true,
                includeExams: true,
                alarmMinutesClass: 15,
                alarmHoursTask: [24, 2],
                alarmDaysExam: 1
            }, options || {});

            const icsLines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Semestero ME//Technion Universal Academic Calendar//HE',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'X-WR-CALNAME:Semestero ME - יומן לימודים, משימות ומבחנים',
                'X-WR-TIMEZONE:Asia/Jerusalem'
            ];

            let countClasses = 0;
            let countTasks = 0;
            let countExams = 0;

            const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            // 1. RECURRING TIMETABLE CLASSES
            if (opts.includeTimetable) {
                let schedule = null;
                if (typeof getActiveTimetableSchedule === 'function') {
                    schedule = getActiveTimetableSchedule();
                }
                if ((!schedule || !schedule.days || schedule.days.every(d => !d.classes || d.classes.length === 0)) && typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                    schedule = CHEESEFORK_SEMESTER_SCHEDULE;
                }
                if ((!schedule || !schedule.days || schedule.days.every(d => !d.classes || d.classes.length === 0)) && window.gameState && window.gameState.timetable) {
                    schedule = window.gameState.timetable;
                }

                if (schedule && schedule.days && Array.isArray(schedule.days)) {
                    schedule.days.forEach(day => {
                        if (!day.classes || day.classes.length === 0) return;
                        const icsDay = CalendarSyncEngine.dayIndexToIcsDay(day.dayIndex);
                        const firstDateStr = CalendarSyncEngine.getFirstWeekdayDate(day.dayIndex, CalendarSyncEngine.DEFAULT_SEM_START);

                        day.classes.forEach(c => {
                            if (!c.startTime || !c.endTime) return;
                            countClasses++;

                            const startClean = CalendarSyncEngine.cleanTime(c.startTime);
                            const endClean = CalendarSyncEngine.cleanTime(c.endTime);
                            const cleanCode = String(c.courseId || c.courseCode || 'class').replace(/\D/g, '');
                            const uid = `class-${cleanCode}-${day.dayIndex}-${startClean}@semesterome.local`;
                            const courseName = c.courseName || c.title || 'שיעור';
                            const classType = c.type || 'שיעור';
                            const roomName = (c.room && c.room.trim() && c.room !== 'כיתת טכניון') ? c.room.trim() : 'הטכניון';
                            const lecturer = c.lecturer || c.teacher || 'סגל הוראה';

                            icsLines.push(
                                'BEGIN:VEVENT',
                                `UID:${uid}`,
                                `DTSTAMP:${nowUtc}`,
                                `DTSTART;TZID=Asia/Jerusalem:${firstDateStr}T${startClean}`,
                                `DTEND;TZID=Asia/Jerusalem:${firstDateStr}T${endClean}`,
                                `RRULE:FREQ=WEEKLY;BYDAY=${icsDay};UNTIL=${CalendarSyncEngine.DEFAULT_SEM_END_STR}`,
                                `SUMMARY:🎓 ${CalendarSyncEngine.escapeIcsText(courseName)} (${classType})`,
                                `LOCATION:${CalendarSyncEngine.escapeIcsText(roomName)}`,
                                `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`קורס: ${courseName} (${cleanCode})\nסוג: ${classType}\nמרצה/מתרגל: ${lecturer}\nמיקום: ${roomName}\nסנכרון חכם דרך Semestero ME 🚀`)}`,
                                'CATEGORIES:Academic,Classes,SemesteroME',
                                'STATUS:CONFIRMED'
                            );

                            if (opts.alarmMinutesClass > 0) {
                                icsLines.push(
                                    'BEGIN:VALARM',
                                    'ACTION:DISPLAY',
                                    `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`תזכורת שיעור: ${courseName} בעוד ${opts.alarmMinutesClass} דק' ב-${roomName}`)}`,
                                    `TRIGGER:-PT${opts.alarmMinutesClass}M`,
                                    'END:VALARM'
                                );
                            }

                            icsLines.push('END:VEVENT');
                        });
                    });
                }
            }

            // 2. HOMEWORK & ASSIGNMENT SUBMISSION DEADLINES
            if (opts.includeTasks && window.gameState) {
                const taskList = [];
                // Collect tasks from gameState.tasks
                if (Array.isArray(window.gameState.tasks)) {
                    window.gameState.tasks.forEach(t => taskList.push(t));
                }
                // Collect tasks from enrolled active courses
                if (window.gameState.courses) {
                    Object.values(window.gameState.courses).forEach(c => {
                        if (!c || c.status !== 'active' || !Array.isArray(c.tasks)) return;
                        c.tasks.forEach(t => {
                            if (!taskList.some(existing => existing.id === t.id)) {
                                taskList.push(Object.assign({ courseCode: c.code, courseName: c.name }, t));
                            }
                        });
                    });
                }

                taskList.forEach(task => {
                    if (!task.dueDate) return;
                    const cleanDueDate = task.dueDate.replace(/-/g, '');
                    if (!/^\d{8}$/.test(cleanDueDate)) return;
                    countTasks++;

                    const isDone = Boolean(task.completed || task.status === 'done' || task.status === 'submitted');
                    const courseLabel = task.courseName || task.course || task.courseCode || 'כללי';
                    const timeClean = task.dueTime ? CalendarSyncEngine.cleanTime(task.dueTime) : '235900';
                    const uid = `task-${task.id || cleanDueDate}@semesterome.local`;

                    icsLines.push(
                        'BEGIN:VEVENT',
                        `UID:${uid}`,
                        `DTSTAMP:${nowUtc}`,
                        `DTSTART;TZID=Asia/Jerusalem:${cleanDueDate}T${timeClean}`,
                        `DTEND;TZID=Asia/Jerusalem:${cleanDueDate}T${timeClean}`,
                        `SUMMARY:📝 ${isDone ? '[הושלם ✓] ' : 'הגשה: '}[${CalendarSyncEngine.escapeIcsText(courseLabel)}] ${CalendarSyncEngine.escapeIcsText(task.title || 'משימה')}`,
                        `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`קורס: ${courseLabel}\nמשימה: ${task.title || ''}\nמועד הגשה: ${task.dueDate} ${task.dueTime || ''}\nסטטוס: ${isDone ? 'הושלם במלואו ✓' : 'ממתין להגשה'}\nסנכרון משימות Semestero ME`)}`,
                        'CATEGORIES:Homework,Tasks,Moodle',
                        `STATUS:${isDone ? 'COMPLETED' : 'CONFIRMED'}`
                    );

                    if (!isDone) {
                        // 24 hours alarm
                        icsLines.push(
                            'BEGIN:VALARM',
                            'ACTION:DISPLAY',
                            `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`⚠️ דדליין מחר: ${task.title || 'משימה'} ב-${courseLabel}`)}`,
                            'TRIGGER:-P1D',
                            'END:VALARM'
                        );
                        // 2 hours alarm
                        icsLines.push(
                            'BEGIN:VALARM',
                            'ACTION:DISPLAY',
                            `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`🚨 דדליין בעוד שעתיים! הגש את ${task.title || 'משימה'} ב-${courseLabel}`)}`,
                            'TRIGGER:-PT2H',
                            'END:VALARM'
                        );
                    }

                    icsLines.push('END:VEVENT');
                });
            }

            // 3. MOED A & MOED B EXAMS
            if (opts.includeExams && window.gameState && window.gameState.courses) {
                Object.values(window.gameState.courses).forEach(c => {
                    if (!c || c.status !== 'active') return;
                    const courseName = c.name || 'קורס';
                    const cleanCode = String(c.code || '').replace(/\D/g, '');

                    // Moed A
                    if (c.moedA) {
                        const cleanDateA = String(c.moedA).split('T')[0].replace(/-/g, '');
                        if (/^\d{8}$/.test(cleanDateA)) {
                            countExams++;
                            const uidA = `exam-${cleanCode}-moedA-${cleanDateA}@semesterome.local`;
                            icsLines.push(
                                'BEGIN:VEVENT',
                                `UID:${uidA}`,
                                `DTSTAMP:${nowUtc}`,
                                `DTSTART;TZID=Asia/Jerusalem:${cleanDateA}T090000`,
                                `DTEND;TZID=Asia/Jerusalem:${cleanDateA}T120000`,
                                `SUMMARY:🎯 מבחן מועד א' - ${CalendarSyncEngine.escapeIcsText(courseName)} (${cleanCode})`,
                                `LOCATION:${CalendarSyncEngine.escapeIcsText(c.moedARoom || 'הטכניון')}`,
                                `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`בחינה סופית מועד א' בקורס ${courseName} (${cleanCode})\nתאריך: ${c.moedA}\nבהצלחה! Semestero ME`)}`,
                                'CATEGORIES:Exams,Finals',
                                'STATUS:CONFIRMED',
                                'BEGIN:VALARM',
                                'ACTION:DISPLAY',
                                `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`🎯 מחר: מבחן מועד א' ב-${courseName}!`)}`,
                                'TRIGGER:-P1D',
                                'END:VALARM',
                                'END:VEVENT'
                            );
                        }
                    }

                    // Moed B
                    if (c.moedB) {
                        const cleanDateB = String(c.moedB).split('T')[0].replace(/-/g, '');
                        if (/^\d{8}$/.test(cleanDateB)) {
                            countExams++;
                            const uidB = `exam-${cleanCode}-moedB-${cleanDateB}@semesterome.local`;
                            icsLines.push(
                                'BEGIN:VEVENT',
                                `UID:${uidB}`,
                                `DTSTAMP:${nowUtc}`,
                                `DTSTART;TZID=Asia/Jerusalem:${cleanDateB}T090000`,
                                `DTEND;TZID=Asia/Jerusalem:${cleanDateB}T120000`,
                                `SUMMARY:🎯 מבחן מועד ב' - ${CalendarSyncEngine.escapeIcsText(courseName)} (${cleanCode})`,
                                `LOCATION:${CalendarSyncEngine.escapeIcsText(c.moedBRoom || 'הטכניון')}`,
                                `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`בחינה סופית מועד ב' בקורס ${courseName} (${cleanCode})\nתאריך: ${c.moedB}\nבהצלחה! Semestero ME`)}`,
                                'CATEGORIES:Exams,Finals',
                                'STATUS:CONFIRMED',
                                'BEGIN:VALARM',
                                'ACTION:DISPLAY',
                                `DESCRIPTION:${CalendarSyncEngine.escapeIcsText(`🎯 מחר: מבחן מועד ב' ב-${courseName}!`)}`,
                                'TRIGGER:-P1D',
                                'END:VALARM',
                                'END:VEVENT'
                            );
                        }
                    }
                });
            }

            icsLines.push('END:VCALENDAR');
            const totalCount = countClasses + countTasks + countExams;
            return {
                icsString: icsLines.join('\r\n'),
                countClasses,
                countTasks,
                countExams,
                totalCount
            };
        },

        /**
         * Downloads the generated ICS file or triggers native calendar share on Android Capacitor
         */
        downloadUnifiedICS: function(options) {
            const result = this.generateUnifiedICS(options);
            if (result.totalCount === 0) {
                if (typeof showToastNotification === 'function') {
                    showToastNotification('⚠️ לא נמצאו שיעורים, משימות או מבחנים פעילים לייצוא ליומן', 'warning');
                }
                return false;
            }

            const fileName = 'Semestero_ME_Academic_Calendar.ics';
            const blob = new Blob([result.icsString], { type: 'text/calendar;charset=utf-8' });

            // Check if running on Android Capacitor or supports Web Share API with files
            if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'text/calendar' })] })) {
                const file = new File([blob], fileName, { type: 'text/calendar' });
                navigator.share({
                    files: [file],
                    title: 'Semestero ME יומן לימודים',
                    text: 'יומן לימודים, משימות הגשה ומבחנים מ-Semestero ME'
                }).catch(() => {
                    // Fallback to direct blob download
                    CalendarSyncEngine.triggerBlobDownload(blob, fileName);
                });
            } else {
                this.triggerBlobDownload(blob, fileName);
            }

            if (typeof showToastNotification === 'function') {
                showToastNotification(`📅 הורד יומן אקדמי מלא (${result.countClasses} שיעורים, ${result.countTasks} משימות, ${result.countExams} מבחנים) בהצלחה!`, 'success');
            }
            return true;
        },

        /**
         * Standard anchor download trigger for desktop & browsers
         */
        triggerBlobDownload: function(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 300);
        },

        /**
         * Opens the visual interactive modal allowing users to customize what to export
         */
        openCalendarSyncModal: function() {
            let modal = document.getElementById('modal-unified-calendar-sync');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-unified-calendar-sync';
                modal.className = 'modal-backdrop-custom';
                modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:100050; align-items:center; justify-content:center; padding:16px; direction:rtl;';
                modal.innerHTML = `
                    <div style="background:#0f172a; border:1px solid rgba(56,189,248,0.3); border-radius:16px; width:100%; max-width:480px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.7); overflow:hidden; display:flex; flex-direction:column;">
                        <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; background:rgba(15,23,42,0.9);">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.4rem;">📅</span>
                                <h3 style="margin:0; font-size:1.05rem; font-weight:800; color:#f8fafc;">סנכרון לוח שנה לטלפון ולמחשב</h3>
                            </div>
                            <button type="button" onclick="document.getElementById('modal-unified-calendar-sync').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:1.3rem; cursor:pointer; padding:4px;">✕</button>
                        </div>
                        <div style="padding:20px; font-size:0.88rem; color:#cbd5e1; line-height:1.5; display:flex; flex-direction:column; gap:14px;">
                            <p style="margin:0; color:#94a3b8; font-size:0.84rem;">
                                הורד קובץ יומן סטנדרטי (ICS) התואם ל-Google Calendar, ל-Samsung Calendar, ל-Apple Calendar ול-Outlook.
                            </p>
                            <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px;">
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                    <input type="checkbox" id="cal-opt-classes" checked style="accent-color:#38bdf8; width:17px; height:17px;">
                                    <div>
                                        <div style="font-weight:700; color:#f1f5f9;">מערכת שעות שבועית (שיעורים ומעבדות)</div>
                                        <div style="font-size:0.75rem; color:#94a3b8;">אירועים שבועיים חוזרים (RRULE) עם מספרי כיתות והתראה 15 דק' לפני</div>
                                    </div>
                                </label>
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                    <input type="checkbox" id="cal-opt-tasks" checked style="accent-color:#38bdf8; width:17px; height:17px;">
                                    <div>
                                        <div style="font-weight:700; color:#f1f5f9;">דדליינים ומשימות הגשה (מתוך מודל)</div>
                                        <div style="font-size:0.75rem; color:#94a3b8;">הגשות שיעורי בית פעילות עם התראות כפולות (24 שעות ושעתיים לפני)</div>
                                    </div>
                                </label>
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                    <input type="checkbox" id="cal-opt-exams" checked style="accent-color:#38bdf8; width:17px; height:17px;">
                                    <div>
                                        <div style="font-weight:700; color:#f1f5f9;">מועדי בחינות סופיות (מועד א' ומועד ב')</div>
                                        <div style="font-size:0.75rem; color:#94a3b8;">בחינות סמסטר חורף תשפ״ז עם התראה יום מראש</div>
                                    </div>
                                </label>
                            </div>
                            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); border-radius:10px; padding:10px 12px; font-size:0.76rem; color:#38bdf8; display:flex; align-items:flex-start; gap:8px;">
                                <span>💡</span>
                                <span><strong>טיפ:</strong> לאחר ההורדה, פתח את הקובץ ישירות בטלפון והקש "הוסף הכל ליומן", או ייבא אותו בלחיצה אחת ב-Google Calendar במחשב.</span>
                            </div>
                        </div>
                        <div style="padding:14px 20px; border-top:1px solid rgba(255,255,255,0.08); background:rgba(15,23,42,0.9); display:flex; align-items:center; justify-content:space-between; gap:12px;">
                            <button type="button" onclick="document.getElementById('modal-unified-calendar-sync').style.display='none'" class="btn btn-sm btn-outline" style="border-color:rgba(255,255,255,0.2); color:#94a3b8; border-radius:8px; padding:6px 14px;">ביטול</button>
                            <button type="button" id="btn-do-download-ics" style="background:linear-gradient(135deg,#0284c7,#0369a1); border:none; color:#fff; font-weight:700; font-size:0.86rem; border-radius:8px; padding:8px 18px; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(2,132,199,0.35);">
                                <span>📥</span>
                                <span>הורד קובץ יומן (ICS)</span>
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                document.getElementById('btn-do-download-ics').addEventListener('click', function() {
                    const includeTimetable = document.getElementById('cal-opt-classes').checked;
                    const includeTasks = document.getElementById('cal-opt-tasks').checked;
                    const includeExams = document.getElementById('cal-opt-exams').checked;
                    CalendarSyncEngine.downloadUnifiedICS({
                        includeTimetable,
                        includeTasks,
                        includeExams
                    });
                    modal.style.display = 'none';
                });
            }

            modal.style.display = 'flex';
        }
    };

    window.CalendarSyncEngine = CalendarSyncEngine;
})(window);
