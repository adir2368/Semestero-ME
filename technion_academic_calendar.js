// ==========================================================================
// Technion Academic Calendar & Official Holidays Engine
// Atlas ME - Technion Faculty of Mechanical Engineering
// ==========================================================================

(function(global) {
    'use strict';

    const RAW_ACADEMIC_SCHEDULE = [
    {
        "start": "2025-09-22",
        "end": "2025-09-24",
        "title": "🍎 ראש השנה (חופשה)",
        "type": "holiday",
        "desc": "ערב וחג ראש השנה"
    },
    {
        "start": "2025-10-01",
        "end": "2025-10-02",
        "title": "🕊️ יום כיפור (חופשה)",
        "type": "holiday",
        "desc": "ערב ויום כיפור"
    },
    {
        "start": "2025-10-06",
        "end": "2025-10-15",
        "title": "⛺ סוכות ושמחת תורה (חופשה)",
        "type": "holiday",
        "desc": "חופשת סוכות וחול המועד"
    },
    {
        "date": "2025-10-29",
        "title": "🎓 פתיחת סמסטר חורף תשפ\"ו",
        "type": "academic",
        "desc": "יום לימודים ראשון בטכניון"
    },
    {
        "start": "2025-12-15",
        "end": "2025-12-22",
        "title": "🕎 חופשת חנוכה",
        "type": "holiday",
        "desc": "חופשת חנוכה - אין לימודים"
    },
    {
        "date": "2026-01-29",
        "title": "🏁 סיום הוראה סמסטר חורף תשפ\"ו",
        "type": "academic",
        "desc": "יום לימודים אחרון בסמסטר"
    },
    {
        "date": "2026-02-02",
        "title": "📝 תחילת בחינות מועד א׳ (חורף)",
        "type": "academic",
        "desc": "פתיחת תקופת בחינות מועד א׳ חורף"
    },
    {
        "date": "2026-02-26",
        "title": "🏁 סיום בחינות מועד א׳ (חורף)",
        "type": "academic",
        "desc": "תום תקופת מועדי א׳ חורף"
    },
    {
        "start": "2026-03-02",
        "end": "2026-03-03",
        "title": "🎭 חופשת פורים",
        "type": "holiday",
        "desc": "תענית אסתר וחג פורים"
    },
    {
        "date": "2026-03-05",
        "title": "🔄 תחילת בחינות מועד ב׳ (חורף)",
        "type": "academic",
        "desc": "פתיחת תקופת בחינות מועד ב׳ חורף"
    },
    {
        "date": "2026-03-24",
        "title": "🏁 סיום בחינות מועד ב׳ (חורף)",
        "type": "academic",
        "desc": "תום תקופת מועדי ב׳ חורף"
    },
    {
        "date": "2026-03-25",
        "title": "🌱 פתיחת סמסטר אביב תשפ\"ו",
        "type": "academic",
        "desc": "יום לימודים ראשון בסמסטר אביב"
    },
    {
        "start": "2026-04-01",
        "end": "2026-04-09",
        "title": "🍷 חופשת פסח (חופשה אקדמית)",
        "type": "holiday",
        "desc": "ערב פסח, חול המועד וחג שני"
    },
    {
        "date": "2026-04-21",
        "title": "🕯️ ערב יום הזיכרון",
        "type": "holiday",
        "desc": "יום הזיכרון לחללי מערכות ישראל"
    },
    {
        "date": "2026-04-22",
        "title": "🇮🇱 יום העצמאות (חופשה)",
        "type": "holiday",
        "desc": "יום העצמאות ה-78"
    },
    {
        "date": "2026-05-05",
        "title": "🔥 ל״ג בעומר (חופשה)",
        "type": "holiday",
        "desc": "חופשת ל״ג בעומר"
    },
    {
        "start": "2026-05-21",
        "end": "2026-05-22",
        "title": "🌾 חופשת שבועות",
        "type": "holiday",
        "desc": "ערב וחג שבועות"
    },
    {
        "date": "2026-07-09",
        "title": "🏁 סיום הוראה סמסטר אביב תשפ\"ו",
        "type": "academic",
        "desc": "יום לימודים אחרון בסמסטר אביב"
    },
    {
        "date": "2026-07-13",
        "title": "📝 תחילת בחינות מועד א׳ (אביב)",
        "type": "academic",
        "desc": "פתיחת תקופת בחינות מועד א׳ אביב"
    },
    {
        "date": "2026-07-23",
        "title": "🕊️ צום תשעה באב (חופשה)",
        "type": "holiday",
        "desc": "צום ט׳ באב - אין לימודים ומבחנים"
    },
    {
        "date": "2026-08-06",
        "title": "🏁 סיום בחינות מועד א׳ (אביב)",
        "type": "academic",
        "desc": "תום תקופת מועדי א׳ אביב"
    },
    {
        "date": "2026-08-17",
        "title": "🔄 תחילת בחינות מועד ב׳ (אביב)",
        "type": "academic",
        "desc": "פתיחת תקופת בחינות מועד ב׳ אביב"
    },
    {
        "date": "2026-09-10",
        "title": "🏁 סיום בחינות מועד ב׳ (אביב)",
        "type": "academic",
        "desc": "תום תקופת מועדי ב׳ אביב"
    },
    {
        "start": "2026-09-11",
        "end": "2026-09-13",
        "title": "🍎 ראש השנה תשפ\"ז (חופשה)",
        "type": "holiday",
        "desc": "ערב ושני ימי ראש השנה"
    },
    {
        "start": "2026-09-20",
        "end": "2026-09-21",
        "title": "🕊️ יום כיפור (חופשה)",
        "type": "holiday",
        "desc": "ערב ויום כיפור"
    },
    {
        "start": "2026-09-25",
        "end": "2026-10-03",
        "title": "⛺ סוכות ושמחת תורה (חופשה)",
        "type": "holiday",
        "desc": "חופשת סוכות, חול המועד ושמחת תורה"
    },
    {
        "date": "2026-10-19",
        "title": "🧭 יום הכוון לסטודנטים חדשים",
        "type": "academic",
        "desc": "יום קליטה והכוון בטכניון"
    },
    {
        "date": "2026-10-28",
        "title": "🎓 פתיחת סמסטר חורף תשפ\"ז",
        "type": "academic",
        "desc": "יום לימודים ראשון לשנת הלימודים תשפ״ז"
    },
    {
        "start": "2026-12-09",
        "end": "2026-12-11",
        "title": "🕎 חופשת חנוכה",
        "type": "holiday",
        "desc": "חופשת חנוכה רשמית בטכניון"
    },
    {
        "date": "2027-01-28",
        "title": "🏁 סיום הוראה סמסטר חורף תשפ\"ז",
        "type": "academic",
        "desc": "יום לימודים אחרון בסמסטר"
    },
    {
        "date": "2027-02-01",
        "title": "📝 תחילת בחינות מועד א׳ (חורף)",
        "type": "academic",
        "desc": "פתיחת תקופת מועדי א׳ חורף תשפ״ז"
    },
    {
        "date": "2027-02-25",
        "title": "🏁 סיום בחינות מועד א׳ (חורף)",
        "type": "academic",
        "desc": "תום תקופת מועדי א׳ חורף"
    },
    {
        "date": "2027-03-04",
        "title": "🔄 תחילת בחינות מועד ב׳ (חורף)",
        "type": "academic",
        "desc": "פתיחת תקופת מועדי ב׳ חורף תשפ״ז"
    },
    {
        "start": "2027-03-22",
        "end": "2027-03-23",
        "title": "🎭 חופשת פורים",
        "type": "holiday",
        "desc": "תענית אסתר ושושן פורים"
    },
    {
        "date": "2027-03-23",
        "title": "🏁 סיום בחינות מועד ב׳ (חורף)",
        "type": "academic",
        "desc": "תום תקופת מועדי ב׳ חורף"
    },
    {
        "date": "2027-03-24",
        "title": "🌱 פתיחת סמסטר אביב תשפ\"ז",
        "type": "academic",
        "desc": "יום לימודים ראשון בסמסטר אביב"
    },
    {
        "start": "2027-04-21",
        "end": "2027-04-28",
        "title": "🍷 חופשת פסח (חופשה אקדמית)",
        "type": "holiday",
        "desc": "ערב פסח, חול המועד ושביעי של פסח"
    },
    {
        "date": "2027-05-11",
        "title": "🕯️ יום הזיכרון לחללי מערכות ישראל",
        "type": "holiday",
        "desc": "יום הזיכרון"
    },
    {
        "date": "2027-05-12",
        "title": "🇮🇱 יום העצמאות (חופשה)",
        "type": "holiday",
        "desc": "חופשת יום העצמאות ה-79"
    },
    {
        "date": "2027-05-25",
        "title": "🔥 ל״ג בעומר (חופשה)",
        "type": "holiday",
        "desc": "חופשת ל״ג בעומר"
    },
    {
        "start": "2027-06-10",
        "end": "2027-06-11",
        "title": "🌾 חופשת שבועות",
        "type": "holiday",
        "desc": "ערב וחג שבועות"
    },
    {
        "date": "2027-07-08",
        "title": "🏁 סיום הוראה סמסטר אביב תשפ\"ז",
        "type": "academic",
        "desc": "יום לימודים אחרון בסמסטר אביב"
    },
    {
        "date": "2027-07-12",
        "title": "📝 תחילת בחינות מועד א׳ (אביב)",
        "type": "academic",
        "desc": "פתיחת תקופת מועדי א׳ אביב תשפ״ז"
    },
    {
        "date": "2027-08-05",
        "title": "🏁 סיום בחינות מועד א׳ (אביב)",
        "type": "academic",
        "desc": "תום תקופת מועדי א׳ אביב"
    },
    {
        "date": "2027-08-12",
        "title": "🕊️ צום תשעה באב (חופשה)",
        "type": "holiday",
        "desc": "צום ט׳ באב - אין לימודים ומבחנים"
    },
    {
        "date": "2027-08-16",
        "title": "🔄 תחילת בחינות מועד ב׳ (אביב)",
        "type": "academic",
        "desc": "פתיחת תקופת מועדי ב׳ אביב תשפ״ז"
    },
    {
        "date": "2027-09-09",
        "title": "🏁 סיום בחינות מועד ב׳ (אביב)",
        "type": "academic",
        "desc": "תום תקופת מועדי ב׳ אביב"
    }
];

    function expandScheduleToDateMap(rawList) {
        const dateMap = {};

        rawList.forEach(item => {
            if (item.date) {
                if (!dateMap[item.date]) dateMap[item.date] = [];
                dateMap[item.date].push({
                    title: item.title,
                    type: item.type,
                    desc: item.desc || '',
                    date: item.date
                });
            } else if (item.start && item.end) {
                let cur = new Date(item.start + 'T00:00:00');
                const last = new Date(item.end + 'T00:00:00');
                while (cur <= last) {
                    const y = cur.getFullYear();
                    const m = String(cur.getMonth() + 1).padStart(2, '0');
                    const d = String(cur.getDate()).padStart(2, '0');
                    const dStr = y + '-' + m + '-' + d;
                    if (!dateMap[dStr]) dateMap[dStr] = [];
                    dateMap[dStr].push({
                        title: item.title,
                        type: item.type,
                        desc: item.desc || '',
                        date: dStr
                    });
                    cur.setDate(cur.getDate() + 1);
                }
            }
        });

        return dateMap;
    }

    const TECHNION_DATE_EVENTS_MAP = expandScheduleToDateMap(RAW_ACADEMIC_SCHEDULE);

    const ACADEMIC_TERMS = [
        {
            name: 'חורף תשפ״ו',
            week1Sunday: '2025-10-26',
            start: '2025-10-29',
            end: '2026-01-29',
            examStart: '2026-02-02',
            examEnd: '2026-03-24',
            totalWeeks: 13
        },
        {
            name: 'אביב תשפ״ו',
            week1Sunday: '2026-03-22',
            start: '2026-03-25',
            end: '2026-07-09',
            examStart: '2026-07-13',
            examEnd: '2026-09-10',
            totalWeeks: 13
        },
        {
            name: 'חורף תשפ״ז',
            week1Sunday: '2026-10-25',
            start: '2026-10-28',
            end: '2027-01-28',
            examStart: '2027-02-01',
            examEnd: '2027-03-23',
            totalWeeks: 13
        },
        {
            name: 'אביב תשפ״ז',
            week1Sunday: '2027-03-21',
            start: '2027-03-24',
            end: '2027-07-08',
            examStart: '2027-07-12',
            examEnd: '2027-09-09',
            totalWeeks: 13
        }
    ];

    function parseUtcDayMs(ymd) {
        const parts = String(ymd || '').split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return NaN;
        return Date.UTC(parts[0], parts[1] - 1, parts[2]);
    }

    function getAcademicSemesterWeekInfo(refDate) {
        const d = refDate ? new Date(refDate) : new Date();
        const todayMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

        for (let i = 0; i < ACADEMIC_TERMS.length; i++) {
            const term = ACADEMIC_TERMS[i];
            const week1Ms = parseUtcDayMs(term.week1Sunday);
            const startMs = parseUtcDayMs(term.start);
            const endMs = parseUtcDayMs(term.end);
            const examStartMs = parseUtcDayMs(term.examStart);
            const examEndMs = parseUtcDayMs(term.examEnd);
            const totalWeeks = term.totalWeeks || 13;

            if (todayMs >= week1Ms && todayMs <= endMs) {
                const diffDays = Math.floor((todayMs - week1Ms) / 86400000);
                const week = Math.max(1, Math.min(totalWeeks, Math.floor(diffDays / 7) + 1));
                return {
                    phase: 'teaching',
                    week: week,
                    totalWeeks: totalWeeks,
                    termLabel: term.name,
                    badgeText: `שבוע ${week} / ${totalWeeks}`,
                    hintText: `סמסטר ${term.name}`
                };
            }
            if (todayMs > endMs && todayMs <= examEndMs) {
                const inExams = todayMs >= examStartMs;
                return {
                    phase: inExams ? 'exams' : 'prep',
                    week: totalWeeks,
                    totalWeeks: totalWeeks,
                    termLabel: term.name,
                    badgeText: inExams ? 'תקופת בחינות' : 'הכנה לבחינות',
                    hintText: `סמסטר ${term.name}`
                };
            }
            if (todayMs < week1Ms) {
                const daysUntil = Math.max(1, Math.ceil((startMs - todayMs) / 86400000));
                return {
                    phase: 'break',
                    week: 0,
                    totalWeeks: totalWeeks,
                    termLabel: term.name,
                    badgeText: 'חופשת סמסטר',
                    hintText: `עוד ${daysUntil} ימים ל${term.name}`
                };
            }
        }
        return {
            phase: 'teaching',
            week: 1,
            totalWeeks: 13,
            termLabel: 'טכניון',
            badgeText: 'שבוע 1 / 13',
            hintText: 'לוח אקדמי'
        };
    }

    global.TechnionAcademicCalendar = {
        RAW_SCHEDULE: RAW_ACADEMIC_SCHEDULE,
        DATE_EVENTS_MAP: TECHNION_DATE_EVENTS_MAP,
        ACADEMIC_TERMS: ACADEMIC_TERMS,
        getAcademicSemesterWeekInfo: getAcademicSemesterWeekInfo,
        getEventsForDate: function(dateStr) {
            return TECHNION_DATE_EVENTS_MAP[dateStr] || [];
        },
        getAllEventsList: function() {
            const list = [];
            Object.keys(TECHNION_DATE_EVENTS_MAP).sort().forEach(d => {
                TECHNION_DATE_EVENTS_MAP[d].forEach(ev => list.push(ev));
            });
            return list;
        },
        isHoliday: function(dateStr) {
            const evs = TECHNION_DATE_EVENTS_MAP[dateStr] || [];
            return evs.some(e => e.type === 'holiday');
        },
        isAcademicMilestone: function(dateStr) {
            const evs = TECHNION_DATE_EVENTS_MAP[dateStr] || [];
            return evs.some(e => e.type === 'academic');
        }
    };

})(typeof window !== 'undefined' ? window : global);
