with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update Monday in CHEESEFORK_SEMESTER_SCHEDULE (remove Tutorial 20)
old_mon = '''        {
            dayIndex: 1,
            name: "שני",
            fullName: "יום שני",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר גדעון אלון",
                    room: "טאוב - מדמ\\"ח 1",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "13:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-solids"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "תרגול 20",
                    lecturer: "מר מירון דואר",
                    room: "אולמן 602",
                    startTime: "14:30",
                    endTime: "16:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-solids"
                }
            ]
        },'''

new_mon = '''        {
            dayIndex: 1,
            name: "שני",
            fullName: "יום שני",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר גדעון אלון",
                    room: "טאוב - מדמ\\"ח 1",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "13:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-solids"
                }
            ]
        },'''

assert old_mon in text, "old_mon not found"
text = text.replace(old_mon, new_mon)

# 2. Update Tuesday in CHEESEFORK_SEMESTER_SCHEDULE (add Tutorial 11)
old_tue = '''        {
            dayIndex: 2,
            name: "שלישי",
            fullName: "יום שלישי",
            isFree: false,
            classes: [
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "הרצאה 10",
                    lecturer: "פרופ' לאוניד טרטקובסקי",
                    room: "הנדסה כימית 1",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "תרגול 11",
                    lecturer: "גב' עומר גזית אורלוב",
                    room: "אולמן 101",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                }
            ]
        },'''

new_tue = '''        {
            dayIndex: 2,
            name: "שלישי",
            fullName: "יום שלישי",
            isFree: false,
            classes: [
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "הרצאה 10",
                    lecturer: "פרופ' לאוניד טרטקובסקי",
                    room: "הנדסה כימית 1",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "תרגול 11",
                    lecturer: "גב' עומר גזית אורלוב",
                    room: "אולמן 101",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "תרגול 11",
                    lecturer: "מר איתם טננבאום",
                    room: "אולמן 103",
                    startTime: "14:30",
                    endTime: "16:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-solids"
                }
            ]
        },'''

assert old_tue in text, "old_tue not found"
text = text.replace(old_tue, new_tue)

# 3. Update enrichTimetableWithAuthenticRooms (filter Monday tutorial 20, keep Tuesday tutorial 11)
old_enrich_guard = """        // Strict guard: Tuesday must NEVER have candidate Solids 2 tutorial 11 when Monday tutorial 20 is active
        if (day.dayIndex === 2) {
            day.classes = day.classes.filter(c => {
                const cId = (c.courseId || '').replace(/^0+/, '');
                return !(cId === '34053' && c.startTime === '14:30');
            });
        }"""

new_enrich_guard = """        // Strict guard: Monday must NOT have tutorial 20 when Tuesday tutorial 11 is authentic
        if (day.dayIndex === 1) {
            day.classes = day.classes.filter(c => {
                const cId = (c.courseId || '').replace(/^0+/, '');
                return !(cId === '34053' && c.type && c.type.includes('תרגול'));
            });
        }"""

assert old_enrich_guard in text, "old_enrich_guard not found"
text = text.replace(old_enrich_guard, new_enrich_guard)

# 4. Update syncLiveCheeseForkData guard
old_sync_guard = """                            // Strict guard: Tuesday must NEVER have candidate Solids 2 tutorial
                            if (dayIdx === 2 && (cleanCode === '034053' || cleanCode === '34053' || cleanCode === '00340053') && itemType.includes('תרגול')) {
                                return;
                            }"""

new_sync_guard = """                            // Strict guard: Monday must NOT have unselected Solids 2 tutorial 20
                            if (dayIdx === 1 && (cleanCode === '034053' || cleanCode === '34053' || cleanCode === '00340053') && itemType.includes('תרגול')) {
                                return;
                            }"""

assert old_sync_guard in text, "old_sync_guard not found"
text = text.replace(old_sync_guard, new_sync_guard)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("app.js updated successfully with Tuesday Solids Tutorial 11!")
