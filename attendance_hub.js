/**
 * ==============================================================================
 * Semestero ME - Attendance & Lecture Catch-Up Hub (נוכחות והשלמות)
 * Authoritative Attendance Tracking, Catch-Up Queue, Mandatory Quota Shields &
 * Pangea Summary Deep-Linking
 * ==============================================================================
 */

(function(global) {
    'use strict';

    const encArg = (val) => encodeURIComponent(String(val || '')).replace(/'/g, '%27');
    const escHtml = (val) => (typeof window !== 'undefined' && window.__semesteroUtils && window.__semesteroUtils.escapeHtml)
        ? window.__semesteroUtils.escapeHtml(val)
        : String(val || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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
        prunedSlotPrefixes: [],
        activeTab: 'catchup',
        selectedWeek: null,

        normalizeCourseCode: function(raw) {
            const str = String(raw || '').trim();
            if (!str) return '';
            const digits = str.replace(/\D/g, '');
            if (!digits) return str;
            if (digits.length === 8 && digits.startsWith('0')) {
                if (digits.startsWith('0394')) return digits;
                return digits.substring(1, 4) + digits.substring(5);
            }
            if (digits.length === 7 && digits.startsWith('394')) return '0' + digits;
            if (digits.length === 5) return '0' + digits;
            return digits;
        },

        getSlotSignature: function(courseId, dayIndex, startTime) {
            const normCode = this.normalizeCourseCode(courseId);
            if (!normCode || dayIndex === undefined || dayIndex === null || isNaN(Number(dayIndex))) return '';
            return `${normCode}|${Number(dayIndex)}|${String(startTime || '').trim()}`;
        },

        isScheduleClassEnrolled: function(courseId, dayIndex, startTime, isCustom) {
            const normCode = this.normalizeCourseCode(courseId);
            if (!normCode) return false;
            const rawCode = String(courseId || '').trim();
            const stripped = normCode.replace(/^0+/, '');
            const gs = (typeof window !== 'undefined' && window.gameState) ? window.gameState : null;
            if (!gs) return true;

            if (Array.isArray(gs.removedCourses)) {
                const isRemoved = gs.removedCourses.some(rc => {
                    const rNorm = this.normalizeCourseCode(rc);
                    const rStrip = String(rc || '').replace(/^0+/, '');
                    return rNorm === normCode || rStrip === stripped || String(rc || '').trim() === rawCode;
                });
                if (isRemoved) return false;
            }

            const sig = this.getSlotSignature(normCode, dayIndex, startTime);
            if (sig && Array.isArray(gs.dismissedScheduleSlots) && gs.dismissedScheduleSlots.includes(sig)) {
                return false;
            }

            const courses = gs.courses || {};
            const courseObj = courses[rawCode] || courses[normCode] || courses[stripped] || courses['0' + stripped] || courses['00' + stripped] || null;
            if (courseObj) {
                if (courseObj.status === 'mastered' || courseObj.status === 'dropped' || courseObj.status === 'exempt') {
                    return false;
                }
            }
            const phys2 = courses['114052'] || courses['01140052'];
            if (phys2 && phys2.status !== 'active' && (stripped === '114052' || stripped === '114075')) {
                return false;
            }
            return true;
        },

        isSlotPruned: function(courseId, dayIndex, startTime, remotePrunedList) {
            const sig = this.getSlotSignature(courseId, dayIndex, startTime);
            if (!sig) return false;
            const gs = (typeof window !== 'undefined' && window.gameState) ? window.gameState : null;
            const dismissed = (gs && Array.isArray(gs.dismissedScheduleSlots)) ? gs.dismissedScheduleSlots : [];
            const localPruned = Array.isArray(this.prunedSlotPrefixes) ? this.prunedSlotPrefixes : [];
            const extraPruned = Array.isArray(remotePrunedList) ? remotePrunedList : [];
            return localPruned.includes(sig) || dismissed.includes(sig) || extraPruned.includes(sig);
        },

        unpruneSlotSignature: function(courseId, dayIndex, startTime) {
            const sig = this.getSlotSignature(courseId, dayIndex, startTime);
            if (!sig) return;
            if (Array.isArray(this.prunedSlotPrefixes)) {
                this.prunedSlotPrefixes = this.prunedSlotPrefixes.filter(s => s !== sig);
            }
            const gs = (typeof window !== 'undefined' && window.gameState) ? window.gameState : null;
            if (gs && Array.isArray(gs.dismissedScheduleSlots)) {
                gs.dismissedScheduleSlots = gs.dismissedScheduleSlots.filter(s => s !== sig);
            }
        },

        pruneOrphanedRecordsAgainstSchedule: function(schedule, options = {}) {
            const opts = options || {};
            const activeSigs = new Set();
            const syncedCourseSet = new Set();

            if (Array.isArray(opts.syncedCourseCodes)) {
                opts.syncedCourseCodes.forEach(c => {
                    const norm = this.normalizeCourseCode(c);
                    if (norm) syncedCourseSet.add(norm);
                });
            }

            if (schedule && Array.isArray(schedule.days)) {
                schedule.days.forEach(day => {
                    if (!day || !Array.isArray(day.classes)) return;
                    day.classes.forEach(cls => {
                        if (!cls) return;
                        const norm = this.normalizeCourseCode(cls.courseId || cls.courseCode);
                        if (!norm) return;
                        syncedCourseSet.add(norm);
                        const sig = this.getSlotSignature(norm, day.dayIndex, cls.startTime);
                        if (sig) {
                            activeSigs.add(sig);
                            if (opts.clearReaddedFromPruned !== false) {
                                this.unpruneSlotSignature(norm, day.dayIndex, cls.startTime);
                            }
                        }
                    });
                });
            }

            if (!Array.isArray(this.prunedSlotPrefixes)) this.prunedSlotPrefixes = [];
            const removedSigs = new Set();
            const targetSpecificSig = opts.removeSpecificSlot
                ? this.getSlotSignature(opts.removeSpecificSlot.courseId, opts.removeSpecificSlot.dayIndex, opts.removeSpecificSlot.startTime)
                : '';
            const targetCourseNorm = opts.removeCourseCode ? this.normalizeCourseCode(opts.removeCourseCode) : '';

            const shouldPruneEntry = (entry) => {
                if (!entry || String(entry.slotKey || '').startsWith('manual_')) return false;
                const norm = this.normalizeCourseCode(entry.courseId);
                if (!norm) return false;
                if (targetCourseNorm && norm === targetCourseNorm) return true;
                const sig = this.getSlotSignature(norm, entry.dayIndex, entry.startTime);
                if (!sig) return false;
                if (targetSpecificSig && sig === targetSpecificSig) {
                    removedSigs.add(sig);
                    return true;
                }
                if (opts.pruneReplacedCourseSlots && syncedCourseSet.has(norm) && !activeSigs.has(sig)) {
                    removedSigs.add(sig);
                    return true;
                }
                if (!this.isScheduleClassEnrolled(norm, entry.dayIndex, entry.startTime, false)) {
                    removedSigs.add(sig);
                    return true;
                }
                return false;
            };

            let changed = false;
            Object.keys(this.records || {}).forEach(k => {
                const rec = this.records[k];
                if (shouldPruneEntry(rec)) {
                    delete this.records[k];
                    changed = true;
                }
            });

            if (Array.isArray(this.catchupQueue) && this.catchupQueue.length > 0) {
                const beforeLen = this.catchupQueue.length;
                this.catchupQueue = this.catchupQueue.filter(item => !shouldPruneEntry(item));
                if (this.catchupQueue.length !== beforeLen) changed = true;
            }

            removedSigs.forEach(sig => {
                if (!this.prunedSlotPrefixes.includes(sig)) {
                    this.prunedSlotPrefixes.push(sig);
                    changed = true;
                }
            });

            if (changed && !opts.skipSave) {
                this.save();
                this.refreshUI();
            }
            return changed;
        },

        init: function() {
            try {
                const storedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
                this.records = storedRecords ? JSON.parse(storedRecords) : {};

                const storedQueue = localStorage.getItem(STORAGE_KEY_CATCHUP);
                this.catchupQueue = storedQueue ? JSON.parse(storedQueue) : [];

                const storedQuotas = localStorage.getItem(STORAGE_KEY_QUOTAS);
                this.quotas = storedQuotas ? JSON.parse(storedQuotas) : JSON.parse(JSON.stringify(DEFAULT_MANDATORY_QUOTAS));
                const gs = (typeof window !== 'undefined' && window.gameState) ? window.gameState : null;
                if (gs && gs.attendance && Array.isArray(gs.attendance.prunedSlotPrefixes)) {
                    this.prunedSlotPrefixes = Array.from(new Set(gs.attendance.prunedSlotPrefixes));
                }
            } catch (err) {
                console.warn('[AttendanceHub] Storage load error:', err);
                this.records = {};
                this.catchupQueue = [];
                this.quotas = JSON.parse(JSON.stringify(DEFAULT_MANDATORY_QUOTAS));
            }

            this.selectedWeek = Math.max(1, Math.min(13, this.getCurrentAcademicWeek()));
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
                        prunedSlotPrefixes: Array.isArray(this.prunedSlotPrefixes) ? this.prunedSlotPrefixes : [],
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
            const remotePruned = Array.isArray(remoteAttendance.prunedSlotPrefixes) ? remoteAttendance.prunedSlotPrefixes : [];
            if (remotePruned.length > 0) {
                if (!Array.isArray(this.prunedSlotPrefixes)) this.prunedSlotPrefixes = [];
                remotePruned.forEach(sig => {
                    if (sig && !this.prunedSlotPrefixes.includes(sig)) {
                        this.prunedSlotPrefixes.push(sig);
                        modified = true;
                    }
                });
            }

            // Apply pruned tombstones locally too so stale entries aren't re-uploaded
            if (Array.isArray(this.prunedSlotPrefixes) && this.prunedSlotPrefixes.length > 0) {
                Object.keys(this.records).forEach(k => {
                    const rec = this.records[k];
                    if (rec && !String(rec.slotKey || '').startsWith('manual_') && this.isSlotPruned(rec.courseId, rec.dayIndex, rec.startTime)) {
                        delete this.records[k];
                        modified = true;
                    }
                });
                const prevLen = this.catchupQueue.length;
                this.catchupQueue = this.catchupQueue.filter(ci => !ci || String(ci.slotKey || '').startsWith('manual_') || !this.isSlotPruned(ci.courseId, ci.dayIndex, ci.startTime));
                if (this.catchupQueue.length !== prevLen) modified = true;
            }

            if (remoteAttendance.records && typeof remoteAttendance.records === 'object') {
                Object.keys(remoteAttendance.records).forEach(key => {
                    const rRec = remoteAttendance.records[key];
                    if (!rRec) return;
                    if (!String(rRec.slotKey || key || '').startsWith('manual_') &&
                        (this.isSlotPruned(rRec.courseId, rRec.dayIndex, rRec.startTime, remotePruned) ||
                         !this.isScheduleClassEnrolled(rRec.courseId, rRec.dayIndex, rRec.startTime, false))) {
                        return;
                    }
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
                    if (!rItem) return;
                    if (!String(rItem.slotKey || '').startsWith('manual_') &&
                        (this.isSlotPruned(rItem.courseId, rItem.dayIndex, rItem.startTime, remotePruned) ||
                         !this.isScheduleClassEnrolled(rItem.courseId, rItem.dayIndex, rItem.startTime, false))) {
                        return;
                    }
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

        getSelectedWeek: function() {
            const w = Number(this.selectedWeek || this.getCurrentAcademicWeek());
            return Math.max(1, Math.min(13, w));
        },

        setSelectedWeek: function(weekNum) {
            const w = Math.max(1, Math.min(13, Number(weekNum) || this.getCurrentAcademicWeek()));
            this.selectedWeek = w;
            this.refreshUI();
            const modalEl = document.getElementById('modal-attendance-hub');
            if (modalEl && modalEl.classList && modalEl.classList.contains('active')) {
                this.renderModalBody();
            }
            return w;
        },

        getCanonicalDateForSemesterWeekDay: function(weekNum, dayIndex, refDate) {
            const w = Math.max(1, Math.min(13, Number(weekNum || this.getSelectedWeek())));
            const fallbackDay = refDate ? new Date(refDate).getDay() : new Date().getDay();
            const targetDay = Number(dayIndex !== undefined && dayIndex !== null ? dayIndex : fallbackDay);
            const dt = new Date(Date.UTC(2026, 9, 25 + (w - 1) * 7 + targetDay));
            const y = dt.getUTCFullYear();
            const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const dayNum = String(dt.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${dayNum}`;
        },

        getCanonicalDateForWeekDay: function(dayIndex, refDate) {
            if (!refDate) {
                return this.getCanonicalDateForSemesterWeekDay(this.getSelectedWeek(), dayIndex);
            }
            const d = new Date(refDate);
            const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday, ...
            const targetDay = Number(dayIndex !== undefined && dayIndex !== null ? dayIndex : currentDay);
            const diff = targetDay - currentDay;
            d.setDate(d.getDate() + diff);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dayNum}`;
        },

        getWeekDateRangeLabel: function(weekNum) {
            const w = Math.max(1, Math.min(13, Number(weekNum || this.getSelectedWeek())));
            const sun = new Date(Date.UTC(2026, 9, 25 + (w - 1) * 7));
            const thu = new Date(Date.UTC(2026, 9, 25 + (w - 1) * 7 + 4));
            const fmt = (dt) => `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
            return `${fmt(sun)} – ${fmt(thu)}`;
        },

        getAcademicWeekForDateStr: function(dateStr) {
            if (!dateStr || typeof dateStr !== 'string') return this.getCurrentAcademicWeek();
            const parts = dateStr.split('-').map(Number);
            if (parts.length !== 3 || parts.some(isNaN)) return this.getCurrentAcademicWeek();
            const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
            const w1Utc = Date.UTC(2026, 9, 25); // Sunday of Week 1 (Winter 2026/27)
            const diffDays = Math.round((targetUtc - w1Utc) / 86400000);
            return Math.max(1, Math.min(13, Math.floor(diffDays / 7) + 1));
        },

        makeSlotKey: function(courseId, dayIndex, startTime, dateStr, weekNum) {
            const targetWeek = Number(weekNum || this.getSelectedWeek());
            const canonicalDate = dateStr || this.getCanonicalDateForSemesterWeekDay(targetWeek, dayIndex);
            return `${String(courseId).trim()}_d${dayIndex}_${(startTime || '00:00').replace(':', '')}_${canonicalDate}`;
        },

        getCurrentDateString: function() {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        },

        getRecord: function(courseId, dayIndex, startTime, dateStr, weekNum) {
            const targetWeek = Number(weekNum || this.getSelectedWeek());
            const canonicalDate = dateStr || this.getCanonicalDateForSemesterWeekDay(targetWeek, dayIndex);
            const key = this.makeSlotKey(courseId, dayIndex, startTime, canonicalDate, targetWeek);
            if (this.records[key]) return this.records[key];

            // Same-week resilience fallback: match by normalized course code + day + startTime within the SAME semester week
            if (!dateStr) {
                const normCourse = this.normalizeCourseCode(courseId);
                const prefix = `${String(courseId).trim()}_d${dayIndex}_${(startTime || '00:00').replace(':', '')}_`;
                const matchedKey = Object.keys(this.records).find(k => {
                    const rec = this.records[k];
                    if (!rec || String(rec.slotKey || k || '').startsWith('manual_')) return false;
                    const recWeek = rec.week ? Number(rec.week) : this.getAcademicWeekForDateStr(rec.date);
                    if (recWeek !== targetWeek) return false;
                    if (k.startsWith(prefix)) return true;
                    return this.normalizeCourseCode(rec.courseId) === normCourse &&
                           Number(rec.dayIndex) === Number(dayIndex) &&
                           String(rec.startTime || '').trim() === String(startTime || '').trim();
                });
                if (matchedKey) return this.records[matchedKey];
            }
            return null;
        },

        /**
         * Toggle between attended / missed / un-marked for a specific semester week
         */
        toggleAttendance: function(courseId, courseName, type, dayIndex, startTime, endTime, room, targetStatus, weekNum) {
            const targetWeek = Number(weekNum || this.getSelectedWeek());
            const dateStr = this.getCanonicalDateForSemesterWeekDay(targetWeek, dayIndex);
            const key = this.makeSlotKey(courseId, dayIndex, startTime, dateStr, targetWeek);
            const existingSameWeek = this.records[key] || this.getRecord(courseId, dayIndex, startTime, null, targetWeek);

            if (existingSameWeek && existingSameWeek.status === targetStatus) {
                const removeKey = existingSameWeek.slotKey || key;
                delete this.records[removeKey];
                delete this.records[key];
                if (targetStatus === 'missed') {
                    this.catchupQueue = this.catchupQueue.filter(item => item.slotKey !== removeKey && item.slotKey !== key);
                }
                this.save();
                this.refreshUI();
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`בוטל סימון הנוכחות עבור [${courseName}] (שבוע ${targetWeek})`, 'info');
                }
                return;
            }

            if (existingSameWeek && existingSameWeek.slotKey && existingSameWeek.slotKey !== key) {
                delete this.records[existingSameWeek.slotKey];
                this.catchupQueue = this.catchupQueue.filter(item => item.slotKey !== existingSameWeek.slotKey);
            }

            // Set new canonical week-pinned record
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
                week: targetWeek,
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
                    week: targetWeek,
                    parallelRecs: parallelRecs
                });
                if (typeof showToastNotification === 'function') {
                    const recSuffix = parallelRecs.length > 0 ? (' (נמצאו ' + parallelRecs.length + ' השלמות פרונטליות פנויות במערכת! 💡)') : '';
                    showToastNotification('⚠️ [' + courseName + '] (שבוע ' + targetWeek + ') סומן כהוחסר ונוסף לתור ההשלמות!' + recSuffix + ' 📹', 'warning');
                }
            } else {
                // If it was attended, remove any pending catchup for this exact slot
                this.catchupQueue = this.catchupQueue.filter(item => item.slotKey !== key);
                if (typeof showToastNotification === 'function') {
                    showToastNotification(`✓ נוכחות נרשמה עבור [${courseName}] (שבוע ${targetWeek})! ✨`, 'success');
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
            const itemWeek = Number(meta.week || this.getSelectedWeek());
            let pangeaChapter = null;

            if (window.PangeaHub && typeof window.PangeaHub.getCourseData === 'function') {
                const cData = window.PangeaHub.getCourseData(cleanCode);
                if (cData && cData.lectures && cData.lectures.length > 0) {
                    pangeaChapter = cData.lectures.find(l => l.number === itemWeek) || cData.lectures[0];
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
                week: itemWeek,
                topic: pangeaChapter ? pangeaChapter.displayTitle : `${meta.type} שבוע ${itemWeek}`,
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

        getCurrentAcademicWeek: function(refDate) {
            // Aligned with Technion Winter 2026/27 semester (Week 1 starts Sunday Oct 25, 2026 for Oct 28 kickoff)
            const now = refDate ? new Date(refDate) : new Date();
            const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
            const week1SundayUtc = Date.UTC(2026, 9, 25);
            const diffDays = Math.round((nowUtc - week1SundayUtc) / 86400000);
            const week = Math.max(1, Math.min(13, Math.floor(diffDays / 7) + 1));
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
            const normCode = this.normalizeCourseCode(courseId);
            const all = Object.values(this.records).filter(r => {
                if (!r) return false;
                const rNorm = this.normalizeCourseCode(r.courseId);
                return rNorm === normCode || String(r.courseId).replace(/\D/g, '') === cleanCode;
            });
            const attended = all.filter(r => r.status === 'attended').length;
            const missed = all.filter(r => r.status === 'missed').length;
            const total = attended + missed;
            const pct = total > 0 ? Math.round((attended / total) * 100) : 100;

            const quota = this.quotas[cleanCode];
            let safety = 'normal'; // 'safe' | 'warning' | 'danger'
            let remainingAllowed = null;

            const isPerpetual = (typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(cleanCode);
            const ditchMode = (typeof window.getCoursePerpetualDitchMode === 'function') ? window.getCoursePerpetualDitchMode(cleanCode) : (isPerpetual ? 'all' : 'none');
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
                isPerpetualDitch: isPerpetual,
                perpetualDitchMode: ditchMode
            };
        },

        classifySlotCategory: function(type) {
            if (typeof window.classifySessionDitchCategory === 'function') {
                return window.classifySessionDitchCategory(type);
            }
            const lower = String(type || '').toLowerCase();
            if (lower.includes('תרגול') || lower.includes('מעבדה') || lower.includes('tutorial') || lower.includes('recitation') || lower.includes('lab')) {
                return 'tutorial';
            }
            if (lower.includes('הרצאה') || lower.includes('lecture') || lower.includes('פרונטלי') || lower.includes('שיעור')) {
                return 'lecture';
            }
            return 'other';
        },

        getWeekStats: function(weekNum, scheduleOverride) {
            const targetWeek = Number(weekNum || this.getSelectedWeek());
            let schedule = scheduleOverride || null;
            if (!schedule) {
                const getSchedFn = (typeof getActiveTimetableSchedule === 'function')
                    ? getActiveTimetableSchedule
                    : ((typeof window !== 'undefined' && typeof window.getActiveTimetableSchedule === 'function') ? window.getActiveTimetableSchedule : null);
                if (getSchedFn) {
                    schedule = getSchedFn();
                } else if (typeof window !== 'undefined' && window.gameState && window.gameState.timetable) {
                    schedule = window.gameState.timetable;
                } else if (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                    schedule = CHEESEFORK_SEMESTER_SCHEDULE;
                }
            }
            let totalSlots = 0;
            let attended = 0;
            let missed = 0;
            let perpetual = 0;
            let unmarked = 0;

            if (schedule && Array.isArray(schedule.days)) {
                schedule.days.forEach(day => {
                    if (!day || !Array.isArray(day.classes)) return;
                    day.classes.forEach(c => {
                        if (!c || !this.isScheduleClassEnrolled(c.courseId, day.dayIndex, c.startTime, c.isCustom)) return;
                        totalSlots++;
                        const rec = this.getRecord(c.courseId, day.dayIndex, c.startTime, null, targetWeek);
                        const isPerp = (typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(c.courseId, c.type);
                        if (rec && rec.status === 'attended') attended++;
                        else if (rec && rec.status === 'missed') missed++;
                        else if (isPerp) perpetual++;
                        else unmarked++;
                    });
                });
            }

            // Include any recorded entries in targetWeek not already covered if schedule was absent
            if (totalSlots === 0) {
                Object.values(this.records).forEach(r => {
                    if (!r) return;
                    if (!String(r.slotKey || '').startsWith('manual_') && !this.isScheduleClassEnrolled(r.courseId, r.dayIndex, r.startTime, false)) return;
                    const recWeek = r.week ? Number(r.week) : this.getAcademicWeekForDateStr(r.date);
                    if (recWeek !== targetWeek) return;
                    totalSlots++;
                    if (r.status === 'attended') attended++;
                    else if (r.status === 'missed') missed++;
                });
            }

            const marked = attended + missed;
            const pct = marked > 0 ? Math.round((attended / marked) * 100) : null;
            return { week: targetWeek, totalSlots, attended, missed, perpetual, unmarked, marked, pct };
        },

        getSemesterAnalytics: function(scheduleOverride) {
            let schedule = scheduleOverride || null;
            if (!schedule) {
                const getSchedFn = (typeof getActiveTimetableSchedule === 'function')
                    ? getActiveTimetableSchedule
                    : ((typeof window !== 'undefined' && typeof window.getActiveTimetableSchedule === 'function') ? window.getActiveTimetableSchedule : null);
                if (getSchedFn) {
                    schedule = getSchedFn();
                } else if (typeof window !== 'undefined' && window.gameState && window.gameState.timetable) {
                    schedule = window.gameState.timetable;
                } else if (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                    schedule = CHEESEFORK_SEMESTER_SCHEDULE;
                }
            }

            const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
            const slotMap = new Map();

            if (schedule && Array.isArray(schedule.days)) {
                schedule.days.forEach(day => {
                    if (!day || !Array.isArray(day.classes)) return;
                    day.classes.forEach(c => {
                        if (!c) return;
                        if (!this.isScheduleClassEnrolled(c.courseId, day.dayIndex, c.startTime, c.isCustom)) return;
                        const normCode = this.normalizeCourseCode(c.courseId) || String(c.courseId || '').trim();
                        const sKey = `${normCode}|${day.dayIndex}|${c.startTime || ''}`;
                        if (!slotMap.has(sKey)) {
                            slotMap.set(sKey, {
                                courseId: normCode,
                                courseName: c.courseName || normCode,
                                type: c.type || 'שיעור',
                                dayIndex: Number(day.dayIndex),
                                dayName: day.name || dayNames[Number(day.dayIndex)] || '',
                                startTime: c.startTime || '',
                                endTime: c.endTime || '',
                                room: c.room || ''
                            });
                        }
                    });
                });
            }

            const weeks = {};
            for (let w = 1; w <= 13; w++) {
                weeks[w] = {
                    week: w,
                    dateRange: this.getWeekDateRangeLabel(w),
                    attended: 0,
                    missed: 0,
                    perpetual: 0,
                    unmarked: 0,
                    marked: 0,
                    pct: null
                };
            }

            const courseMap = new Map();
            const matrixRows = [];
            let totalAttended = 0;
            let totalMissed = 0;
            let lectureAttended = 0;
            let lectureMissed = 0;
            let tutorialAttended = 0;
            let tutorialMissed = 0;

            const ensureCourse = (courseId, courseName) => {
                const normCode = String(courseId).replace(/\D/g, '').replace(/^0+/, '') || String(courseId);
                if (!courseMap.has(normCode)) {
                    const mode = (typeof window.getCoursePerpetualDitchMode === 'function')
                        ? window.getCoursePerpetualDitchMode(courseId)
                        : ((typeof window.isCoursePerpetualDitch === 'function' && window.isCoursePerpetualDitch(courseId)) ? 'all' : 'none');
                    courseMap.set(normCode, {
                        courseId: String(courseId),
                        courseName: courseName || String(courseId),
                        attended: 0,
                        missed: 0,
                        marked: 0,
                        pct: null,
                        lectureAttended: 0,
                        lectureMissed: 0,
                        tutorialAttended: 0,
                        tutorialMissed: 0,
                        perpetualDitchMode: mode
                    });
                }
                return courseMap.get(normCode);
            };

            slotMap.forEach(slot => {
                const cat = this.classifySlotCategory(slot.type);
                const isSlotPerp = (typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(slot.courseId, slot.type);
                const cStats = ensureCourse(slot.courseId, slot.courseName);
                const row = {
                    courseId: slot.courseId,
                    courseName: slot.courseName,
                    type: slot.type,
                    category: cat,
                    dayIndex: slot.dayIndex,
                    dayName: slot.dayName,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    room: slot.room,
                    isPerpetual: isSlotPerp,
                    weeks: {},
                    attended: 0,
                    missed: 0
                };

                for (let w = 1; w <= 13; w++) {
                    const rec = this.getRecord(slot.courseId, slot.dayIndex, slot.startTime, null, w);
                    if (rec && rec.status === 'attended') {
                        row.weeks[w] = 'attended';
                        row.attended++;
                        weeks[w].attended++;
                        cStats.attended++;
                        totalAttended++;
                        if (cat === 'lecture') { lectureAttended++; cStats.lectureAttended++; }
                        else if (cat === 'tutorial') { tutorialAttended++; cStats.tutorialAttended++; }
                    } else if (rec && rec.status === 'missed') {
                        row.weeks[w] = 'missed';
                        row.missed++;
                        weeks[w].missed++;
                        cStats.missed++;
                        totalMissed++;
                        if (cat === 'lecture') { lectureMissed++; cStats.lectureMissed++; }
                        else if (cat === 'tutorial') { tutorialMissed++; cStats.tutorialMissed++; }
                    } else if (isSlotPerp) {
                        row.weeks[w] = 'perpetual';
                        weeks[w].perpetual++;
                    } else {
                        row.weeks[w] = 'unmarked';
                        weeks[w].unmarked++;
                    }
                }
                matrixRows.push(row);
            });

            // Include manual quickAdd records in totals for enrolled courses only
            Object.values(this.records).forEach(r => {
                if (!r || !String(r.slotKey || '').startsWith('manual_')) return;
                if (r.courseId && !this.isScheduleClassEnrolled(r.courseId, r.dayIndex, r.startTime, true)) return;
                const w = Math.max(1, Math.min(13, Number(r.week || this.getAcademicWeekForDateStr(r.date))));
                const cStats = ensureCourse(r.courseId, r.courseName);
                if (r.status === 'attended') {
                    totalAttended++;
                    cStats.attended++;
                    weeks[w].attended++;
                } else if (r.status === 'missed') {
                    totalMissed++;
                    cStats.missed++;
                    weeks[w].missed++;
                }
            });

            matrixRows.sort((a, b) => {
                if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
                return String(a.startTime).localeCompare(String(b.startTime));
            });

            for (let w = 1; w <= 13; w++) {
                weeks[w].marked = weeks[w].attended + weeks[w].missed;
                weeks[w].pct = weeks[w].marked > 0 ? Math.round((weeks[w].attended / weeks[w].marked) * 100) : null;
            }

            const courses = Array.from(courseMap.values()).map(c => {
                c.marked = c.attended + c.missed;
                c.pct = c.marked > 0 ? Math.round((c.attended / c.marked) * 100) : null;
                return c;
            });

            const totalMarked = totalAttended + totalMissed;
            const overallPct = totalMarked > 0 ? Math.round((totalAttended / totalMarked) * 100) : null;
            const lectureTotal = lectureAttended + lectureMissed;
            const lecturePct = lectureTotal > 0 ? Math.round((lectureAttended / lectureTotal) * 100) : null;
            const tutorialTotal = tutorialAttended + tutorialMissed;
            const tutorialPct = tutorialTotal > 0 ? Math.round((tutorialAttended / tutorialTotal) * 100) : null;

            return {
                currentWeek: this.getCurrentAcademicWeek(),
                selectedWeek: this.getSelectedWeek(),
                totalAttended,
                totalMissed,
                totalMarked,
                overallPct,
                lectureAttended,
                lectureMissed,
                lectureTotal,
                lecturePct,
                tutorialAttended,
                tutorialMissed,
                tutorialTotal,
                tutorialPct,
                weeks,
                courses,
                matrixRows
            };
        },

        cycleMatrixCellAttendance: function(courseId, courseName, type, dayIndex, startTime, endTime, room, weekNum) {
            const w = Number(weekNum || this.getSelectedWeek());
            const existing = this.getRecord(courseId, dayIndex, startTime, null, w);
            if (!existing) {
                this.toggleAttendance(courseId, courseName, type, dayIndex, startTime, endTime, room, 'attended', w);
            } else if (existing.status === 'attended') {
                this.toggleAttendance(courseId, courseName, type, dayIndex, startTime, endTime, room, 'missed', w);
            } else {
                this.toggleAttendance(courseId, courseName, type, dayIndex, startTime, endTime, room, 'missed', w);
            }
            this.renderModalBody();
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
            const modalEl = (typeof document !== 'undefined') ? document.getElementById('modal-attendance-hub') : null;
            if (modalEl && modalEl.classList && modalEl.classList.contains('active')) {
                this.renderModalBody();
            }
        },

        _tabHistory: [],
        _fromSwitchTab: false,

        close: function() {
            const modal = document.getElementById('modal-attendance-hub');
            if (modal) modal.remove();
            this._tabHistory = [];
        },

        goBack: function() {
            if (this._tabHistory && this._tabHistory.length > 0) {
                const prevTab = this._tabHistory.pop();
                if (prevTab && prevTab !== this.activeTab) {
                    this.switchTab(prevTab, true);
                    return true;
                }
            }
            this.close();
            return true;
        },

        openModal: function(tab = 'catchup') {
            const wasOpen = !!document.getElementById('modal-attendance-hub');
            if (!wasOpen && !this._fromSwitchTab) {
                this._tabHistory = [];
                if (typeof window.pushMobileBackHistory === 'function') {
                    window.pushMobileBackHistory('attendance-hub');
                }
            }
            this.activeTab = tab;
            let modal = document.getElementById('modal-attendance-hub');
            if (modal) modal.remove();

            modal = document.createElement('div');
            modal.id = 'modal-attendance-hub';
            modal.className = 'modal-backdrop active';
            modal.style.cssText = "position: fixed; inset: 0; background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 16px;";
            document.body.appendChild(modal);

            const hasTabBack = this._tabHistory && this._tabHistory.length > 0;
            modal.innerHTML = `
                <div class="modal-card modal-content" style="background: #0f172a; border: 1px solid #10b981; border-radius: 16px; padding: 0; width: 100%; max-width: 860px; max-height: calc(100dvh - 32px); display: flex; flex-direction: column; overflow: hidden; direction: rtl; box-shadow: 0 15px 40px rgba(0,0,0,0.85); box-sizing: border-box;">
                    <div class="modal-header attendance-modal-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 14px 18px 10px; gap: 10px; flex-shrink: 0; background: #0f172a;">
                        <div style="flex: 1 1 200px; min-width: 0;">
                            <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                <span>📋</span>
                                <span>מרכז נוכחות, מעקב שבועי והשלמות שיעורים</span>
                            </h2>
                            <span style="font-size: 0.76rem; color: #94a3b8; display: block; margin-top: 2px;">מעקב נוכחות לפי 13 שבועות הסמסטר, סטטיסטיקות, השלמות פנאופטו ופנגייה</span>
                        </div>
                        <div class="attendance-header-actions" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <button type="button" onclick="window.AttendanceHub.goBack()" class="btn-back-attendance-modal" aria-label="חזרה" title="${hasTabBack ? 'חזרה ללשונית הקודמת' : 'חזרה'}" style="background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(16, 185, 129, 0.45); color: #6ee7b7; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; padding: 5px 10px; white-space: nowrap;">→ חזרה</button>
                            <button type="button" class="modal-close btn-close-attendance-modal" aria-label="סגור חלון" style="position: static; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; cursor: pointer; font-size: 1.25rem; line-height: 1;">✕</button>
                        </div>
                    </div>

                    <div class="modal-body attendance-modal-scroll" style="padding: 12px 18px 18px; overflow-y: auto; overflow-x: hidden; flex: 1 1 auto; min-height: 0; box-sizing: border-box;">
                        <div class="timetable-week-navigator" id="attendance-hub-week-navigator" style="margin-bottom: 14px;"></div>

                        <!-- Segmented Tab Switcher -->
                        <div class="attendance-tabs-switcher" style="display: flex; gap: 6px; margin-bottom: 16px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
                            <button type="button" data-att-tab="catchup" class="attendance-tab-btn ${this.activeTab === 'catchup' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('catchup')" style="flex: 1; min-width: 125px; padding: 8px 8px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; background: ${this.activeTab === 'catchup' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'catchup' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                                📹 תור השלמות (${this.catchupQueue.filter(i => i.status !== 'completed').length})
                            </button>
                            <button type="button" data-att-tab="stats" class="attendance-tab-btn ${this.activeTab === 'stats' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('stats')" style="flex: 1; min-width: 145px; padding: 8px 8px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; background: ${this.activeTab === 'stats' ? '#0284c7' : 'transparent'}; color: ${this.activeTab === 'stats' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                                📊 סטטיסטיקות ומעקב שבועי
                            </button>
                            <button type="button" data-att-tab="selfstudy" class="attendance-tab-btn ${this.activeTab === 'selfstudy' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('selfstudy')" style="flex: 1; min-width: 125px; padding: 8px 8px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; background: ${this.activeTab === 'selfstudy' ? '#a855f7' : 'transparent'}; color: ${this.activeTab === 'selfstudy' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                                🚀 למידה עצמית (${this.getSelfStudyCount()})
                            </button>
                            <button type="button" data-att-tab="mandatory" class="attendance-tab-btn ${this.activeTab === 'mandatory' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('mandatory')" style="flex: 1; min-width: 115px; padding: 8px 8px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; background: ${this.activeTab === 'mandatory' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'mandatory' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                                🛡️ חובה
                            </button>
                            <button type="button" data-att-tab="history" class="attendance-tab-btn ${this.activeTab === 'history' ? 'active' : ''}" onclick="window.AttendanceHub.switchTab('history')" style="flex: 1; min-width: 110px; padding: 8px 8px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; background: ${this.activeTab === 'history' ? '#10b981' : 'transparent'}; color: ${this.activeTab === 'history' ? '#fff' : '#94a3b8'}; transition: all 0.15s ease;">
                                📅 יומן (${Object.keys(this.records).length})
                            </button>
                        </div>

                        <div id="attendance-hub-modal-body"></div>
                    </div>
                </div>
            `;

            const closeModal = () => this.close();
            modal.querySelectorAll('.btn-close-attendance-modal').forEach(b => b.addEventListener('click', closeModal));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            if (window.ModalHelp && typeof window.ModalHelp.injectHelpButtons === 'function') {
                window.ModalHelp.injectHelpButtons();
            }

            this.renderModalBody();
        },

        getSelfStudyCount: function() {
            if (typeof window.isCoursePerpetualDitch !== 'function') return 0;
            const curState = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState);
            if (!curState || !curState.courses) return 0;
            const activeCourses = Object.values(curState.courses).filter(c => c.status === 'active' || (c.semester && Number(c.semester) === 3));
            return activeCourses.filter(c => window.isCoursePerpetualDitch(c.code)).length;
        },

        switchTab: function(tabName, isNavBack = false) {
            if (!isNavBack && this.activeTab && this.activeTab !== tabName) {
                if (!this._tabHistory) this._tabHistory = [];
                this._tabHistory.push(this.activeTab);
                if (this._tabHistory.length > 10) this._tabHistory.shift();
                if (typeof window.pushMobileBackHistory === 'function') {
                    window.pushMobileBackHistory('attendance-tab');
                }
            }
            this._manualCatchupFormOpen = false;
            this._confirmClearHistory = false;
            this.activeTab = tabName;
            this._fromSwitchTab = true;
            this.openModal(tabName);
            this._fromSwitchTab = false;
        },

        renderModalBody: function() {
            if (typeof window.renderTimetableWeekNavigator === 'function') {
                window.renderTimetableWeekNavigator();
            }
            const modalEl = document.getElementById('modal-attendance-hub');
            if (modalEl) {
                const catchupBtn = modalEl.querySelector('.attendance-tab-btn[data-att-tab="catchup"]');
                const selfBtn = modalEl.querySelector('.attendance-tab-btn[data-att-tab="selfstudy"]');
                const histBtn = modalEl.querySelector('.attendance-tab-btn[data-att-tab="history"]');
                if (catchupBtn) catchupBtn.textContent = `📹 תור השלמות (${this.catchupQueue.filter(i => i.status !== 'completed').length})`;
                if (selfBtn) selfBtn.textContent = `🚀 למידה עצמית (${this.getSelfStudyCount()})`;
                if (histBtn) histBtn.textContent = `📅 יומן (${Object.keys(this.records).length})`;
            }
            const bodyEl = document.getElementById('attendance-hub-modal-body');
            if (!bodyEl) return;

            if (this.activeTab === 'catchup') {
                this.renderCatchupTab(bodyEl);
            } else if (this.activeTab === 'stats') {
                this.renderStatsTab(bodyEl);
            } else if (this.activeTab === 'selfstudy') {
                this.renderSelfStudyTab(bodyEl);
            } else if (this.activeTab === 'mandatory') {
                this.renderMandatoryTab(bodyEl);
            } else if (this.activeTab === 'history') {
                this.renderHistoryTab(bodyEl);
            }
        },

        renderStatsTab: function(bodyEl) {
            const analytics = this.getSemesterAnalytics();
            const selectedWeek = analytics.selectedWeek || this.getSelectedWeek();
            const selectedWeekRange = (analytics.weeks && analytics.weeks[selectedWeek]) ? analytics.weeks[selectedWeek].dateRange : this.getWeekDateRangeLabel(selectedWeek);
            const fmtPct = (v) => (v === null || v === undefined) ? '—' : `${v}%`;

            const selectedWeekSlotsHtml = analytics.matrixRows.length === 0
                ? '<div style="color: #94a3b8; font-size: 0.78rem; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">אין שיעורים במערכת השעות לסימון בשבוע זה.</div>'
                : analytics.matrixRows.map(row => {
                    const st = row.weeks ? row.weeks[selectedWeek] : 'unmarked';
                    const canonicalDate = (typeof this.getCanonicalDateForSemesterWeekDay === 'function')
                        ? this.getCanonicalDateForSemesterWeekDay(selectedWeek, row.dayIndex)
                        : '';
                    const shortDate = canonicalDate ? canonicalDate.split('-').slice(1).reverse().join('.') : '';
                    const isAtt = st === 'attended';
                    const isMis = st === 'missed';
                    const isPerp = row.isPerpetual && st === 'perpetual';
                    const baseArgs = `decodeURIComponent('${encArg(row.courseId)}'), decodeURIComponent('${encArg(row.courseName)}'), decodeURIComponent('${encArg(row.type)}'), ${row.dayIndex}, decodeURIComponent('${encArg(row.startTime)}'), decodeURIComponent('${encArg(row.endTime)}'), decodeURIComponent('${encArg(row.room)}')`;
                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 10px 12px; border-radius: 10px; background: ${isAtt ? 'rgba(16, 185, 129, 0.09)' : (isMis ? 'rgba(244, 63, 94, 0.09)' : 'rgba(255,255,255,0.03)')}; border: 1px solid ${isAtt ? 'rgba(16, 185, 129, 0.45)' : (isMis ? 'rgba(244, 63, 94, 0.45)' : 'rgba(255,255,255,0.08)')};">
                            <div style="min-width: 180px;">
                                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    <strong style="color: #f8fafc; font-size: 0.85rem;">${escHtml(row.courseName)}</strong>
                                    <span style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">(${escHtml(row.courseId)})</span>
                                    ${isPerp ? '<span style="font-size: 0.68rem; background: rgba(168, 85, 247, 0.2); color: #e9d5ff; padding: 1px 6px; border-radius: 999px; font-weight: 700;">🚀 למידה עצמית</span>' : ''}
                                </div>
                                <div style="font-size: 0.73rem; color: #94a3b8; margin-top: 2px;">
                                    ${escHtml(row.type)} • יום ${escHtml(row.dayName)}${shortDate ? ` (${shortDate})` : ''} • ${escHtml(row.startTime)}${row.endTime ? `–${escHtml(row.endTime)}` : ''}${row.room ? ` • ${escHtml(row.room)}` : ''}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                <button type="button"
                                        class="btn-att-quick-attended"
                                        onclick="window.AttendanceHub.toggleAttendance(${baseArgs}, 'attended', ${selectedWeek})"
                                        style="padding: 5px 10px; border-radius: 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid ${isAtt ? '#10b981' : 'rgba(16, 185, 129, 0.35)'}; background: ${isAtt ? '#10b981' : 'rgba(16, 185, 129, 0.12)'}; color: ${isAtt ? '#ffffff' : '#6ee7b7'};">
                                    ✓ נכחתי
                                </button>
                                <button type="button"
                                        class="btn-att-quick-missed"
                                        onclick="window.AttendanceHub.toggleAttendance(${baseArgs}, 'missed', ${selectedWeek})"
                                        style="padding: 5px 10px; border-radius: 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid ${isMis ? '#f43f5e' : 'rgba(244, 63, 94, 0.35)'}; background: ${isMis ? '#f43f5e' : 'rgba(244, 63, 94, 0.12)'}; color: ${isMis ? '#ffffff' : '#fda4af'};">
                                    ✗ החסרתי
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

            let weekMatrixHeaders = '';
            for (let w = 1; w <= 13; w++) {
                const isCur = w === analytics.currentWeek;
                weekMatrixHeaders += `<th title="שבוע ${w}: ${analytics.weeks[w].dateRange}" style="${isCur ? 'color: #38bdf8; border-bottom: 2px solid #38bdf8;' : ''}">ש׳${w}</th>`;
            }

            let matrixBodyHtml = '';
            if (analytics.matrixRows.length === 0) {
                matrixBodyHtml = `<tr><td colspan="15" style="padding: 20px; color: #94a3b8;">אין מערכת שעות פעילה להצגה. סנכרן מ-CheeseFork כדי לראות את מטריצת 13 השבועות.</td></tr>`;
            } else {
                analytics.matrixRows.forEach(row => {
                    const rowMarked = row.attended + row.missed;
                    const rowPct = rowMarked > 0 ? Math.round((row.attended / rowMarked) * 100) : null;
                    let cellsHtml = '';
                    for (let w = 1; w <= 13; w++) {
                        const st = row.weeks[w];
                        const isCur = w === analytics.currentWeek;
                        let symbol = '·';
                        let titleText = `שבוע ${w} (${analytics.weeks[w].dateRange}): לא סומן — לחץ לסימון נוכחות`;
                        if (st === 'attended') {
                            symbol = '✓';
                            titleText = `שבוע ${w}: נכחתי — לחץ להעברה להוחסר`;
                        } else if (st === 'missed') {
                            symbol = '✗';
                            titleText = `שבוע ${w}: הוחסר — לחץ לביטול סימון`;
                        } else if (st === 'perpetual') {
                            symbol = '🚀';
                            titleText = `שבוע ${w}: בלמידה עצמית — לחץ לעדכון ידני`;
                        }
                        const baseCellArgs = `decodeURIComponent('${encArg(row.courseId)}'), decodeURIComponent('${encArg(row.courseName)}'), decodeURIComponent('${encArg(row.type)}'), ${row.dayIndex}, decodeURIComponent('${encArg(row.startTime)}'), decodeURIComponent('${encArg(row.endTime)}'), decodeURIComponent('${encArg(row.room)}')`;
                        cellsHtml += `
                            <td>
                                <button type="button"
                                        class="att-matrix-cell-btn ${st} ${isCur ? 'is-current-col' : ''}"
                                        title="${escHtml(titleText)}"
                                        onclick="window.AttendanceHub.cycleMatrixCellAttendance(${baseCellArgs}, ${w})">
                                    ${symbol}
                                </button>
                            </td>
                        `;
                    }
                    matrixBodyHtml += `
                        <tr>
                            <td style="text-align: right; min-width: 155px; white-space: nowrap;">
                                <strong style="color: #f8fafc;">${escHtml(row.courseName)}</strong>
                                <div style="font-size: 0.68rem; color: #94a3b8;">${escHtml(row.type)} • יום ${escHtml(row.dayName)} ${escHtml(row.startTime)}</div>
                            </td>
                            ${cellsHtml}
                            <td style="font-weight: 800; color: ${rowPct === null ? '#94a3b8' : (rowPct >= 80 ? '#34d399' : '#fbbf24')};">
                                ${fmtPct(rowPct)}
                            </td>
                        </tr>
                    `;
                });
            }

            let coursesBreakdownHtml = analytics.courses.map(c => {
                const pctVal = c.pct === null ? 0 : c.pct;
                const modeLabels = {
                    all: '🚀 למידה עצמית מלאה',
                    lecture: '👨‍🏫 הרצאות בלמידה עצמית',
                    tutorial: '🧑‍🏫 תרגולים בלמידה עצמית',
                    none: '🏛️ פרונטלי רגיל'
                };
                return `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <div>
                                <strong style="color: #f8fafc; font-size: 0.88rem;">${escHtml(c.courseName)}</strong>
                                <span style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">(${escHtml(c.courseId)})</span>
                            </div>
                            <span style="font-size: 0.75rem; font-weight: 800; color: ${c.pct === null ? '#94a3b8' : (c.pct >= 80 ? '#34d399' : '#f59e0b')};">
                                ${c.pct === null ? 'טרם סומן' : `${c.pct}% (${c.attended}/${c.marked})`}
                            </span>
                        </div>
                        <div style="background: rgba(255,255,255,0.08); height: 6px; border-radius: 999px; overflow: hidden; margin-bottom: 8px;">
                            <div style="height: 100%; width: ${pctVal}%; background: ${pctVal >= 80 ? '#10b981' : '#f59e0b'};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8; flex-wrap: wrap; gap: 6px;">
                            <span>הרצאות: ${c.lectureAttended}/${c.lectureAttended + c.lectureMissed} • תרגולים: ${c.tutorialAttended}/${c.tutorialAttended + c.tutorialMissed}</span>
                            <span style="color: ${c.perpetualDitchMode !== 'none' ? '#c084fc' : '#64748b'}; font-weight: 700;">${modeLabels[c.perpetualDitchMode] || modeLabels.none}</span>
                        </div>
                    </div>
                `;
            }).join('');

            bodyEl.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 10px; margin-bottom: 16px;">
                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #6ee7b7; font-weight: 700;">📊 נוכחות סמסטריאלית</div>
                        <div style="font-size: 1.45rem; font-weight: 900; color: #f8fafc; margin: 2px 0;">${fmtPct(analytics.overallPct)}</div>
                        <div style="font-size: 0.72rem; color: #cbd5e1;">${analytics.totalAttended} נכחתי • ${analytics.totalMissed} החסרתי</div>
                    </div>
                    <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">👨‍🏫 הרצאות</div>
                        <div style="font-size: 1.45rem; font-weight: 900; color: #f8fafc; margin: 2px 0;">${fmtPct(analytics.lecturePct)}</div>
                        <div style="font-size: 0.72rem; color: #cbd5e1;">${analytics.lectureAttended} מתוך ${analytics.lectureTotal} מסומנות</div>
                    </div>
                    <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #d8b4fe; font-weight: 700;">🧑‍🏫 תרגולים ומעבדות</div>
                        <div style="font-size: 1.45rem; font-weight: 900; color: #f8fafc; margin: 2px 0;">${fmtPct(analytics.tutorialPct)}</div>
                        <div style="font-size: 0.72rem; color: #cbd5e1;">${analytics.tutorialAttended} מתוך ${analytics.tutorialTotal} מסומנים</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #fbbf24; font-weight: 700;">📅 שבוע אקדמי נוכחי</div>
                        <div style="font-size: 1.25rem; font-weight: 900; color: #f8fafc; margin: 3px 0;">שבוע ${analytics.currentWeek} / 13</div>
                        <div style="font-size: 0.72rem; color: #cbd5e1;">${analytics.weeks[analytics.currentWeek].dateRange}</div>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 0.86rem; color: #f1f5f9;">⚡ סימון מהיר לשבוע ${selectedWeek}${selectedWeekRange ? ` (${selectedWeekRange})` : ''}</strong>
                        <span style="font-size: 0.72rem; color: #94a3b8;">סימון ישיר עבור השיעורים של שבוע ${selectedWeek}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${selectedWeekSlotsHtml}
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 0.86rem; color: #f1f5f9;">🗓️ מטריצת נוכחות סמסטריאלית לפי שבוע (שבועות 1–13)</strong>
                        <span style="font-size: 0.72rem; color: #94a3b8;">לחץ על כל משבצת שבועית להחלפת מצב: · לא סומן → ✓ נכחתי → ✗ הוחסר</span>
                    </div>
                    <div style="overflow-x: auto; border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; background: rgba(15, 23, 42, 0.5);">
                        <table class="att-matrix-table">
                            <thead>
                                <tr>
                                    <th style="text-align: right; padding-right: 8px;">שיעור</th>
                                    ${weekMatrixHeaders}
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${matrixBodyHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9; margin-bottom: 8px;">📚 פילוח נוכחות לפי קורס:</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
                        ${coursesBreakdownHtml || '<div style="color: #94a3b8; font-size: 0.8rem;">אין קורסים זמינים.</div>'}
                    </div>
                </div>
            `;
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
                    ניתן להגדיר למידה עצמית לקורס המלא, <strong>להרצאות בלבד</strong> (הגעה פרונטלית לתרגולים), או <strong>לתרגולים בלבד</strong> (הגעה פרונטלית להרצאות).
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
                    const ditchMode = (typeof window.getCoursePerpetualDitchMode === 'function')
                        ? window.getCoursePerpetualDitchMode(c.code)
                        : (((typeof window.isCoursePerpetualDitch === 'function') && window.isCoursePerpetualDitch(c.code)) ? 'all' : 'none');
                    const isSelfStudy = ditchMode !== 'none';
                    const resUrls = (typeof window.getCourseResourceUrls === 'function') ? window.getCourseResourceUrls(c.code) : { panoptoUrl: '#', pangeaUrl: '#' };
                    const borderColor = isSelfStudy ? '#a855f7' : 'rgba(255,255,255,0.1)';
                    const bgColor = isSelfStudy ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.03)';
                    const modeBadgeMap = {
                        all: '🚀 כל הקורס (הרצאות + תרגולים)',
                        lecture: '👨‍🏫 הרצאות בלבד בלמידה עצמית',
                        tutorial: '🧑‍🏫 תרגולים בלבד בלמידה עצמית',
                        none: '🏛️ שיעור פרונטלי רגיל'
                    };

                    html += `
                        <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 14px; position: relative; transition: all 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 6px;">
                                <div>
                                    <strong style="font-size: 0.95rem; color: #f8fafc;">${escHtml(c.name)}</strong>
                                    <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace; display: block; margin-top: 2px;">(${escHtml(c.code)}) • סמסטר ${c.semester || 3}</span>
                                </div>
                                <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isSelfStudy ? '#a855f7' : 'rgba(255,255,255,0.1)'}; color: ${isSelfStudy ? '#fff' : '#94a3b8'};">
                                    ${modeBadgeMap[ditchMode] || modeBadgeMap.none}
                                </span>
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

                            <div class="perpetual-mode-bar" style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;">
                                <button type="button" class="perpetual-mode-pill mode-none ${ditchMode === 'none' ? 'active' : ''}" onclick="window.setCoursePerpetualDitchMode(decodeURIComponent('${encArg(c.code)}'), 'none'); window.AttendanceHub.renderModalBody();">🏛️ פרונטלי</button>
                                <button type="button" class="perpetual-mode-pill mode-lecture ${ditchMode === 'lecture' ? 'active' : ''}" onclick="window.setCoursePerpetualDitchMode(decodeURIComponent('${encArg(c.code)}'), 'lecture'); window.AttendanceHub.renderModalBody();">👨‍🏫 הרצאות בלבד</button>
                                <button type="button" class="perpetual-mode-pill mode-tutorial ${ditchMode === 'tutorial' ? 'active' : ''}" onclick="window.setCoursePerpetualDitchMode(decodeURIComponent('${encArg(c.code)}'), 'tutorial'); window.AttendanceHub.renderModalBody();">🧑‍🏫 תרגולים בלבד</button>
                                <button type="button" class="perpetual-mode-pill mode-all ${ditchMode === 'all' ? 'active' : ''}" onclick="window.setCoursePerpetualDitchMode(decodeURIComponent('${encArg(c.code)}'), 'all'); window.AttendanceHub.renderModalBody();">🚀 כל הקורס</button>
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

            const totalMinutes1x = pending.reduce((sum, item) => {
                const isTut = item.type && (item.type.includes('תרגול') || item.type.includes('מעבדה'));
                return sum + (isTut ? 55 : 100);
            }, 0);
            const hours1x = (totalMinutes1x / 60).toFixed(1);
            const hours15x = (totalMinutes1x / 90).toFixed(1);

            const curStateCatch = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState) || {};
            const activeCourseOpts = Object.values(curStateCatch.courses || {})
                .filter(c => c && (c.status === 'active' || Number(c.semester) === 3))
                .map(c => `<option value="${escHtml(c.code + ' ' + c.name)}">${escHtml(c.name)} (${escHtml(c.code)})</option>`)
                .join('');

            let html = `
                <!-- Catch-Up Summary Banner -->
                <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 12px; padding: 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 1rem; font-weight: 800; color: #fb7185; margin-bottom: 2px;">
                            ${pending.length === 0 ? '✨ אין שיעורים הממתינים להשלמה!' : `נותרו ${pending.length} שיעורים להשלמה`}
                        </div>
                        <div style="font-size: 0.78rem; color: #cbd5e1;">
                            השלמת שיעורים מחזקת את רצף הלמידה ומונעת הצטברות חובות פנאופטו לקראת תקופת המבחנים.
                        </div>
                        ${pending.length > 0 ? `
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                            <span style="font-size: 0.74rem; background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                ⚡ זמן צפייה משוער ב-1.5x: ~${hours15x} שעות
                            </span>
                            <span style="font-size: 0.74rem; background: rgba(255, 255, 255, 0.06); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.12); padding: 2px 8px; border-radius: 6px;">
                                ⏱️ במהירות רגילה (1.0x): ~${hours1x} שעות
                            </span>
                        </div>
                        ` : ''}
                    </div>
                    <button type="button" id="btn-att-open-manual-catchup" class="btn btn-sm btn-outline" onclick="window.AttendanceHub.promptManualCatchup()" style="font-size: 0.78rem; padding: 6px 12px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 8px;">
                        ➕ הוסף השלמה ידנית
                    </button>
                </div>

                ${this._manualCatchupFormOpen ? `
                <div id="att-manual-catchup-form" style="background: rgba(56, 189, 248, 0.07); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <datalist id="att-manual-courses-datalist">${activeCourseOpts}</datalist>
                    <input type="text" id="att-manual-course-input" list="att-manual-courses-datalist" placeholder="קורס או מספר קורס (למשל: 034010 דינמיקה)..." aria-label="קורס להשלמה ידנית" style="flex: 1 1 200px; min-width: 0; padding: 7px 10px; font-size: 0.8rem; background: #0b0f19; border: 1px solid #334155; color: #f8fafc; border-radius: 8px;">
                    <input type="text" id="att-manual-topic-input" placeholder="נושא / פרק להשלמה (למשל: הרצאה 4)..." aria-label="נושא להשלמה" style="flex: 1 1 200px; min-width: 0; padding: 7px 10px; font-size: 0.8rem; background: #0b0f19; border: 1px solid #334155; color: #f8fafc; border-radius: 8px;">
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button type="button" id="btn-att-save-manual-catchup" class="btn btn-xs btn-primary" style="padding: 7px 12px; font-weight: 700;">✓ הוסף לתור</button>
                        <button type="button" id="btn-att-cancel-manual-catchup" class="btn btn-xs btn-outline" style="padding: 7px 10px; color: #94a3b8; border-color: rgba(148,163,184,0.35);">ביטול</button>
                    </div>
                </div>
                ` : ''}

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
                    const idArg = encArg(item.id);
                    html += `
                        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid ${isWatching ? '#38bdf8' : 'rgba(244, 63, 94, 0.3)'}; border-radius: 12px; padding: 14px; transition: all 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; flex-wrap: wrap;">
                                        <span style="font-weight: 800; color: #f8fafc; font-size: 0.95rem;">${escHtml(item.courseName)}</span>
                                        <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace;">(${escHtml(item.courseId)})</span>
                                        <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">${escHtml(item.type)}</span>
                                        ${item.isMiluim ? `<span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🇮🇱 מילואים</span>` : ''}
                                    </div>
                                    <div style="font-size: 0.78rem; color: #38bdf8; font-weight: 600;">
                                        📌 ${escHtml(item.topic)}
                                    </div>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                                        תאריך השיעור: ${escHtml(item.date)} • שעה: ${escHtml(item.startTime || '—')}
                                    </div>
                                </div>

                                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    ${item.pangeaUrl ? `
                                        <button type="button" class="btn btn-sm btn-outline" onclick="if(window.PangeaHub) window.PangeaHub.openQuickPeek(decodeURIComponent('${encArg(item.pangeaUrl)}'), decodeURIComponent('${encArg(item.pangeaTitle || item.topic)}'))" style="font-size: 0.74rem; padding: 4px 10px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 6px;" title="קרא סיכום הרצאה מהיר בפנגייה">
                                            📖 סיכום בפנגייה
                                        </button>
                                    ` : ''}
                                    <a href="${item.panoptoUrl || (`https://panopto.technion.ac.il/Panopto/Pages/Sessions/List.aspx#query=${encodeURIComponent(item.courseId)}`)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size: 0.74rem; padding: 4px 10px; color: #f43f5e; border-color: rgba(244, 63, 94, 0.4); border-radius: 6px; text-decoration: none; font-weight: 700;" title="מעבר ישיר להקלטות הקורס בפנאופטו הטכניוני">
                                        🎬 פנאופטו (הקלטות) ↗
                                    </a>
                                    <a href="${item.moodleUrl || 'https://moodle26.technion.ac.il/my/'}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size: 0.74rem; padding: 4px 10px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); border-radius: 6px; text-decoration: none;" title="מעבר ישיר לדף הקורס במודל 26">
                                        🎓 מודל 26 ↗
                                    </a>
                                    <button type="button" class="btn btn-sm ${isWatching ? 'btn-primary' : 'btn-outline'}" onclick="window.AttendanceHub.setCatchupStatus(decodeURIComponent('${idArg}'), '${isWatching ? 'pending' : 'watching'}')" style="font-size: 0.74rem; padding: 4px 8px; border-radius: 6px;">
                                        ${isWatching ? 'בצפייה כעת 📺' : 'סמן בצפייה'}
                                    </button>
                                    <button type="button" class="btn btn-sm" onclick="window.AttendanceHub.setCatchupStatus(decodeURIComponent('${idArg}'), 'completed')" style="font-size: 0.74rem; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 6px; font-weight: 700; cursor: pointer;">
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
                                                        <span class="catchup-parallel-time">${escHtml(rec.dayName)} ${escHtml(rec.startTime)}–${escHtml(rec.endTime)}</span>
                                                        <span class="catchup-parallel-group">${escHtml(rec.slotName)} קבוצה ${escHtml(rec.groupId)}${rec.lecturer ? (' • ' + escHtml(rec.lecturer)) : ''}</span>
                                                        <span class="catchup-parallel-room">📍 ${escHtml(rec.room)}</span>
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
                            ${completed.map(item => {
                                const cidArg = encArg(item.id);
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; color: #94a3b8;">
                                    <span>✓ <strong>${escHtml(item.courseName)}</strong>: ${escHtml(item.topic)} (${escHtml(item.date)})</span>
                                    <div style="display: flex; gap: 6px;">
                                        <button type="button" onclick="window.AttendanceHub.setCatchupStatus(decodeURIComponent('${cidArg}'), 'pending')" style="background: none; border: none; color: #cbd5e1; cursor: pointer; text-decoration: underline; font-size: 0.72rem;">החזר לתור</button>
                                        <button type="button" onclick="window.AttendanceHub.deleteCatchup(decodeURIComponent('${cidArg}'))" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.72rem;">מחק</button>
                                    </div>
                                </div>
                            `; }).join('')}
                        </div>
                    </div>
                `;
            }

            bodyEl.innerHTML = html;

            const saveManBtn = bodyEl.querySelector('#btn-att-save-manual-catchup');
            const cancelManBtn = bodyEl.querySelector('#btn-att-cancel-manual-catchup');
            if (saveManBtn) {
                saveManBtn.addEventListener('click', () => {
                    const cInp = bodyEl.querySelector('#att-manual-course-input');
                    const tInp = bodyEl.querySelector('#att-manual-topic-input');
                    const cVal = cInp ? cInp.value.trim() : '';
                    if (!cVal) {
                        if (typeof showToastNotification === 'function') showToastNotification('נא להזין שם או מספר קורס', 'warning');
                        if (cInp) cInp.focus();
                        return;
                    }
                    this.submitManualCatchup(cVal, tInp ? tInp.value.trim() : '');
                });
            }
            if (cancelManBtn) {
                cancelManBtn.addEventListener('click', () => {
                    this._manualCatchupFormOpen = false;
                    this.renderModalBody();
                });
            }
        },

        addCustomMandatoryCourse: function(courseCode) {
            if (!courseCode || !global.gameState) return;
            if (!Array.isArray(global.gameState.customMandatoryShields)) {
                global.gameState.customMandatoryShields = [];
            }
            const norm = String(courseCode).trim();
            if (!global.gameState.customMandatoryShields.includes(norm)) {
                global.gameState.customMandatoryShields.push(norm);
            }
            if (!this.quotas[norm]) {
                const c = (global.gameState.courses && global.gameState.courses[norm]) || {};
                this.quotas[norm] = {
                    name: c.name || norm,
                    icon: '🛡️',
                    category: 'מעקב חובה מותאם',
                    minRequired: 10,
                    maxAllowedAbsences: 2,
                    rulesNote: 'מעקב נוכחות חובה שהוסף ידנית ע״י הסטודנט.'
                };
            }
            if (typeof global.saveState === 'function') global.saveState();
            this.renderModalBody();
            if (typeof showToastNotification === 'function') {
                showToastNotification('🛡️ הקורס נוסף למעקב נוכחות חובה!', 'success');
            }
        },

        renderMandatoryTab: function(bodyEl) {
            const coursesMap = (global.gameState && global.gameState.courses) ? global.gameState.courses : {};
            const activeCoursesList = Object.values(coursesMap).filter(c => c && c.status === 'active');
            const activeCodesSet = new Set();
            activeCoursesList.forEach(c => {
                const raw = String(c.code || '').trim();
                activeCodesSet.add(raw);
                activeCodesSet.add(raw.replace(/^0+/, ''));
                activeCodesSet.add(raw.padStart(6, '0'));
            });
            const customShields = (global.gameState && Array.isArray(global.gameState.customMandatoryShields))
                ? global.gameState.customMandatoryShields
                : [];
            customShields.forEach(code => {
                if (!this.quotas[code]) {
                    const c = coursesMap[code] || activeCoursesList.find(x => String(x.code).replace(/^0+/, '') === String(code).replace(/^0+/, '')) || {};
                    this.quotas[code] = {
                        name: c.name || code,
                        icon: '🛡️',
                        category: 'מעקב חובה מותאם',
                        minRequired: 10,
                        maxAllowedAbsences: 2,
                        rulesNote: 'מעקב נוכחות חובה שהוסף ידנית ע״י הסטודנט.'
                    };
                }
            });

            const relevantEntries = Object.entries(this.quotas).filter(([code]) => {
                const clean = String(code).replace(/^0+/, '');
                const padded = clean.padStart(6, '0');
                const isCustom = customShields.includes(code) || customShields.includes(clean);
                const isEnrolledActive = activeCodesSet.has(code) || activeCodesSet.has(clean) || activeCodesSet.has(padded);
                return isEnrolledActive || isCustom;
            });

            const shownCodesSet = new Set(relevantEntries.map(([c]) => String(c).replace(/^0+/, '')));
            const addableActiveCourses = activeCoursesList.filter(c => !shownCodesSet.has(String(c.code).replace(/^0+/, '')));

            let html = `
                <div style="margin-bottom: 14px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <strong>🛡️ מדדי בטיחות נוכחות חובה (מותאם לקורסים הפעילים שלך):</strong>
                        מעקב חי אך ורק אחר קורסים פעילים במערכת שלך עם דרישות נוכחות חובה.
                    </div>
                    ${addableActiveCourses.length > 0 ? `
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <select id="att-add-mandatory-select" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.4); color: #f8fafc; border-radius: 6px; padding: 4px 8px; font-size: 0.78rem;">
                                ${addableActiveCourses.map(c => `<option value="${escHtml(c.code)}">${escHtml(c.name)} (${escHtml(c.code)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-att-add-mandatory" class="btn btn-xs btn-outline" style="border-color: rgba(16,185,129,0.5); color: #34d399; padding: 4px 10px; border-radius: 6px; cursor: pointer;">+ הוסף למעקב חובה</button>
                        </div>
                    ` : ''}
                </div>
            `;

            if (relevantEntries.length === 0) {
                html += `
                    <div style="text-align: center; padding: 28px 18px; background: rgba(30, 41, 59, 0.45); border: 1px dashed rgba(148, 163, 184, 0.25); border-radius: 12px; color: #94a3b8; font-size: 0.86rem;">
                        ✨ אין בקורסים הפעילים שלך כרגע קורסים עם חובת נוכחות מוגדרת מראש.<br>
                        <span style="font-size: 0.78rem; color: #64748b;">ניתן להוסיף כל קורס מהסמסטר הנוכחי למעקב חובה דרך הבורר למעלה.</span>
                    </div>
                `;
                bodyEl.innerHTML = html;
            } else {
                html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">`;
                relevantEntries.forEach(([code, quota]) => {
                    const stats = this.getCourseStats(code);
                    const isDanger = stats.safety === 'danger';
                    const isWarning = stats.safety === 'warning';
                    const borderColor = isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : 'rgba(255,255,255,0.1)');
                    const bgColor = isDanger ? 'rgba(239, 68, 68, 0.08)' : (isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)');

                    html += `
                        <div class="att-mandatory-card" data-course-code="${escHtml(code)}" style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 14px; position: relative; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <span style="font-size: 1.2rem; margin-left: 6px;">${escHtml(quota.icon || '📚')}</span>
                                    <strong style="font-size: 0.95rem; color: #f8fafc;">${escHtml(quota.name)}</strong>
                                    <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace; display: block; margin-top: 2px;">(${escHtml(code)}) • ${escHtml(quota.category)}</span>
                                </div>
                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981')}; color: #fff;">
                                    ${isDanger ? '⚠️ סכנת פסילת קורס!' : (isWarning ? '⚠️ התראה: גבולי' : 'תקין ✓')}
                                </span>
                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 6px;">
                                <span>נרשמה נוכחות: <strong>${stats.attended}</strong> שיעורים</span>
                                <span>היעדרויות: <strong style="color: ${stats.missed > 0 ? '#fb7185' : '#cbd5e1'};">${stats.missed}</strong> / ${quota.maxAllowedAbsences}</span>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.08); border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                                <div style="background: ${isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981')}; height: 100%; width: ${Math.min(100, Math.round((stats.attended / quota.minRequired) * 100))}%;"></div>
                            </div>

                            <div style="font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
                                ${escHtml(quota.rulesNote)}
                            </div>

                            <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.72rem; color: #38bdf8;">
                                    ${stats.remainingAllowed !== null ? `יתרת היעדרויות מותרת: <strong>${stats.remainingAllowed}</strong>` : ''}
                                </span>
                                <button type="button" onclick="window.AttendanceHub.quickAddSession(decodeURIComponent('${encArg(code)}'), decodeURIComponent('${encArg(quota.name)}'))" style="font-size: 0.72rem; padding: 3px 8px; background: rgba(255,255,255,0.08); border: none; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
                                    + רשום נוכחות ידנית
                                </button>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
                bodyEl.innerHTML = html;
            }

            const addBtn = bodyEl.querySelector('#btn-att-add-mandatory');
            const addSel = bodyEl.querySelector('#att-add-mandatory-select');
            if (addBtn && addSel) {
                addBtn.addEventListener('click', () => {
                    if (addSel.value) this.addCustomMandatoryCourse(addSel.value);
                });
            }
        },

        renderHistoryTab: function(bodyEl) {
            const recordsList = Object.values(this.records).sort((a, b) => b.timestamp - a.timestamp);

            let html = `
                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9;">יומן שיעורים מלא (${recordsList.length} רשומות):</span>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        ${this._confirmClearHistory ? `
                            <span style="font-size: 0.76rem; color: #fca5a5; font-weight: 700;">לאפס את כל ההיסטוריה?</span>
                            <button type="button" id="btn-att-confirm-clear-yes" class="btn btn-xs" style="background: #ef4444; color: #fff; font-weight: 700; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer;">✓ כן, אפס הכל</button>
                            <button type="button" id="btn-att-confirm-clear-no" class="btn btn-xs btn-outline" style="color: #94a3b8; border-color: rgba(148,163,184,0.35); border-radius: 6px; padding: 4px 8px; cursor: pointer;">ביטול</button>
                        ` : `
                            <button type="button" id="btn-att-clear-history" class="btn btn-sm btn-outline" onclick="window.AttendanceHub.clearAllHistory()" style="font-size: 0.72rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
                                🗑️ איפוס היסטוריה
                            </button>
                        `}
                    </div>
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
                                    <strong style="color: #f8fafc;">${escHtml(r.courseName)}</strong>
                                    <span style="font-size: 0.72rem; color: #94a3b8; margin-right: 6px;">(${escHtml(r.type)} • ${escHtml(r.startTime || '—')})</span>
                                    <span style="font-size: 0.7rem; color: #64748b; display: block;">תאריך: ${escHtml(r.date)}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: ${r.status === 'attended' ? '#34d399' : '#f87171'};">
                                        ${r.status === 'attended' ? '✓ נוכחתי' : '✗ הוחסר'}
                                    </span>
                                    <button type="button" onclick="window.AttendanceHub.deleteRecord(decodeURIComponent('${encArg(r.slotKey)}'))" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem;" title="מחק רשומה זו">&times;</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            bodyEl.innerHTML = html;

            const yesBtn = bodyEl.querySelector('#btn-att-confirm-clear-yes');
            const noBtn = bodyEl.querySelector('#btn-att-confirm-clear-no');
            if (yesBtn) yesBtn.addEventListener('click', () => this.confirmClearAllHistory());
            if (noBtn) noBtn.addEventListener('click', () => {
                this._confirmClearHistory = false;
                this.renderModalBody();
            });
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

        clearAllHistory: function(forceImmediate = false) {
            if (forceImmediate === true) {
                this.confirmClearAllHistory();
                return;
            }
            this._confirmClearHistory = true;
            this.renderModalBody();
        },

        confirmClearAllHistory: function() {
            this.records = {};
            this.catchupQueue = [];
            this._confirmClearHistory = false;
            this.save();
            this.renderModalBody();
            if (typeof showToastNotification === 'function') {
                showToastNotification('🗑️ היסטוריית הנוכחות ותור ההשלמות אופסו.', 'info');
            }
        },

        promptManualCatchup: function(courseArg, topicArg) {
            if (typeof courseArg === 'string' && courseArg.trim()) {
                this.submitManualCatchup(courseArg.trim(), topicArg ? String(topicArg).trim() : '');
                return;
            }
            this._manualCatchupFormOpen = !this._manualCatchupFormOpen;
            this.renderModalBody();
            if (this._manualCatchupFormOpen) {
                const inp = document.getElementById('att-manual-course-input');
                if (inp) inp.focus();
            }
        },

        submitManualCatchup: function(courseVal, topicVal) {
            const course = String(courseVal || '').trim();
            if (!course) return;
            const topic = String(topicVal || '').trim() || 'השלמת שיעור';
            
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

            this._manualCatchupFormOpen = false;
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
