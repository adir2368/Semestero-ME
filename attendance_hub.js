/**
 * ==============================================================================
 * Semestero ME - Attendance & Lecture Catch-Up Hub (נוכחות והשלמות)
 * Authoritative Attendance Tracking, Catch-Up Queue, Mandatory Quota Shields &
 * Pangea Summary Deep-Linking
 * ==============================================================================
 */

(function(global) {
    'use strict';

    const STORAGE_KEY_RECORDS = 'semestero_attendance_records_v2';
    const STORAGE_KEY_CATCHUP = 'semestero_catchup_queue_v2';
    const STORAGE_KEY_QUOTAS = 'semestero_mandatory_quotas_v2';

    // Standard Technion courses with mandatory attendance requirements
    const DEFAULT_MANDATORY_QUOTAS = {
        '394000': {
            name: 'חינוך גופני',
            category: 'ספורט',
            minRequired: 10,
            totalExpected: 13,
            maxAllowedAbsences: 2,
            icon: '⚽',
            rulesNote: 'חובת נוכחות ב-10 שיעורים לפחות מתוך 13. היעדרות שלישית פוסלת קורס!'
        },
        '394800': {
            name: 'חינוך גופני נבחרת / שחייה',
            category: 'ספורט',
            minRequired: 10,
            totalExpected: 13,
            maxAllowedAbsences: 2,
            icon: '🏊',
            rulesNote: 'חובת נוכחות ב-10 אימונים לפחות. דרוש אישור מאמן על כל היעדרות.'
        },
        '114032': {
            name: 'מעבדה 1 בפיסיקה',
            category: 'מעבדה',
            minRequired: 5,
            totalExpected: 5,
            maxAllowedAbsences: 0,
            icon: '🔬',
            rulesNote: 'נוכחות חובה 100% בכל 5 הניסויים. היעדרות מוצדקת מחייבת ניסוי השלמה ברישום מראש.'
        },
        '114033': {
            name: 'מעבדה 2 בפיסיקה',
            category: 'מעבדה',
            minRequired: 5,
            totalExpected: 5,
            maxAllowedAbsences: 0,
            icon: '🔬',
            rulesNote: 'נוכחות חובה 100% בכל 5 הניסויים והגנת דו"ח מכין.'
        },
        '324032': {
            name: "אנגלית למתקדמים א'",
            category: 'אנגלית',
            minRequired: 10,
            totalExpected: 13,
            maxAllowedAbsences: 2,
            icon: '🇬🇧',
            rulesNote: 'חובת נוכחות 80% (מקסימום 2 היעדרויות ללא אישור).'
        },
        '324033': {
            name: "אנגלית למתקדמים ב'",
            category: 'אנגלית',
            minRequired: 10,
            totalExpected: 13,
            maxAllowedAbsences: 2,
            icon: '🇬🇧',
            rulesNote: 'חובת נוכחות 80% (מקסימום 2 היעדרויות ללא אישור).'
        },
        '034038': {
            name: 'מעבדה להנדסת מכונות 1',
            category: 'מעבדה',
            minRequired: 8,
            totalExpected: 8,
            maxAllowedAbsences: 0,
            icon: '⚙️',
            rulesNote: 'נוכחות חובה 100% בכל ימי הניסוי במחלקת הנדסת מכונות.'
        }
    };

    const AttendanceHub = {
        records: {},
        catchupQueue: [],
        quotas: {},
        activeTab: 'catchup',

        init: function() {
            try {
                const storedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
                this.records = storedRecords ? JSON.parse(storedRecords) : {};

                const storedQueue = localStorage.getItem(STORAGE_KEY_CATCHUP);
                this.catchupQueue = storedQueue ? JSON.parse(storedQueue) : [];

                const storedQuotas = localStorage.getItem(STORAGE_KEY_QUOTAS);
                this.quotas = storedQuotas ? JSON.parse(storedQuotas) : JSON.parse(JSON.stringify(DEFAULT_MANDATORY_QUOTAS));
            } catch (err) {
                console.warn('[AttendanceHub] Storage load error:', err);
                this.records = {};
                this.catchupQueue = [];
                this.quotas = JSON.parse(JSON.stringify(DEFAULT_MANDATORY_QUOTAS));
            }

            this.updateBadgeCounts();
        },

        save: function() {
            try {
                localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
                localStorage.setItem(STORAGE_KEY_CATCHUP, JSON.stringify(this.catchupQueue));
                localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(this.quotas));
            } catch (err) {
                console.error('[AttendanceHub] Storage save error:', err);
            }
            this.updateBadgeCounts();

            // Bidirectional bridge to gameState and cloud sync
            try {
                if (typeof window !== 'undefined' && window.gameState) {
                    window.gameState.attendance = {
                        records: this.records,
                        catchupQueue: this.catchupQueue,
                        quotas: this.quotas,
                        updatedAt: Date.now()
                    };
                    if (typeof window.saveState === 'function') {
                        window.saveState(true);
                    }
                    if (window.AuthSync && typeof window.AuthSync.triggerDebouncedCloudSync === 'function') {
                        window.AuthSync.triggerDebouncedCloudSync(window.gameState);
                    }
                }
            } catch (syncErr) {
                console.warn('[AttendanceHub] Cloud state bridge sync warning:', syncErr);
            }
        },

        loadFromGameState: function(remoteAttendance) {
            if (!remoteAttendance || typeof remoteAttendance !== 'object') return;
            let modified = false;

            if (remoteAttendance.records && typeof remoteAttendance.records === 'object') {
                Object.keys(remoteAttendance.records).forEach(key => {
                    const rRec = remoteAttendance.records[key];
                    const lRec = this.records[key];
                    if (!lRec) {
                        this.records[key] = rRec;
                        modified = true;
                    } else if (rRec.timestamp && (!lRec.timestamp || rRec.timestamp > lRec.timestamp)) {
                        this.records[key] = rRec;
                        modified = true;
                    } else if (rRec.status === 'attended' && lRec.status !== 'attended') {
                        this.records[key] = rRec;
                        modified = true;
                    }
                });
            }

            if (Array.isArray(remoteAttendance.catchupQueue)) {
                remoteAttendance.catchupQueue.forEach(rItem => {
                    const idx = this.catchupQueue.findIndex(ci => ci.slotKey === rItem.slotKey || ci.id === rItem.id);
                    if (idx === -1) {
                        this.catchupQueue.push(rItem);
                        modified = true;
                    } else {
                        if (rItem.status === 'completed' && this.catchupQueue[idx].status !== 'completed') {
                            this.catchupQueue[idx] = rItem;
                            modified = true;
                        }
                    }
                });
            }

            if (remoteAttendance.quotas && typeof remoteAttendance.quotas === 'object') {
                this.quotas = Object.assign({}, DEFAULT_MANDATORY_QUOTAS, this.quotas, remoteAttendance.quotas);
            }

            if (modified) {
                try {
                    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
                    localStorage.setItem(STORAGE_KEY_CATCHUP, JSON.stringify(this.catchupQueue));
                    localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(this.quotas));
                } catch (e) {}
                this.updateBadgeCounts();
                this.refreshUI();
            }
        },

        /**
         * Computes unique key for a timetable slot
         */
        
        /**
         * Finds parallel sessions (lecture / tutorial) for a course that fit
         * cleanly into the student's active weekly schedule without conflicts.
         */
        findParallelSlotRecommendations: function(courseId, type, missedDayIndex, missedStartTime) {
            if (!courseId) return [];
            const cleanCode = String(courseId).replace(/\D/g, '');
            const rawCode = String(courseId).trim();

            let catalog = null;
            if (window.TimetableGenerator && window.TimetableGenerator.catalog) {
                catalog = window.TimetableGenerator.catalog;
            } else if (typeof TECH_COURSE_GROUPS_CATALOG !== 'undefined') {
                catalog = TECH_COURSE_GROUPS_CATALOG;
            } else if (window.TimetableStudio && window.TimetableStudio.catalog) {
                catalog = window.TimetableStudio.catalog;
            }
            if (!catalog) return [];

            const courseEntry = catalog[cleanCode] ||
                                catalog['0' + cleanCode] ||
                                catalog[cleanCode.replace(/^0+/, '')] ||
                                catalog[rawCode];
            if (!courseEntry || !courseEntry.slots || courseEntry.slots.length === 0) return [];

            const lowerType = String(type || '').toLowerCase();
            let targetSlotType = null;
            if (lowerType.includes('תרגול') || lowerType.includes('tutorial') || lowerType.includes('מעבדה') || lowerType.includes('lab')) {
                targetSlotType = 'tutorial';
            } else if (lowerType.includes('הרצאה') || lowerType.includes('lecture')) {
                targetSlotType = 'lecture';
            } else if (lowerType.includes('אימון') || lowerType.includes('ספורט') || lowerType.includes('sports')) {
                targetSlotType = 'sports';
            }

            let activeSchedule = null;
            if (typeof getActiveTimetableSchedule === 'function') {
                activeSchedule = getActiveTimetableSchedule();
            } else if (window.gameState && window.gameState.timetable) {
                activeSchedule = window.gameState.timetable;
            } else if (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                activeSchedule = CHEESEFORK_SEMESTER_SCHEDULE;
            }

            const parseTimeToMinutes = (t) => {
                if (!t || typeof t !== 'string') return 0;
                const parts = t.split(':').map(Number);
                return (parts[0] || 0) * 60 + (parts[1] || 0);
            };

            const recommendations = [];
            const relevantSlots = targetSlotType
                ? courseEntry.slots.filter(s => s.slotType === targetSlotType)
                : courseEntry.slots;

            relevantSlots.forEach(slot => {
                if (!slot.options) return;
                slot.options.forEach(opt => {
                    if (!opt.meetings) return;
                    opt.meetings.forEach(meeting => {
                        if (missedDayIndex !== undefined && missedDayIndex !== null &&
                            meeting.dayIndex === Number(missedDayIndex) &&
                            meeting.startTime === missedStartTime) {
                            return;
                        }

                        const mStart = parseTimeToMinutes(meeting.startTime);
                        const mEnd = parseTimeToMinutes(meeting.endTime);
                        if (mEnd <= mStart) return;

                        let hasConflict = false;
                        if (activeSchedule && activeSchedule.days) {
                            const schedDay = activeSchedule.days.find(d => d.dayIndex === meeting.dayIndex);
                            if (schedDay && schedDay.classes && schedDay.classes.length > 0) {
                                for (const c of schedDay.classes) {
                                    if (meeting.dayIndex === Number(missedDayIndex) && c.startTime === missedStartTime) {
                                        continue;
                                    }
                                    const cStart = parseTimeToMinutes(c.startTime);
                                    const cEnd = parseTimeToMinutes(c.endTime);
                                    if (mStart < cEnd && cStart < mEnd) {
                                        hasConflict = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (!hasConflict) {
                            const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
                            const dayName = meeting.dayName || dayNames[meeting.dayIndex] || ('יום ' + (meeting.dayIndex + 1));
                            recommendations.push({
                                courseId: cleanCode,
                                courseName: courseEntry.name,
                                slotType: slot.slotType,
                                slotName: slot.slotName || (slot.slotType === 'tutorial' ? 'תרגול' : 'הרצאה'),
                                groupId: opt.groupId,
                                lecturer: opt.lecturer || meeting.lecturer || '',
                                dayIndex: meeting.dayIndex,
                                dayName: dayName,
                                startTime: meeting.startTime,
                                endTime: meeting.endTime,
                                duration: meeting.duration || '',
                                room: meeting.room || opt.room || 'אולמן / דנציגר',
                                fitsSchedule: true,
                                displayText: dayName + ' ' + meeting.startTime + '–' + meeting.endTime + ' • קבוצה ' + opt.groupId + ' (' + (opt.lecturer || '') + ') • ' + (meeting.room || opt.room || '')
                            });
                        }
                    });
                });
            });

            recommendations.sort((a, b) => {
                if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
                return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
            });

            return recommendations;
        },

        getCanonicalDateForWeekDay: function(dayIndex, refDate) {
            const d = refDate ? new Date(refDate) : new Date();
            const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday, ...
            const targetDay = Number(dayIndex !== undefined && dayIndex !== null ? dayIndex : currentDay);
            const diff = targetDay - currentDay;
            d.setDate(d.getDate() + diff);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dayNum}`;
        },

        makeSlotKey: function(courseId, dayIndex, startTime, dateStr) {
            const canonicalDate = dateStr || this.getCanonicalDateForWeekDay(dayIndex);
            return `${String(courseId).trim()}_d${dayIndex}_${(startTime || '00:00').replace(':', '')}_${canonicalDate}`;
        },

        getCurrentDateString: function() {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        },

        getRecord: function(courseId, dayIndex, startTime, dateStr) {
            const key = this.makeSlotKey(courseId, dayIndex, startTime, dateStr);
            if (this.records[key]) return this.records[key];

            // Resilience fallback: if no dateStr provided, check if a record exists for this dayIndex & startTime in the current week
            if (!dateStr) {
                const prefix = `${String(courseId).trim()}_d${dayIndex}_${(startTime || '00:00').replace(':', '')}_`;
                const matchedKey = Object.keys(this.records).find(k => k.startsWith(prefix));
                if (matchedKey) return this.records[matchedKey];
            }
            return null;
        },

        /**
         * Toggle between attended / missed / un-marked
         */
        toggleAttendance: function(courseId, courseName, type, dayIndex, startTime, endTime, room, targetStatus) {
            const dateStr = this.getCurrentDateString();
            const key = this.makeSlotKey(courseId, dayIndex, startTime, dateStr);
            const current = this.records[key];

            if (current && current.status === targetStatus) {
                // Clicking again removes mark
                delete this.records[key];
                // Remove pending catchup item if this was missed
                if (targetStatus === 'missed') {
                    this.catchupQueue = this.catchupQueue.filter(item => item.slotKey !== key);
                }
                this.save();
                this.refreshUI();
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`בוטל סימון הנוכחות עבור [${courseName}]`, 'info');
                }
                return;
            }

            // Set new record
            this.records[key] = {
                slotKey: key,
                courseId: String(courseId).trim(),
                courseName: courseName,
                type: type || 'שיעור',
                dayIndex: Number(dayIndex),
                startTime: startTime,
                endTime: endTime,
                room: room || '',
                date: dateStr,
                status: targetStatus,
                timestamp: Date.now()
            };

            if (targetStatus === 'missed') {
                const parallelRecs = this.findParallelSlotRecommendations(courseId, type, dayIndex, startTime);
                this.createCatchupItem({
                    slotKey: key,
                    courseId: String(courseId).trim(),
                    courseName: courseName,
                    type: type || 'שיעור',
                    dayIndex: Number(dayIndex),
                    startTime: startTime,
                    endTime: endTime,
                    date: dateStr,
                    parallelRecs: parallelRecs
                });
                if (typeof showToastNotification === 'function') {
                    const recSuffix = parallelRecs.length > 0 ? (' (נמצאו ' + parallelRecs.length + ' השלמות פרונטליות פנויות במערכת! 💡)') : '';
                    showToastNotification('⚠️ [' + courseName + '] סומן כהוחסר ונוסף לתור ההשלמות!' + recSuffix + ' 📹', 'warning');
                }
            } else {
                // If it was attended, remove any pending catchup for this exact slot
                this.catchupQueue = this.catchupQueue.filter(item => item.slotKey !== key);
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`✓ נוכחות נרשמה בהצלחה עבור [${courseName}]! ✨`, 'success');
                }
            }

            this.save();
            this.refreshUI();
        },

        /**
         * Resolves Pangea chapter & Moodle video links for a missed class
         */
        createCatchupItem: function(meta) {
            // Check if already in queue
            const exists = this.catchupQueue.some(item => item.slotKey === meta.slotKey);
            if (exists) return;

            const cleanCode = String(meta.courseId).replace(/\D/g, '');
            let pangeaChapter = null;

            if (window.PangeaHub && typeof window.PangeaHub.getCourseData === 'function') {
                const cData = window.PangeaHub.getCourseData(cleanCode);
                if (cData && cData.lectures && cData.lectures.length > 0) {
                    // Try to guess week or pick first relevant lecture
                    const currentWeek = this.getCurrentAcademicWeek();
                    pangeaChapter = cData.lectures.find(l => l.number === currentWeek) || cData.lectures[0];
                }
            }

            const moodleMap = (typeof MOODLE26_COURSE_MAP !== 'undefined') ? MOODLE26_COURSE_MAP : {};
            const moodleCourseId = moodleMap[cleanCode] || moodleMap['0' + cleanCode] || moodleMap[meta.courseId];
            const directMoodleUrl = moodleCourseId
                ? `https://moodle26.technion.ac.il/course/view.php?id=${moodleCourseId}`
                : `https://moodle26.technion.ac.il/course/search.php?search=${encodeURIComponent(cleanCode)}`;
            const panoptoUrl = `https://panopto.technion.ac.il/Panopto/Pages/Sessions/List.aspx#query=${encodeURIComponent(cleanCode)}`;

            const catchupId = 'cu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const newItem = {
                id: catchupId,
                slotKey: meta.slotKey,
                courseId: cleanCode,
                courseName: meta.courseName,
                type: meta.type,
                date: meta.date,
                dayIndex: meta.dayIndex !== undefined ? meta.dayIndex : null,
                parallelRecs: meta.parallelRecs || this.findParallelSlotRecommendations(cleanCode, meta.type, meta.dayIndex, meta.startTime),
                startTime: meta.startTime,
                week: this.getCurrentAcademicWeek(),
                topic: pangeaChapter ? pangeaChapter.displayTitle : `${meta.type} שבוע ${this.getCurrentAcademicWeek()}`,
                pangeaUrl: pangeaChapter ? (pangeaChapter.url ? pangeaChapter.url.replace(/%20/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-') : null) : null,
                pangeaTitle: pangeaChapter ? pangeaChapter.displayTitle : null,
                panoptoUrl: panoptoUrl,
                moodleUrl: directMoodleUrl,
                status: 'pending', // 'pending' | 'watching' | 'completed'
                isMiluim: false,
                notes: '',
                createdAt: Date.now()
            };

            this.catchupQueue.unshift(newItem);
        },

        getCurrentAcademicWeek: function() {
            // Rough heuristic based on November 2026 Technion semester start
            // Technion Winter 2026/27 started around mid-October.
            const now = new Date();
            const start = new Date(2026, 9, 18); // Oct 18, 2026
            const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            const week = Math.max(1, Math.min(14, Math.floor(diffDays / 7) + 1));
            return week;
        },

        setCatchupStatus: function(catchupId, status) {
            const item = this.catchupQueue.find(i => i.id === catchupId);
            if (item) {
                item.status = status;
                this.save();
                this.renderModalBody();
                if (typeof showToastNotification === 'function') {
                    const label = status === 'completed' ? 'הושלם במלואו ✓' : (status === 'watching' ? 'בצפייה 📺' : 'ממתין להשלמה ⏳');
                    showToastNotification(`סטטוס השלמה עודכן: ${label}`, 'info');
                }
            }
        },

        toggleMiluim: function(catchupId) {
            const item = this.catchupQueue.find(i => i.id === catchupId);
            if (item) {
                item.isMiluim = !item.isMiluim;
                this.save();
                this.renderModalBody();
                if (typeof showToastNotification === 'function') {
                    showToastNotification(item.isMiluim ? '🇮🇱 סומן כהיעדרות מילואים מוצדקת' : 'בוטל סימון מילואים', 'info');
                }
            }
        },

        deleteCatchup: function(catchupId) {
            this.catchupQueue = this.catchupQueue.filter(i => i.id !== catchupId);
            this.save();
            this.renderModalBody();
        },

        getCourseStats: function(courseId) {
            const cleanCode = String(courseId).replace(/\D/g, '');
            const all = Object.values(this.records).filter(r => String(r.courseId).replace(/\D/g, '') === cleanCode);
            const attended = all.filter(r => r.status === 'attended').length;
            const missed = all.filter(r => r.status === 'missed').length;
            const total = attended + missed;
            const pct = total > 0 ? Math.round((attended / total) * 100) : 100;

            const quota = this.quotas[cleanCode];
            let safety = 'normal'; // 'safe' | 'warning' | 'danger'
            let remainingAllowed = null;

            const isPerpetual = (typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(cleanCode);
            if (isPerpetual) {
                safety = 'perpetual';
            } else if (quota) {
                remainingAllowed = Math.max(0, quota.maxAllowedAbsences - missed);
                if (missed > quota.maxAllowedAbsences) {
                    safety = 'danger';
                } else if (remainingAllowed <= 1) {
                    safety = 'warning';
                } else {
                    safety = 'safe';
                }
            }

            return {
                cleanCode,
                attended,
                missed,
                total,
                pct,
                quota,
                remainingAllowed,
                safety,
                isPerpetualDitch: isPerpetual
            };
        },

        updateBadgeCounts: function() {
            const pendingCount = this.catchupQueue.filter(i => i.status !== 'completed').length;
            
            // Notion header button badge
            const btnNotion = document.getElementById('btn-open-panopto-tracker');
            if (btnNotion) {
                const labelSpan = btnNotion.querySelector('span:last-child');
                if (labelSpan) {
                    labelSpan.textContent = pendingCount > 0 ? `נוכחות והשלמות (${pendingCount})` : 'נוכחות והשלמות';
                }
                btnNotion.style.color = pendingCount > 0 ? '#f43f5e' : '#34d399';
                btnNotion.style.borderColor = pendingCount > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(52, 211, 153, 0.4)';
            }

            // Timetable header button badge
            const btnTt = document.getElementById('btn-open-attendance-hub-timetable');
            if (btnTt) {
                const label = btnTt.querySelector('span:last-child');
                if (label) {
                    label.textContent = pendingCount > 0 ? `נוכחות והשלמות (${pendingCount})` : 'נוכחות והשלמות';
                }
            }
        },

        refreshUI: function() {
            if (typeof renderTimetableGrid === 'function') {
                renderTimetableGrid();
            }
            this.updateBadgeCounts();
        },

        openModal: function(tab = 'catchup') {
            this.activeTab = tab;
            let modal = document.getElementById('modal-attendance-hub');
            if (modal) modal.remove();

            modal = document.createElement('div');
            modal.id = 'modal-attendance-hub';
            modal.className = 'modal-backdrop active';
            modal.style.cssText = "position: fixed; inset: 0; background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 16px;";
            document.body.appendChild(modal);

            modal.innerHTML = `
                <div class="modal-card" style="background: #0f172a; border: 1px solid #10b981; border-radius: 16px; padding: 24px; width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto; direction: rtl; box-shadow: 0 15px 40px rgba(0,0,0,0.85);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                <span>📋</span>
                                <span>מרכז נוכחות והשלמות שיעורים (Attendance & Catch-Up)</span>
                            </h2>
                            <span style="font-size: 0.76rem; color: #94a3b8;">מעקב חובת נוכחות, סגירת פערים בהקלטות פנאופטו, וסיכומי פנגייה ישירים</span>
                        </div>
                        <button type="button" class="btn-close-attendance-modal" aria-label="סגור חלון" style="background: transparent; border: none; font-size: 1.4rem; color: #94a3b8; cursor: pointer; padding: 4px;">✕</button>
                    </div>

                    <!-- Segmented Tab Switcher -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
                        <button type="button" class="attendance-tab-btn ${this.activeTab === 'catchup' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('catchup')" style="flex: 1; min-width: 140px; padding: 8px 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: ${this.activeTab === 'catchup' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'catchup' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                            📹 תור השלמות ופנאופטו (${this.catchupQueue.filter(i => i.status !== 'completed').length})
                        </button>
                        <button type="button" class="attendance-tab-btn ${this.activeTab === 'selfstudy' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('selfstudy')" style="flex: 1; min-width: 140px; padding: 8px 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: ${this.activeTab === 'selfstudy' ? '#a855f7' : 'transparent'}; color: ${this.activeTab === 'selfstudy' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                            🚀 למידה עצמית (${this.getSelfStudyCount()})
                        </button>
                        <button type="button" class="attendance-tab-btn ${this.activeTab === 'mandatory' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('mandatory')" style="flex: 1; min-width: 140px; padding: 8px 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: ${this.activeTab === 'mandatory' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'mandatory' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                            🛡️ נוכחות חובה
                        </button>
                        <button type="button" class="attendance-tab-btn ${this.activeTab === 'history' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('history')" style="flex: 1; min-width: 120px; padding: 8px 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: ${this.activeTab === 'history' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'history' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                            📅 יומן מלא (${Object.keys(this.records).length})
                        </button>
                    </div>

                    <div id="attendance-hub-modal-body"></div>
                </div>
            `;

            const closeModal = () => modal.remove();
            modal.querySelectorAll('.btn-close-attendance-modal').forEach(b => b.addEventListener('click', closeModal));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            this.renderModalBody();
        },

        getSelfStudyCount: function() {
            if (typeof window.isCoursePerpetualDitch !== 'function') return 0;
            const curState = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState);
            if (!curState || !curState.courses) return 0;
            const activeCourses = Object.values(curState.courses).filter(c => c.status === 'active' || (c.semester && Number(c.semester) === 3));
            return activeCourses.filter(c => window.isCoursePerpetualDitch(c.code)).length;
        },

        switchTab: function(tabName) {
            this.activeTab = tabName;
            this.openModal(tabName);
        },

        renderModalBody: function() {
            const bodyEl = document.getElementById('attendance-hub-modal-body');
            if (!bodyEl) return;

            if (this.activeTab === 'catchup') {
                this.renderCatchupTab(bodyEl);
            } else if (this.activeTab === 'selfstudy') {
                this.renderSelfStudyTab(bodyEl);
            } else if (this.activeTab === 'mandatory') {
                this.renderMandatoryTab(bodyEl);
            } else if (this.activeTab === 'history') {
                this.renderHistoryTab(bodyEl);
            }
        },

        renderSelfStudyTab: function(bodyEl) {
            const curState = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState);
            const courses = (curState && curState.courses) ? Object.values(curState.courses).filter(c => c.status === 'active' || (c.semester && Number(c.semester) === 3)) : [];

            let html = `
                <div style="margin-bottom: 14px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 1.2rem;">🚀</span>
                        <strong style="color: #e9d5ff; font-size: 0.92rem;">מצב למידה עצמית (הברזה נצחית - Perpetual Ditch Mode):</strong>
                    </div>
                    הגדר קורסים שבהם בחרת ללמוד באופן עצמאי במקום להגיע להרצאות פרונטליות (למשל כאשר המרצה/מתרגל אינם אפקטיביים והלמידה נעשית מספרים, פנאופטו ופנגיאה). 
                    קורסים אלו מסומנים ישירות במערכת השעות, פטורים מהתראות הגעה לכיתה, ומספקים גישה מהירה בלחיצה אחת לכל המקורות המוקלטים.
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
            `;

            if (courses.length === 0) {
                html += `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94a3b8; font-size: 0.85rem;">
                        לא נמצאו קורסים פעילים בסמסטר הנוכחי.
                    </div>
                `;
            } else {
                courses.forEach(c => {
                    const isSelfStudy = (typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(c.code);
                    const resUrls = (typeof window.getCourseResourceUrls === 'function') ? window.getCourseResourceUrls(c.code) : { panoptoUrl: '#', pangeaUrl: '#' };
                    const borderColor = isSelfStudy ? '#a855f7' : 'rgba(255,255,255,0.1)';
                    const bgColor = isSelfStudy ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.03)';

                    html += `
                        <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 14px; position: relative; transition: all 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <strong style="font-size: 0.95rem; color: #f8fafc;">${c.name}</strong>
                                    <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace; display: block; margin-top: 2px;">(${c.code}) • סמסטר ${c.semester || 3}</span>
                                </div>
                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isSelfStudy ? '#a855f7' : 'rgba(255,255,255,0.1)'}; color: ${isSelfStudy ? '#fff' : '#94a3b8'};">
                                    ${isSelfStudy ? '🚀 למידה עצמית פעילה' : '🏛️ שיעור פרונטלי'}
                                </span>
                            </div>

                            <div style="font-size: 0.76rem; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
                                ${isSelfStudy 
                                    ? 'הקורס מוגדר בלמידה עצמאית. התראות הגעה מבוטלות ואי-הגעה לא נספרת כחיסור שלילי.' 
                                    : 'הקורס במעקב נוכחות פרונטלי רגיל.'}
                            </div>

                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                                <a href="${resUrls.panoptoUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; padding: 4px 8px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 6px; color: #fb7185; text-decoration: none; font-weight: 600;">
                                    📺 פנאופטו ↗
                                </a>
                                <a href="${resUrls.pangeaUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; padding: 4px 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px; color: #38bdf8; text-decoration: none; font-weight: 600;">
                                    📖 פנגיאה ↗
                                </a>
                                <a href="${resUrls.driveUrl || '#'}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; padding: 4px 8px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 6px; color: #c084fc; text-decoration: none; font-weight: 600;">
                                    📁 דרייב ↗
                                </a>
                            </div>

                            <div style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px; display: flex; justify-content: flex-end;">
                                <button type="button" onclick="window.toggleCoursePerpetualDitch('${c.code}'); window.AttendanceHub.renderModalBody();" style="font-size: 0.76rem; padding: 5px 12px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; background: ${isSelfStudy ? 'rgba(239, 68, 68, 0.2)' : '#a855f7'}; color: ${isSelfStudy ? '#f87171' : '#fff'}; transition: all 0.15s ease;">
                                    ${isSelfStudy ? '↩️ בטל והחזר לנוכחות פרונטלית' : '🚀 הפעל מצב למידה עצמית'}
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `</div>`;
            bodyEl.innerHTML = html;
        },

        renderCatchupTab: function(bodyEl) {
            const pending = this.catchupQueue.filter(i => i.status !== 'completed');
            const completed = this.catchupQueue.filter(i => i.status === 'completed');

            let html = `
                <!-- Catch-Up Summary Banner -->
                <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 12px; padding: 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 1rem; font-weight: 800; color: #fb7185; margin-bottom: 2px;">
                            ${pending.length === 0 ? '✨ אין שיעורים הממתינים להשלמה!' : `נותרו ${pending.length} שיעורים להשלמה`}
                        </div>
                        <div style="font-size: 0.78rem; color: #cbd5e1;">
                            השלמת שיעורים מחזקת את רצף הלמידה ומונעת הצטברות חובות פנאופטו לקראת תקופת המבחנים.
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.AttendanceHub.promptManualCatchup()" style="font-size: 0.78rem; padding: 6px 12px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 8px;">
                        ➕ הוסף השלמה ידנית
                    </button>
                </div>

                <!-- Active Pending Catchups -->
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
                        <span>⏳ ממתינים להשלמה (${pending.length}):</span>
                    </div>
            `;

            if (pending.length === 0) {
                html += `
                    <div style="text-align: center; padding: 24px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; color: #94a3b8; font-size: 0.82rem;">
                        <span style="font-size: 1.5rem; display: block; margin-bottom: 6px;">🎉</span>
                        כל הכבוד! נכחת בכל השיעורים או שהשלמת את כל ההקלטות.
                    </div>
                `;
            } else {
                pending.forEach(item => {
                    const isWatching = item.status === 'watching';
                    html += `
                        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid ${isWatching ? '#38bdf8' : 'rgba(244, 63, 94, 0.3)'}; border-radius: 12px; padding: 14px; transition: all 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                        <span style="font-weight: 800; color: #f8fafc; font-size: 0.95rem;">${item.courseName}</span>
                                        <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace;">(${item.courseId})</span>
                                        <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">${item.type}</span>
                                        ${item.isMiluim ? `<span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🇮🇱 מילואים</span>` : ''}
                                    </div>
                                    <div style="font-size: 0.78rem; color: #38bdf8; font-weight: 600;">
                                        📌 ${item.topic}
                                    </div>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                                        תאריך השיעור: ${item.date} • שעה: ${item.startTime || '—'}
                                    </div>
                                </div>

                                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    ${item.pangeaUrl ? `
                                        <button type="button" class="btn btn-sm btn-outline" onclick="if(window.PangeaHub) window.PangeaHub.openQuickPeek('${item.pangeaUrl}', '${item.pangeaTitle || item.topic}')" style="font-size: 0.74rem; padding: 4px 10px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 6px;" title="קרא סיכום הרצאה מהיר בפנגייה">
                                            📖 סיכום בפנגייה
                                        </button>
                                    ` : ''}
                                    <a href="${item.panoptoUrl || (`https://panopto.technion.ac.il/Panopto/Pages/Sessions/List.aspx#query=${encodeURIComponent(item.courseId)}`)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size: 0.74rem; padding: 4px 10px; color: #f43f5e; border-color: rgba(244, 63, 94, 0.4); border-radius: 6px; text-decoration: none; font-weight: 700;" title="מעבר ישיר להקלטות הקורס בפנאופטו הטכניוני">
                                        🎬 פנאופטו (הקלטות) ↗
                                    </a>
                                    <a href="${item.moodleUrl || 'https://moodle26.technion.ac.il/my/'}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size: 0.74rem; padding: 4px 10px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 6px; text-decoration: none;" title="מעבר ישיר לדף הקורס במודל 26">
                                        🎓 מודל 26 ↗
                                    </a>
                                    <button type="button" class="btn btn-sm ${isWatching ? 'btn-primary' : 'btn-outline'}" onclick="window.AttendanceHub.setCatchupStatus('${item.id}', '${isWatching ? 'pending' : 'watching'}')" style="font-size: 0.74rem; padding: 4px 8px; border-radius: 6px;">
                                        ${isWatching ? 'בצפייה כעת 📺' : 'סמן בצפייה'}
                                    </button>
                                    <button type="button" class="btn btn-sm" onclick="window.AttendanceHub.setCatchupStatus('${item.id}', 'completed')" style="font-size: 0.74rem; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 6px; font-weight: 700; cursor: pointer;">
                                        ✓ סמן שהושלם
                                    </button>
                                </div>
                            </div>
                            ${(() => {
                                const recs = (item.parallelRecs && item.parallelRecs.length > 0)
                                    ? item.parallelRecs
                                    : (window.AttendanceHub ? window.AttendanceHub.findParallelSlotRecommendations(item.courseId, item.type, item.dayIndex, item.startTime) : []);
                                if (!recs || recs.length === 0) return '';
                                return `
                                    <div class="catchup-parallel-box">
                                        <div class="catchup-parallel-header">
                                            <span class="catchup-parallel-title">
                                                <span>💡</span> השלמה פרונטלית מומלצת במערכת (${recs.length} מועדים מקבילים פנויים):
                                            </span>
                                            <span class="catchup-parallel-badge">✓ ללא חפיפה במערכת</span>
                                        </div>
                                        <div class="catchup-parallel-list">
                                            ${recs.map(rec => `
                                                <div class="catchup-parallel-item">
                                                    <div class="catchup-parallel-item-info">
                                                        <span class="catchup-parallel-time">${rec.dayName} ${rec.startTime}–${rec.endTime}</span>
                                                        <span class="catchup-parallel-group">${rec.slotName} קבוצה ${rec.groupId}${rec.lecturer ? (' • ' + rec.lecturer) : ''}</span>
                                                        <span class="catchup-parallel-room">📍 ${rec.room}</span>
                                                    </div>
                                                    <span class="catchup-parallel-chip-free">פנוי במערכת</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            })()}
                        </div>
                    `;
                });
            }

            html += `</div>`;

            // Completed Section
            if (completed.length > 0) {
                html += `
                    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: #34d399; margin-bottom: 8px;">
                            ✓ שיעורים שהושלמו (${completed.length}):
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${completed.map(item => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; color: #94a3b8;">
                                    <span>✓ <strong>${item.courseName}</strong>: ${item.topic} (${item.date})</span>
                                    <div style="display: flex; gap: 6px;">
                                        <button type="button" onclick="window.AttendanceHub.setCatchupStatus('${item.id}', 'pending')" style="background: none; border: none; color: #cbd5e1; cursor: pointer; text-decoration: underline; font-size: 0.72rem;">החזר לתור</button>
                                        <button type="button" onclick="window.AttendanceHub.deleteCatchup('${item.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.72rem;">מחק</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            bodyEl.innerHTML = html;
        },

        renderMandatoryTab: function(bodyEl) {
            let html = `
                <div style="margin-bottom: 14px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px;">
                    <strong>🛡️ מדדי בטיחות נוכחות חובה (Mandatory Attendance Shields):</strong>
                    מעקב חי אחר קורסים עם דרישות נוכחות קשיחות בטכניון. המערכת מחשבת באופן מיידי את יתרת ההיעדרויות המותרת ומתריעה לפני הגעה לאזור הסכנה.
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
            `;

            Object.entries(this.quotas).forEach(([code, quota]) => {
                const stats = this.getCourseStats(code);
                const isDanger = stats.safety === 'danger';
                const isWarning = stats.safety === 'warning';
                const borderColor = isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : 'rgba(255,255,255,0.1)');
                const bgColor = isDanger ? 'rgba(239, 68, 68, 0.08)' : (isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)');

                html += `
                    <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 14px; position: relative; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div>
                                <span style="font-size: 1.2rem; margin-left: 6px;">${quota.icon || '📚'}</span>
                                <strong style="font-size: 0.95rem; color: #f8fafc;">${quota.name}</strong>
                                <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace; display: block; margin-top: 2px;">(${code}) • ${quota.category}</span>
                            </div>
                            <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981')}; color: #fff;">
                                ${isDanger ? '⚠️ סכנת פסילת קורס!' : (isWarning ? '⚠️ התראה: גבולי' : 'תקין ✓')}
                            </span>
                        </div>

                        <!-- Progress Stats -->
                        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 6px;">
                            <span>נרשמה נוכחות: <strong>${stats.attended}</strong> שיעורים</span>
                            <span>היעדרויות: <strong style="color: ${stats.missed > 0 ? '#fb7185' : '#cbd5e1'};">${stats.missed}</strong> / ${quota.maxAllowedAbsences}</span>
                        </div>

                        <!-- Progress Bar -->
                        <div style="background: rgba(255, 255, 255, 0.08); border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                            <div style="background: ${isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981')}; height: 100%; width: ${Math.min(100, Math.round((stats.attended / quota.minRequired) * 100))}%;"></div>
                        </div>

                        <div style="font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
                            ${quota.rulesNote}
                        </div>

                        <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.72rem; color: #38bdf8;">
                                ${stats.remainingAllowed !== null ? `יתרת היעדרויות מותרת: <strong>${stats.remainingAllowed}</strong>` : ''}
                            </span>
                            <button type="button" onclick="window.AttendanceHub.quickAddSession('${code}', '${quota.name}')" style="font-size: 0.72rem; padding: 3px 8px; background: rgba(255,255,255,0.08); border: none; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
                                + רשום נוכחות ידנית
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            bodyEl.innerHTML = html;
        },

        renderHistoryTab: function(bodyEl) {
            const recordsList = Object.values(this.records).sort((a, b) => b.timestamp - a.timestamp);

            let html = `
                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9;">יומן שיעורים מלא (${recordsList.length} רשומות):</span>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.AttendanceHub.clearAllHistory()" style="font-size: 0.72rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
                        🗑️ איפוס היסטוריה
                    </button>
                </div>
            `;

            if (recordsList.length === 0) {
                html += `
                    <div style="text-align: center; padding: 32px; color: #94a3b8; font-size: 0.82rem;">
                        טרם נרשמו שיעורים במערכת. לחץ על "הייתי" או "החסרתי" בלוח המערכת כדי להתחיל מעקב!
                    </div>
                `;
            } else {
                html += `
                    <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
                        ${recordsList.map(r => `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; border-right: 3px solid ${r.status === 'attended' ? '#10b981' : '#ef4444'};">
                                <div>
                                    <strong style="color: #f8fafc;">${r.courseName}</strong>
                                    <span style="font-size: 0.72rem; color: #94a3b8; margin-right: 6px;">(${r.type} • ${r.startTime || '—'})</span>
                                    <span style="font-size: 0.7rem; color: #64748b; display: block;">תאריך: ${r.date}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: ${r.status === 'attended' ? '#34d399' : '#f87171'};">
                                        ${r.status === 'attended' ? '✓ נוכחתי' : '✗ הוחסר'}
                                    </span>
                                    <button type="button" onclick="window.AttendanceHub.deleteRecord('${r.slotKey}')" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem;" title="מחק רשומה זו">&times;</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            bodyEl.innerHTML = html;
        },

        quickAddSession: function(code, name) {
            const dateStr = this.getCurrentDateString();
            const key = `manual_${code}_${Date.now()}`;
            this.records[key] = {
                slotKey: key,
                courseId: code,
                courseName: name,
                type: 'שיעור',
                date: dateStr,
                status: 'attended',
                timestamp: Date.now()
            };
            this.save();
            this.renderModalBody();
            if (typeof showToastNotification === 'function') {
                showToastNotification(`✓ נוכחות נוספה עבור ${name}!`, 'success');
            }
        },

        deleteRecord: function(slotKey) {
            delete this.records[slotKey];
            this.save();
            this.renderModalBody();
        },

        clearAllHistory: function() {
            if (confirm('האם אתה בטוח שברצונך לאפס את כל היסטוריית הנוכחות?')) {
                this.records = {};
                this.catchupQueue = [];
                this.save();
                this.renderModalBody();
            }
        },

        promptManualCatchup: function() {
            const course = prompt('הזן שם קורס או מספר קורס (למשל: 034010 דינמיקה):');
            if (!course) return;
            const topic = prompt('הזן נושא או פרק להשלמה (למשל: הרצאה 4 - תנע זוויתי):') || 'השלמת שיעור';
            
            const cleanCode = course.replace(/\D/g, '') || '000000';
            const moodleMap = (typeof MOODLE26_COURSE_MAP !== 'undefined') ? MOODLE26_COURSE_MAP : {};
            const moodleCourseId = moodleMap[cleanCode] || moodleMap['0' + cleanCode];
            const directMoodleUrl = moodleCourseId
                ? `https://moodle26.technion.ac.il/course/view.php?id=${moodleCourseId}`
                : `https://moodle26.technion.ac.il/course/search.php?search=${encodeURIComponent(cleanCode)}`;
            const panoptoUrl = `https://panopto.technion.ac.il/Panopto/Pages/Sessions/List.aspx#query=${encodeURIComponent(cleanCode)}`;

            const newItem = {
                id: 'cu_man_' + Date.now(),
                slotKey: 'manual_' + Date.now(),
                courseId: cleanCode,
                courseName: course,
                type: 'הרצאה',
                date: this.getCurrentDateString(),
                week: this.getCurrentAcademicWeek(),
                topic: topic,
                pangeaUrl: null,
                panoptoUrl: panoptoUrl,
                moodleUrl: directMoodleUrl,
                status: 'pending',
                isMiluim: false,
                notes: '',
                createdAt: Date.now()
            };

            this.catchupQueue.unshift(newItem);
            this.save();
            this.renderModalBody();
            if (typeof showToastNotification === 'function') {
                showToastNotification('✓ השלמה ידנית נוספה בהצלחה לתור!', 'success');
            }
        }
    };

    // Auto initialize on load
    AttendanceHub.init();

    global.AttendanceHub = AttendanceHub;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AttendanceHub;
    }
})(typeof window !== 'undefined' ? window : globalThis);
