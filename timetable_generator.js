/**
 * Semestero ME - Algorithmic Timetable Generator & Combinations Studio (v2.4.10)
 * 
 * Automatically generates, scores, and browses all conflict-free timetable combinations
 * based on CheeseFork and Technion faculty catalogs for students to find their optimal schedule.
 */

(function (global) {
    'use strict';

    // Master Course Groups Catalog (Technion Semester 3 - Winter 2026/2027 תשפ״ז)
    const TECH_COURSE_GROUPS_CATALOG = {
        '034056': {
            code: '034056',
            name: 'מבוא לחישוב מדעי והנדסי',
            credits: 4.0,
            cardClass: 'timetable-card-computing',
            slots: [
                {
                    slotType: 'lecture',
                    slotName: 'הרצאה',
                    options: [
                        {
                            groupId: '10',
                            lecturer: 'ד"ר דניאל הקסנר',
                            room: 'אודיטוריום',
                            meetings: [
                                { dayIndex: 3, dayName: 'רביעי', startTime: '14:30', endTime: '17:30', duration: '3 שעות' }
                            ]
                        },
                        {
                            groupId: '11',
                            lecturer: 'ד"ר דניאל הקסנר',
                            room: 'כיתה 200',
                            meetings: [
                                { dayIndex: 0, dayName: 'ראשון', startTime: '10:30', endTime: '13:30', duration: '3 שעות' }
                            ]
                        }
                    ]
                },
                {
                    slotType: 'tutorial',
                    slotName: 'תרגול',
                    options: [
                        {
                            groupId: '14',
                            lecturer: 'איליה קופמן',
                            room: 'חוות מחשבים',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '14:30', endTime: '16:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '11',
                            lecturer: 'מיכל אטיאס',
                            room: 'חוות מחשבים',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '12',
                            lecturer: 'איליה קופמן',
                            room: 'חוות מחשבים',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '14:30', endTime: '16:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '15',
                            lecturer: 'יונתן גולדשטיין',
                            room: 'חוות מחשבים',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '14:30', endTime: '16:30', duration: 'שעתיים' }
                            ]
                        }
                    ]
                }
            ]
        },
        '034053': {
            code: '034053',
            name: 'מכניקת מוצקים 2מ',
            credits: 4.5,
            cardClass: 'timetable-card-solids',
            slots: [
                {
                    slotType: 'lecture',
                    slotName: 'הרצאה',
                    options: [
                        {
                            groupId: '10',
                            lecturer: 'פרופ\' יוסף גבלי',
                            room: 'הנדסת מכונות 250',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '10:30', endTime: '14:30', duration: '4 שעות' }
                            ]
                        },
                        {
                            groupId: '11',
                            lecturer: 'פרופ\' דוד דורפמן',
                            room: 'הנדסת מכונות 250',
                            meetings: [
                                { dayIndex: 3, dayName: 'רביעי', startTime: '08:30', endTime: '12:30', duration: '4 שעות' }
                            ]
                        }
                    ]
                },
                {
                    slotType: 'tutorial',
                    slotName: 'תרגול',
                    options: [
                        {
                            groupId: '21',
                            lecturer: 'רועי לוי',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '22',
                            lecturer: 'דנה פלד',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '10:30', endTime: '12:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '23',
                            lecturer: 'רועי לוי',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '14:30', endTime: '16:30', duration: 'שעתיים' }
                            ]
                        }
                    ]
                }
            ]
        },
        '034035': {
            code: '034035',
            name: 'תרמודינמיקה 1',
            credits: 4.0,
            cardClass: 'timetable-card-thermo',
            slots: [
                {
                    slotType: 'lecture',
                    slotName: 'הרצאה',
                    options: [
                        {
                            groupId: '10',
                            lecturer: 'פרופ\' לאוניד טרטקובסקי',
                            room: 'אולם הרצאות',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '08:30', endTime: '11:30', duration: '3 שעות' }
                            ]
                        },
                        {
                            groupId: '11',
                            lecturer: 'פרופ\' לאוניד טרטקובסקי',
                            room: 'אולם הרצאות',
                            meetings: [
                                { dayIndex: 0, dayName: 'ראשון', startTime: '09:30', endTime: '12:30', duration: '3 שעות' }
                            ]
                        }
                    ]
                },
                {
                    slotType: 'tutorial',
                    slotName: 'תרגול',
                    options: [
                        {
                            groupId: '11',
                            lecturer: 'אלכס גורביץ\'',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '12',
                            lecturer: 'מיכל שטרן',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 0, dayName: 'ראשון', startTime: '13:30', endTime: '15:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '13',
                            lecturer: 'אלכס גורביץ\'',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 3, dayName: 'רביעי', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' }
                            ]
                        }
                    ]
                }
            ]
        },
        '104228': {
            code: '104228',
            name: 'משוואות דיפרנציאליות חלקיות מ\'',
            credits: 3.5,
            cardClass: 'timetable-card-pde',
            slots: [
                {
                    slotType: 'lecture',
                    slotName: 'הרצאה',
                    options: [
                        {
                            groupId: '20',
                            lecturer: 'פרופ\' אלי לוין',
                            room: 'אולם מתמטיקה',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '10:30', endTime: '12:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '10',
                            lecturer: 'פרופ\' בוריס מירמן',
                            room: 'אולם מתמטיקה',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '10:30', endTime: '12:30', duration: 'שעתיים' }
                            ]
                        }
                    ]
                },
                {
                    slotType: 'tutorial',
                    slotName: 'תרגול',
                    options: [
                        {
                            groupId: '21',
                            lecturer: 'יבגני קגן',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 3, dayName: 'רביעי', startTime: '10:30', endTime: '12:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '22',
                            lecturer: 'תמר כהן',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' }
                            ]
                        },
                        {
                            groupId: '23',
                            lecturer: 'יבגני קגן',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '14:30', endTime: '16:30', duration: 'שעתיים' }
                            ]
                        }
                    ]
                }
            ]
        },
        '114052': {
            code: '114052',
            name: 'פיסיקה 2',
            credits: 3.5,
            cardClass: 'timetable-card-physics',
            slots: [
                {
                    slotType: 'lecture',
                    slotName: 'הרצאה',
                    options: [
                        {
                            groupId: '10',
                            lecturer: 'ד"ר גדעון אלון',
                            room: 'אולם פיסיקה',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '08:30', endTime: '10:30', duration: 'שעתיים' },
                                { dayIndex: 3, dayName: 'רביעי', startTime: '08:30', endTime: '09:30', duration: 'שעה' }
                            ]
                        },
                        {
                            groupId: '20',
                            lecturer: 'פרופ\' אורי שפירא',
                            room: 'אולם פיסיקה',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '12:30', endTime: '14:30', duration: 'שעתיים' },
                                { dayIndex: 4, dayName: 'חמישי', startTime: '10:30', endTime: '11:30', duration: 'שעה' }
                            ]
                        }
                    ]
                },
                {
                    slotType: 'tutorial',
                    slotName: 'תרגול',
                    options: [
                        {
                            groupId: '13',
                            lecturer: 'אורי ברקת',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 3, dayName: 'רביעי', startTime: '09:30', endTime: '10:30', duration: 'שעה' }
                            ]
                        },
                        {
                            groupId: '14',
                            lecturer: 'נועם שפירא',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '10:30', endTime: '11:30', duration: 'שעה' }
                            ]
                        },
                        {
                            groupId: '15',
                            lecturer: 'אורי ברקת',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '14:30', endTime: '15:30', duration: 'שעה' }
                            ]
                        },
                        {
                            groupId: '16',
                            lecturer: 'דניאל סגל',
                            room: 'כיתת תרגול',
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '11:30', endTime: '12:30', duration: 'שעה' }
                            ]
                        }
                    ]
                }
            ]
        },
        '03940805': {
            code: '03940805',
            name: 'חינוך גופני (יוגה)',
            credits: 1.0,
            cardClass: 'timetable-card-yoga',
            isAnchor: true,
            anchorGroupId: '24',
            anchorNote: 'עוגן במערכת: יוגה (יום חמישי 07:30-09:00)',
            slots: [
                {
                    slotType: 'sport',
                    slotName: 'אימון',
                    isAnchor: true,
                    anchorGroupId: '24',
                    options: [
                        {
                            groupId: '24',
                            sportName: 'יוגה',
                            lecturer: 'שלומית בן-איש',
                            room: 'אולם ספורט (יוגה)',
                            isAnchor: true,
                            meetings: [
                                { dayIndex: 4, dayName: 'חמישי', startTime: '07:30', endTime: '09:00', duration: 'שעה וחצי' }
                            ]
                        },
                        {
                            groupId: '25',
                            sportName: 'אתלטיקה',
                            lecturer: 'אלכס פוסטובוי',
                            room: 'אצטדיון הטכניון',
                            meetings: [
                                { dayIndex: 1, dayName: 'שני', startTime: '08:00', endTime: '09:30', duration: 'שעה וחצי' }
                            ]
                        },
                        {
                            groupId: '26',
                            sportName: 'חדר כושר',
                            lecturer: 'מיכאל גרינברג',
                            room: 'חדר כושר',
                            meetings: [
                                { dayIndex: 2, dayName: 'שלישי', startTime: '16:30', endTime: '18:00', duration: 'שעה וחצי' }
                            ]
                        },
                        {
                            groupId: '27',
                            sportName: 'טניס',
                            lecturer: 'יואב רז',
                            room: 'מגרשי טניס',
                            meetings: [
                                { dayIndex: 0, dayName: 'ראשון', startTime: '08:00', endTime: '09:30', duration: 'שעה וחצי' }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    // Convert "HH:MM" to minutes from 00:00
    function timeToMinutes(tStr) {
        if (!tStr) return 0;
        const parts = tStr.split(':').map(Number);
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    }

    // Minutes to "HH:MM"
    function minutesToTime(mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Check if two class meetings conflict in time on the same day
    function doMeetingsOverlap(m1, m2) {
        if (m1.dayIndex !== m2.dayIndex) return false;
        const s1 = timeToMinutes(m1.startTime);
        const e1 = timeToMinutes(m1.endTime);
        const s2 = timeToMinutes(m2.startTime);
        const e2 = timeToMinutes(m2.endTime);
        return Math.max(s1, s2) < Math.min(e1, e2);
    }

    // Ingest extra or user-synced schedule groups from CheeseFork
    function ingestCheeseForkCourseGroups(catalog, coursesField) {
        if (!coursesField || typeof coursesField !== 'object') return;
        // Merge any dynamic course options
        Object.entries(coursesField).forEach(([code, cData]) => {
            const cleanCode = code.replace(/^0+/, '');
            if (cData && cData.slots && Array.isArray(cData.slots)) {
                catalog[cleanCode] = cData;
                catalog[code] = cData;
            }
        });
    }

    /**
     * Core Algorithm: Generates all conflict-free timetable combinations.
     * Uses depth-first backtracking with early pruning.
     */
    function generateTimetableCombinations(selectedCodes, preferences = {}) {
        const catalog = Object.assign({}, TECH_COURSE_GROUPS_CATALOG);
        
        // 1. Gather all required slots for selected courses
        const requiredSlots = [];
        const validCodes = (selectedCodes && selectedCodes.length > 0)
            ? selectedCodes
            : ['034056', '034053', '034035', '104228', '114052', '03940805'];

        validCodes.forEach(code => {
            const cleanCode = code.replace(/^0+/, '');
            const cInfo = catalog[code] || catalog[cleanCode];
            if (!cInfo || !cInfo.slots) return;

            cInfo.slots.forEach(slot => {
                if (slot.options && slot.options.length > 0) {
                    let eligibleOptions = slot.options;

                    // In Technion sport registration, students enroll into ONE specific sport section
                    // with a fixed, unmovable time. It acts as a hard anchor (עוגן) in the schedule.
                    const isSportOrAnchor = Boolean(cInfo.isAnchor || slot.isAnchor || slot.slotType === 'sport');
                    const targetAnchorId = (preferences.anchorGroups && preferences.anchorGroups[cInfo.code])
                        || slot.anchorGroupId
                        || (isSportOrAnchor ? '24' : null);

                    if (targetAnchorId) {
                        const matched = slot.options.filter(o => o.groupId === targetAnchorId);
                        if (matched.length > 0) {
                            eligibleOptions = matched;
                        }
                    }

                    requiredSlots.push({
                        courseCode: cInfo.code,
                        courseName: cInfo.name,
                        credits: cInfo.credits,
                        cardClass: cInfo.cardClass,
                        slotType: slot.slotType,
                        slotName: slot.slotName,
                        isAnchor: isSportOrAnchor,
                        options: eligibleOptions
                    });
                }
            });
        });

        if (requiredSlots.length === 0) {
            return [];
        }

        const validSolutions = [];
        const MAX_SOLUTIONS = 100; // Cap to keep browser UI instantaneous

        function backtrack(slotIdx, currentSelection, allCurrentMeetings) {
            if (validSolutions.length >= MAX_SOLUTIONS) return;

            if (slotIdx === requiredSlots.length) {
                // Found a collision-free complete schedule!
                validSolutions.push(buildTimetableOption(currentSelection, validSolutions.length + 1));
                return;
            }

            const currentSlot = requiredSlots[slotIdx];
            for (let i = 0; i < currentSlot.options.length; i++) {
                const candidateOption = currentSlot.options[i];
                const meetings = candidateOption.meetings || [];

                // Check conflict against already chosen meetings
                let hasConflict = false;
                for (let m = 0; m < meetings.length; m++) {
                    const candidateMeeting = meetings[m];
                    for (let c = 0; c < allCurrentMeetings.length; c++) {
                        if (doMeetingsOverlap(candidateMeeting, allCurrentMeetings[c])) {
                            hasConflict = true;
                            break;
                        }
                    }
                    if (hasConflict) break;
                }

                if (!hasConflict) {
                    // Recurse down
                    const nextMeetings = allCurrentMeetings.concat(meetings);
                    currentSelection.push({
                        courseCode: currentSlot.courseCode,
                        courseName: currentSlot.courseName,
                        credits: currentSlot.credits,
                        cardClass: currentSlot.cardClass,
                        slotType: currentSlot.slotType,
                        slotName: currentSlot.slotName,
                        option: candidateOption
                    });

                    backtrack(slotIdx + 1, currentSelection, nextMeetings);

                    currentSelection.pop();
                }
            }
        }

        backtrack(0, [], []);

        // 2. Score and sort solutions
        const sortCriteria = preferences.sortBy || 'freeDays';
        sortOptions(validSolutions, sortCriteria);

        return validSolutions;
    }

    /**
     * Builds a structured, complete Timetable Option object
     */
    function buildTimetableOption(selection, optionIndex) {
        const days = [0, 1, 2, 3, 4].map(idx => ({
            dayIndex: idx,
            name: DAY_NAMES[idx],
            fullName: `יום ${DAY_NAMES[idx]}`,
            isFree: true,
            classes: [],
            gapMinutes: 0
        }));

        let totalClasses = 0;
        let totalMinutes = 0;
        let earliestStart = 24 * 60;
        let latestEnd = 0;

        selection.forEach(item => {
            const opt = item.option;
            (opt.meetings || []).forEach(m => {
                if (m.dayIndex >= 0 && m.dayIndex <= 4) {
                    const startMin = timeToMinutes(m.startTime);
                    const endMin = timeToMinutes(m.endTime);
                    const dur = endMin - startMin;

                    totalClasses++;
                    totalMinutes += dur;
                    if (startMin < earliestStart) earliestStart = startMin;
                    if (endMin > latestEnd) latestEnd = endMin;

                    const isClassAnchor = Boolean(item.isAnchor || opt.isAnchor || item.slotType === 'sport');
                    days[m.dayIndex].classes.push({
                        courseId: item.courseCode,
                        courseName: item.courseName,
                        type: `${item.slotName} (קבוצה ${opt.groupId})`,
                        group: opt.groupId,
                        lecturer: opt.lecturer || '',
                        room: opt.room || 'כיתת טכניון',
                        startTime: m.startTime,
                        endTime: m.endTime,
                        duration: m.duration || `${(dur / 60).toFixed(1)} שעות`,
                        cardClass: item.cardClass || 'timetable-card-default',
                        isAnchor: isClassAnchor,
                        anchorLabel: isClassAnchor ? '⚓ עוגן במערכת' : ''
                    });
                }
            });
        });

        // Compute gaps, free days, lunch break windows, and continuous marathon hours
        let totalGapMinutes = 0;
        let freeDaysCount = 0;
        const freeDayNames = [];
        let daysWithLunchBreak = 0;
        let activeDaysCount = 0;
        let daysWithoutBreaksCount = 0;
        let worstContinuousMinutes = 0;
        let marathonDaysCount = 0;

        days.forEach(d => {
            d.classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
            d.isFree = d.classes.length === 0;

            if (d.isFree) {
                freeDaysCount++;
                freeDayNames.push(d.name);
                d.hasLunchBreak = true;
                d.lunchBreakText = 'יום חופשי';
                d.maxContinuousHours = '0';
                d.hasZeroBreaks = false;
                d.isMarathon = false;
            } else {
                activeDaysCount++;

                // 1. Compute idle gaps between classes
                for (let i = 0; i < d.classes.length - 1; i++) {
                    const curEnd = timeToMinutes(d.classes[i].endTime);
                    const nextStart = timeToMinutes(d.classes[i + 1].startTime);
                    const gap = nextStart - curEnd;
                    if (gap > 0) {
                        d.gapMinutes += gap;
                        totalGapMinutes += gap;
                    }
                }

                // 2. Continuous hours without breaks (marathon analysis)
                let currentBlock = 0;
                let dayMaxBlock = 0;
                for (let i = 0; i < d.classes.length; i++) {
                    const c = d.classes[i];
                    const startM = timeToMinutes(c.startTime);
                    const endM = timeToMinutes(c.endTime);
                    const dur = endM - startM;

                    if (i === 0) {
                        currentBlock = dur;
                    } else {
                        const prevEnd = timeToMinutes(d.classes[i - 1].endTime);
                        if (startM <= prevEnd + 15) { // continuous or minimal 10-15m transition
                            currentBlock += dur;
                        } else {
                            if (currentBlock > dayMaxBlock) dayMaxBlock = currentBlock;
                            currentBlock = dur;
                        }
                    }
                    if (currentBlock > dayMaxBlock) dayMaxBlock = currentBlock;
                }
                d.maxContinuousHours = (dayMaxBlock / 60).toFixed(1);
                if (dayMaxBlock > worstContinuousMinutes) worstContinuousMinutes = dayMaxBlock;

                // Day with no breaks at all (>= 2 classes and 0 gap minutes)
                d.hasZeroBreaks = (d.classes.length >= 2 && d.gapMinutes === 0);
                if (d.hasZeroBreaks) daysWithoutBreaksCount++;

                d.isMarathon = (dayMaxBlock >= 240); // >= 4 hours non-stop
                if (d.isMarathon) marathonDaysCount++;

                // 3. Lunch Break Analysis (12:00 to 14:30 = 720 to 870 minutes)
                const firstStart = timeToMinutes(d.classes[0].startTime);
                const lastEnd = timeToMinutes(d.classes[d.classes.length - 1].endTime);

                let hasLunch = false;
                let lunchText = '';

                // Finished before lunch or starts after lunch
                if (lastEnd <= 12 * 60 + 30) {
                    hasLunch = true;
                    lunchText = `סיום מוקדם (${minutesToTime(lastEnd)})`;
                } else if (firstStart >= 13 * 60 + 30) {
                    hasLunch = true;
                    lunchText = `התחלה מאוחרת (${minutesToTime(firstStart)})`;
                } else {
                    // Check if there is an idle gap inside or overlapping [12:00, 14:30]
                    for (let i = 0; i < d.classes.length - 1; i++) {
                        const curEnd = timeToMinutes(d.classes[i].endTime);
                        const nextStart = timeToMinutes(d.classes[i + 1].startTime);
                        const overlapStart = Math.max(12 * 60, curEnd);
                        const overlapEnd = Math.min(14 * 60 + 30, nextStart);
                        const overlap = overlapEnd - overlapStart;
                        if (overlap >= 45) { // at least 45 minutes free during lunch
                            hasLunch = true;
                            lunchText = `${minutesToTime(curEnd)} - ${minutesToTime(nextStart)} (${(overlap / 60).toFixed(1)} שעות)`;
                            break;
                        }
                    }
                }

                d.hasLunchBreak = hasLunch;
                d.lunchBreakText = lunchText || 'ללא זמן לאוכל';
                if (hasLunch) daysWithLunchBreak++;
            }
        });

        // Add standard Friday/Saturday as free
        freeDaysCount += 2;
        freeDayNames.push('שישי', 'שבת');

        // Calculate Academic Schedule Fitness Score (0-100)
        let score = 75;
        // Higher score for more free weekdays (Sunday-Thursday)
        const freeWeekdays = days.filter(d => d.isFree).length;
        score += freeWeekdays * 10; // +10 per free weekday
        // Penalty for gap hours (-2 points per hour of dead time)
        score -= Math.round((totalGapMinutes / 60) * 2);
        // Bonus for late starts (no early 07:30/08:30 mornings)
        if (earliestStart >= 9 * 60 + 30) score += 5;
        // Bonus for early finish (done before 16:30)
        if (latestEnd <= 16 * 60 + 30) score += 4;
        
        // Bonus for daily lunch break (+8 points)
        const hasDailyLunchBreak = (activeDaysCount > 0 && daysWithLunchBreak === activeDaysCount);
        if (hasDailyLunchBreak) {
            score += 8;
        } else if (daysWithLunchBreak > 0) {
            score += Math.round((daysWithLunchBreak / (activeDaysCount || 1)) * 5);
        }

        // Penalty for days without ANY breaks (-3 points per zero-break day)
        score -= (daysWithoutBreaksCount * 3);

        // Penalty for marathons >= 4.5 continuous hours (-4 points)
        if (worstContinuousMinutes >= 270) {
            score -= 4;
        }

        score = Math.max(50, Math.min(99, score));

        const lunchSummary = hasDailyLunchBreak 
            ? 'הפסקת צהריים מובטחת בכל יום! 🥪' 
            : `זמן לאוכל: ${daysWithLunchBreak}/${activeDaysCount} ימי לימוד`;

        const pacingSummary = daysWithoutBreaksCount === 0 
            ? 'קצב שפוי (ללא ימי מרתון רצופים) 🧘' 
            : `⚠️ ${daysWithoutBreaksCount} ימים רצופים ללא הפסקה (עד ${(worstContinuousMinutes / 60).toFixed(1)} שעות)`;

        return {
            id: `tt-option-${optionIndex}`,
            index: optionIndex,
            score: score,
            freeDaysCount: freeDaysCount,
            freeWeekdaysCount: freeWeekdays,
            freeDayNames: freeDayNames,
            totalGapMinutes: totalGapMinutes,
            totalGapHoursText: totalGapMinutes === 0 ? '0 שעות (רציף!)' : `${(totalGapMinutes / 60).toFixed(1)} שעות חלון`,
            earliestStartTime: earliestStart < 24 * 60 ? minutesToTime(earliestStart) : '--',
            latestEndTime: latestEnd > 0 ? minutesToTime(latestEnd) : '--',
            totalClasses: totalClasses,
            totalWeeklyHours: (totalMinutes / 60).toFixed(1),
            activeDaysCount: activeDaysCount,
            daysWithLunchBreak: daysWithLunchBreak,
            hasDailyLunchBreak: hasDailyLunchBreak,
            lunchSummary: lunchSummary,
            daysWithoutBreaksCount: daysWithoutBreaksCount,
            worstContinuousMinutes: worstContinuousMinutes,
            worstContinuousHours: (worstContinuousMinutes / 60).toFixed(1),
            marathonDaysCount: marathonDaysCount,
            pacingSummary: pacingSummary,
            selection: selection,
            days: days
        };
    }

    /**
     * Sorts combinations according to user's objective
     */
    function sortOptions(options, criteria) {
        options.sort((a, b) => {
            if (criteria === 'freeDays') {
                if (b.freeWeekdaysCount !== a.freeWeekdaysCount) return b.freeWeekdaysCount - a.freeWeekdaysCount;
                if (a.totalGapMinutes !== b.totalGapMinutes) return a.totalGapMinutes - b.totalGapMinutes;
                return b.score - a.score;
            } else if (criteria === 'lunchBreak') {
                if (b.daysWithLunchBreak !== a.daysWithLunchBreak) return b.daysWithLunchBreak - a.daysWithLunchBreak;
                if (a.daysWithoutBreaksCount !== b.daysWithoutBreaksCount) return a.daysWithoutBreaksCount - b.daysWithoutBreaksCount;
                if (b.freeWeekdaysCount !== a.freeWeekdaysCount) return b.freeWeekdaysCount - a.freeWeekdaysCount;
                return b.score - a.score;
            } else if (criteria === 'sanePacing') {
                if (a.daysWithoutBreaksCount !== b.daysWithoutBreaksCount) return a.daysWithoutBreaksCount - b.daysWithoutBreaksCount;
                if (a.worstContinuousMinutes !== b.worstContinuousMinutes) return a.worstContinuousMinutes - b.worstContinuousMinutes;
                if (b.daysWithLunchBreak !== a.daysWithLunchBreak) return b.daysWithLunchBreak - a.daysWithLunchBreak;
                return b.score - a.score;
            } else if (criteria === 'minGaps') {
                if (a.totalGapMinutes !== b.totalGapMinutes) return a.totalGapMinutes - b.totalGapMinutes;
                if (b.freeWeekdaysCount !== a.freeWeekdaysCount) return b.freeWeekdaysCount - a.freeWeekdaysCount;
                return b.score - a.score;
            } else if (criteria === 'lateStart') {
                const sA = timeToMinutes(a.earliestStartTime);
                const sB = timeToMinutes(b.earliestStartTime);
                if (sB !== sA) return sB - sA;
                return b.score - a.score;
            } else if (criteria === 'earlyFinish') {
                const eA = timeToMinutes(a.latestEndTime);
                const eB = timeToMinutes(b.latestEndTime);
                if (eA !== eB) return eA - eB;
                return b.score - a.score;
            } else {
                return b.score - a.score;
            }
        });

        // Re-index after sorting
        options.forEach((opt, idx) => {
            opt.displayIndex = idx + 1;
        });
    }

    // =========================================================================
    // UI Controller & Modal Studio
    // =========================================================================
    const TimetableStudio = {
        options: [],
        currentOptionIndex: 0,
        selectedCourses: ['034056', '034053', '034035', '104228', '114052', '03940805'],
        currentSort: 'freeDays',
        isInitialized: false,

        open: function () {
            const modal = document.getElementById('modal-timetable-generator');
            if (!modal) return;

            // Collect active courses from gameState if available
            if (global.gameState && global.gameState.courses) {
                const activeSem3 = Object.values(global.gameState.courses)
                    .filter(c => c.status === 'active' || Number(c.semester) === 3)
                    .map(c => c.code);
                if (activeSem3.length > 0) {
                    this.selectedCourses = Array.from(new Set(activeSem3));
                }
            }

            this.computeAndRender();
            modal.style.display = 'flex';
            this.bindEventsOnce();
        },

        close: function () {
            const modal = document.getElementById('modal-timetable-generator');
            if (modal) modal.style.display = 'none';
        },

        computeAndRender: function () {
            this.options = generateTimetableCombinations(this.selectedCourses, { sortBy: this.currentSort });
            this.currentOptionIndex = 0;
            this.renderCourseChips();
            this.renderPillsCarousel();
            this.renderActiveOption();
        },

        renderCourseChips: function () {
            const container = document.getElementById('ttg-courses-chips');
            const summary = document.getElementById('ttg-courses-summary');
            if (!container) return;

            const catalog = TECH_COURSE_GROUPS_CATALOG;
            let totalCredits = 0;
            let html = '';

            Object.values(catalog).forEach(c => {
                const isChecked = this.selectedCourses.includes(c.code) || this.selectedCourses.includes(c.code.replace(/^0+/, ''));
                if (isChecked) totalCredits += (c.credits || 0);

                html += `
                    <label class="ttg-course-chip ${isChecked ? 'is-checked' : ''}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 0.76rem; background: ${isChecked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)'}; border: 1px solid ${isChecked ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}; color: ${isChecked ? '#fff' : '#94a3b8'}; cursor: pointer; user-select: none;">
                        <input type="checkbox" class="ttg-course-cb" value="${c.code}" ${isChecked ? 'checked' : ''} style="accent-color: #38bdf8;">
                        <span>${c.name} (${c.code})</span>
                        ${c.isAnchor ? `<span style="background: rgba(245, 158, 11, 0.22); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); padding: 1px 6px; border-radius: 4px; font-weight: 800; font-size: 0.68rem;" title="${c.anchorNote || 'עוגן במערכת'}">⚓ עוגן (חמישי 07:30)</span>` : ''}
                        <span style="opacity: 0.7; font-size: 0.70rem;">• ${c.credits} נק״ז</span>
                    </label>
                `;
            });

            container.innerHTML = html;
            if (summary) {
                summary.innerText = `(${this.selectedCourses.length} קורסים נבחרו, סה״כ ${totalCredits} נק״ז)`;
            }

            container.querySelectorAll('.ttg-course-cb').forEach(cb => {
                cb.onchange = () => {
                    const code = cb.value;
                    if (cb.checked) {
                        if (!this.selectedCourses.includes(code)) this.selectedCourses.push(code);
                    } else {
                        this.selectedCourses = this.selectedCourses.filter(c => c !== code && c !== code.replace(/^0+/, ''));
                    }
                    this.computeAndRender();
                };
            });
        },

        renderPillsCarousel: function () {
            const row = document.getElementById('ttg-options-pills-row');
            if (!row) return;

            if (this.options.length === 0) {
                row.innerHTML = `<div style="color: #ef4444; font-size: 0.85rem; padding: 8px;">❌ לא נמצאו קומבינציות חופשיות מהתנגשויות לקורסים שנבחרו. נסה להסיר קורס אחד או לשנות שילוב.</div>`;
                return;
            }

            let html = '';
            this.options.forEach((opt, idx) => {
                const isActive = (idx === this.currentOptionIndex);
                const star = idx === 0 ? '⭐ ' : '';
                html += `
                    <button type="button" class="ttg-opt-pill ${isActive ? 'active' : ''}" data-index="${idx}">
                        <span>${star}מערכת ${opt.displayIndex}</span>
                        <span style="font-size: 0.68rem; opacity: 0.85;">(${opt.score}%)</span>
                        <span style="font-size: 0.68rem; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 8px;">${opt.freeWeekdaysCount} ימים חופשיים</span>
                    </button>
                `;
            });

            row.innerHTML = html;
            row.querySelectorAll('.ttg-opt-pill').forEach(btn => {
                btn.onclick = () => {
                    this.currentOptionIndex = parseInt(btn.dataset.index, 10);
                    this.renderActiveOption();
                    this.updatePillsActiveState();
                };
            });
        },

        updatePillsActiveState: function () {
            const row = document.getElementById('ttg-options-pills-row');
            if (!row) return;
            row.querySelectorAll('.ttg-opt-pill').forEach((btn, idx) => {
                btn.classList.toggle('active', idx === this.currentOptionIndex);
                if (idx === this.currentOptionIndex) {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            });
        },

        renderActiveOption: function () {
            const previewGrid = document.getElementById('ttg-preview-grid');
            const pagingInfo = document.getElementById('ttg-paging-info');
            const badgesContainer = document.getElementById('ttg-option-badges');
            const breakdownCard = document.getElementById('ttg-breakdown-card');
            const prevBtn = document.getElementById('ttg-btn-prev');
            const nextBtn = document.getElementById('ttg-btn-next');

            if (!this.options || this.options.length === 0) {
                if (previewGrid) previewGrid.innerHTML = '<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #94a3b8;">אין מערכות שעות להצגה.</div>';
                if (pagingInfo) pagingInfo.innerText = '0 מתוך 0';
                if (badgesContainer) badgesContainer.innerHTML = '';
                if (breakdownCard) breakdownCard.innerHTML = '';
                return;
            }

            const current = this.options[this.currentOptionIndex];

            // Paging Buttons state
            if (prevBtn) prevBtn.disabled = (this.currentOptionIndex === 0);
            if (nextBtn) nextBtn.disabled = (this.currentOptionIndex === this.options.length - 1);
            if (pagingInfo) pagingInfo.innerText = `אפשרות ${current.displayIndex} מתוך ${this.options.length}`;

            // Badges
            if (badgesContainer) {
                const recBadge = current.displayIndex === 1
                    ? `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">⭐ הבחירה האופטימלית</span>`
                    : '';

                const lunchBadge = current.hasDailyLunchBreak
                    ? `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">🥪 הפסקת צהריים יומית מלאה</span>`
                    : `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">🥪 צהריים: ${current.daysWithLunchBreak}/${current.activeDaysCount} ימים</span>`;

                const pacingBadge = current.daysWithoutBreaksCount === 0
                    ? `<span style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">🧘 קצב שפוי (ללא מרתונים)</span>`
                    : `<span style="background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">⚠️ ${current.daysWithoutBreaksCount} ימים רצופים</span>`;

                badgesContainer.innerHTML = `
                    ${recBadge}
                    <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">
                        ⚓ עוגן: יוגה (חמישי 07:30-09:00)
                    </span>
                    <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">
                        🏖️ ${current.freeWeekdaysCount} ימי חופש באמצ״ש (${current.freeDayNames.filter(n => n !== 'שישי' && n !== 'שבת').join(', ') || 'אין'})
                    </span>
                    ${lunchBadge}
                    ${pacingBadge}
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">
                        ⏱️ ${current.totalGapHoursText}
                    </span>
                    <span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">
                        🏆 ציון: ${current.score}%
                    </span>
                `;
            }

            // Render 5 Days Columns
            if (previewGrid) {
                let gridHtml = '';
                current.days.forEach(d => {
                    const isFree = d.isFree;
                    let classesHtml = '';

                    if (isFree) {
                        classesHtml = `
                            <div class="timetable-free-state" style="padding: 30px 10px; text-align: center; color: #94a3b8;">
                                <div style="font-size: 2rem; margin-bottom: 6px;">🏖️</div>
                                <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">יום חופשי!</div>
                                <div style="font-size: 0.72rem; margin-top: 4px; line-height: 1.3;">אין לימודים פרונטליים ביום זה</div>
                            </div>
                        `;
                    } else {
                        classesHtml = '<div class="ttg-preview-classes-list">';
                        for (let i = 0; i < d.classes.length; i++) {
                            const c = d.classes[i];
                            const isTut = (c.type && (c.type.includes('תרגול') || c.type.includes('מעבדה')));
                            const isSport = (c.type && (c.type.includes('אימון') || c.type.includes('ספורט')));
                            const instructorLabel = isTut ? '🧑‍🏫 מתרגל/ת:' : (isSport ? '🏃 מאמן/ת:' : '👨‍🏫 מרצה:');
                            const instructorColor = isTut ? '#c084fc' : (isSport ? '#34d399' : '#38bdf8');
                            const instructorBg = isTut ? 'rgba(192, 132, 252, 0.15)' : (isSport ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)');
                            const instructorBorder = isTut ? 'rgba(192, 132, 252, 0.35)' : (isSport ? 'rgba(52, 211, 153, 0.35)' : 'rgba(56, 189, 248, 0.35)');

                            classesHtml += `
                                <div class="timetable-card ${c.cardClass}" style="margin-bottom: 8px;">
                                    <div class="timetable-card-top">
                                        <span class="timetable-card-time">⏰ ${c.startTime} - ${c.endTime}</span>
                                        <span class="timetable-card-room">${c.room}</span>
                                    </div>
                                    <div class="timetable-card-name" style="font-size: 0.88rem; font-weight: 800;">${c.courseName}</div>
                                    <div class="timetable-card-sub" style="font-size: 0.74rem; color: #cbd5e1; margin-top: 3px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                        <span class="timetable-tag" style="background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.type}</span>
                                        ${(c.isAnchor || isSport) ? `<span class="timetable-tag is-anchor" style="background: rgba(245, 158, 11, 0.22); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); font-weight: 800; padding: 2px 6px; border-radius: 4px;">⚓ עוגן קבוע</span>` : ''}
                                    </div>
                                    ${c.lecturer ? `
                                        <div class="ttg-card-instructor" style="margin-top: 6px; padding: 4px 8px; border-radius: 6px; background: ${instructorBg}; border: 1px solid ${instructorBorder}; display: flex; align-items: center; justify-content: space-between; font-size: 0.76rem;">
                                            <span style="color: ${instructorColor}; font-weight: 700;">${instructorLabel}</span>
                                            <span style="color: #ffffff; font-weight: 800;">${c.lecturer}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `;

                            // Show gap indicator if there is an idle window before the next class
                            if (i < d.classes.length - 1) {
                                const endMin = timeToMinutes(c.endTime);
                                const nextStart = timeToMinutes(d.classes[i + 1].startTime);
                                const gap = nextStart - endMin;
                                if (gap > 0) {
                                    const gapText = gap === 60 ? 'שעה' : (gap === 120 ? 'שעתיים' : `${(gap / 60).toFixed(1)} שעות`);
                                    classesHtml += `
                                        <div class="ttg-gap-indicator">
                                            <span>⏳ חלון / שעה מתה: <strong>${gapText}</strong></span>
                                        </div>
                                    `;
                                }
                            }
                        }
                        classesHtml += '</div>';
                    }

                    const lunchBadge = d.hasLunchBreak
                        ? `<span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="${d.lunchBreakText}">🥪 צהריים: ${d.lunchBreakText}</span>`
                        : `<span style="font-size: 0.68rem; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="ללא חלון צהריים של 45 דק׳ בין 12:00-14:30">⚠️ ללא צהריים</span>`;

                    const marathonBadge = (d.hasZeroBreaks || d.isMarathon)
                        ? `<span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="יום לימודים רצוף">${d.maxContinuousHours} ש' רצופות</span>`
                        : '';

                    const hasAnchor = d.classes.some(c => c.isAnchor || (c.type && (c.type.includes('יוגה') || c.type.includes('אימון'))));
                    const anchorBadge = hasAnchor
                        ? `<span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.22); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="עוגן שבועי קבוע">⚓ יוגה 07:30</span>`
                        : '';

                    gridHtml += `
                        <div class="ttg-preview-day-col ${isFree ? 'is-free-col' : ''}">
                            <div class="ttg-preview-day-header" style="display: flex; flex-direction: column; gap: 5px; align-items: stretch;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 800; color: #fff;">${d.fullName}</span>
                                    <span style="font-size: 0.70rem; color: ${isFree ? '#34d399' : '#38bdf8'}; font-weight: 700;">
                                        ${isFree ? 'יום חופשי ✨' : `${d.classes.length} שיעורים`}
                                    </span>
                                </div>
                                ${!isFree ? `
                                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                        ${anchorBadge}
                                        ${lunchBadge}
                                        ${marathonBadge}
                                    </div>
                                ` : ''}
                            </div>
                            ${classesHtml}
                        </div>
                    `;
                });

                previewGrid.innerHTML = gridHtml;
            }

            // Detailed Breakdown Card
            if (breakdownCard) {
                const groupList = current.selection.map(s => {
                    const isTut = (s.slotName && (s.slotName.includes('תרגול') || s.slotName.includes('מעבדה')));
                    const isSport = (s.slotName && (s.slotName.includes('אימון') || s.slotName.includes('ספורט')));
                    const roleLabel = isTut ? 'מתרגל/ת' : (isSport ? 'מאמן/ת' : 'מרצה');
                    const color = isTut ? '#c084fc' : (isSport ? '#34d399' : '#38bdf8');
                    return `
                        <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px;">
                            <strong>${s.courseName}:</strong> ${s.slotName} קב' ${s.option.groupId}
                            <span style="color: ${color}; font-weight: 800; background: rgba(0,0,0,0.25); padding: 1px 6px; border-radius: 4px;">
                                ${roleLabel}: ${s.option.lecturer || 'סגל'}
                            </span>
                        </span>
                    `;
                }).join(' ');

                breakdownCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #f8fafc; font-size: 0.84rem;">📋 הרכב הקבוצות והשעות של מערכת מס' ${current.displayIndex}:</span>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.76rem; color: #94a3b8;">
                            <span>🥪 ${current.lunchSummary}</span>
                            <span>|</span>
                            <span>${current.pacingSummary}</span>
                            <span>|</span>
                            <span>שעות נטו: <strong>${current.totalWeeklyHours} שעות/שבוע</strong></span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${groupList}
                    </div>
                    ${current.selection.some(s => s.isAnchor || s.slotType === 'sport') ? `
                        <div style="margin-top: 10px; padding: 7px 12px; border-radius: 6px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); font-size: 0.76rem; color: #fde68a; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                            <span>⚓ <strong>עוגן קשיח במערכת:</strong> קורס ספורט (יוגה, יום חמישי 07:30-09:00 • מאמנת: שלומית בן-איש) נעול כעוגן מערכתי - כל הקומבינציות סודרו סביבו ב-100% ללא התנגשות!</span>
                            <span style="font-size: 0.70rem; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 4px;">קבוצה 24 (אולם ספורט)</span>
                        </div>
                    ` : ''}
                `;
            }
        },

        next: function () {
            if (this.currentOptionIndex < this.options.length - 1) {
                this.currentOptionIndex++;
                this.renderActiveOption();
                this.updatePillsActiveState();
            }
        },

        prev: function () {
            if (this.currentOptionIndex > 0) {
                this.currentOptionIndex--;
                this.renderActiveOption();
                this.updatePillsActiveState();
            }
        },

        applyActiveSchedule: function () {
            if (!this.options || this.options.length === 0) return;
            const chosen = this.options[this.currentOptionIndex];

            const freeDayIndices = chosen.days.filter(d => d.isFree).map(d => d.dayIndex);
            // Append Friday and Saturday
            freeDayIndices.push(5, 6);

            const newTimetable = {
                semester: (global.gameState && global.gameState.currentActiveSemester) ? `20260${global.gameState.currentActiveSemester}` : '202601',
                name: `מערכת מותאמת אישית (אפשרות ${chosen.displayIndex})`,
                freeDays: freeDayIndices,
                dayNames: DAY_NAMES,
                syncedAt: new Date().toISOString(),
                source: `CheeseFork Options Studio (Option ${chosen.displayIndex})`,
                days: chosen.days
            };

            if (global.gameState) {
                global.gameState.timetable = newTimetable;
            }

            if (typeof global.CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                global.CHEESEFORK_SEMESTER_SCHEDULE.days = chosen.days;
                global.CHEESEFORK_SEMESTER_SCHEDULE.freeDays = freeDayIndices;
            }

            if (typeof global.saveState === 'function') global.saveState();
            if (typeof global.updateDailyTimetableFocus === 'function') global.updateDailyTimetableFocus();
            if (typeof global.renderTimetableGrid === 'function') global.renderTimetableGrid();

            this.close();

            const toastMsg = `🎉 מערכת שעות מס' ${chosen.displayIndex} הוחלה בהצלחה! (${chosen.freeWeekdaysCount} ימי חופש שבועיים, ${chosen.totalGapHoursText})`;
            if (typeof global.showHudToast === 'function') {
                global.showHudToast(toastMsg, 'success');
            } else if (typeof global.showToastNotification === 'function') {
                global.showToastNotification(toastMsg, 'success');
            } else {
                alert(toastMsg);
            }
        },

        bindEventsOnce: function () {
            if (this.isInitialized) return;
            this.isInitialized = true;

            const closeBtn = document.getElementById('modal-timetable-generator-close');
            const bottomCloseBtn = document.getElementById('ttg-btn-close');
            const prevBtn = document.getElementById('ttg-btn-prev');
            const nextBtn = document.getElementById('ttg-btn-next');
            const applyBtn = document.getElementById('ttg-btn-apply');
            const syncCfBtn = document.getElementById('ttg-btn-sync-cf-live');

            if (closeBtn) closeBtn.onclick = () => this.close();
            if (bottomCloseBtn) bottomCloseBtn.onclick = () => this.close();
            if (prevBtn) prevBtn.onclick = () => this.prev();
            if (nextBtn) nextBtn.onclick = () => this.next();
            if (applyBtn) applyBtn.onclick = () => this.applyActiveSchedule();

            // Sort Tabs
            const sortContainer = document.getElementById('ttg-sort-tabs');
            if (sortContainer) {
                sortContainer.querySelectorAll('.ttg-sort-btn').forEach(btn => {
                    btn.onclick = () => {
                        sortContainer.querySelectorAll('.ttg-sort-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.currentSort = btn.dataset.sort || 'freeDays';
                        this.computeAndRender();
                    };
                });
            }

            // Sync from CheeseFork Live button
            if (syncCfBtn) {
                syncCfBtn.onclick = async () => {
                    syncCfBtn.disabled = true;
                    syncCfBtn.innerHTML = '<span>⏳</span> מסנכרן מ-CheeseFork...';
                    try {
                        if (typeof global.syncLiveCheeseForkData === 'function') {
                            await global.syncLiveCheeseForkData(null, true);
                        }
                        this.computeAndRender();
                    } catch (e) {
                        console.warn('[TimetableGenerator] CheeseFork sync warning:', e);
                    } finally {
                        syncCfBtn.disabled = false;
                        syncCfBtn.innerHTML = '<span>🧀</span> סנכרן מ-CheeseFork';
                    }
                };
            }

            // Keyboard navigation (ArrowLeft = prev, ArrowRight = next)
            window.addEventListener('keydown', (e) => {
                const modal = document.getElementById('modal-timetable-generator');
                if (!modal || modal.style.display === 'none') return;

                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prev();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.next();
                } else if (e.key === 'Escape') {
                    this.close();
                }
            });
        }
    };

    // Export module
    global.TimetableGenerator = {
        catalog: TECH_COURSE_GROUPS_CATALOG,
        generateTimetableCombinations: generateTimetableCombinations,
        studio: TimetableStudio,
        open: function () {
            TimetableStudio.open();
        },
        close: function () {
            TimetableStudio.close();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            TECH_COURSE_GROUPS_CATALOG,
            generateTimetableCombinations,
            timeToMinutes,
            minutesToTime,
            doMeetingsOverlap
        };
    }

})(typeof window !== 'undefined' ? window : global);
