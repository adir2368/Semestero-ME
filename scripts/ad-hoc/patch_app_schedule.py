with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CHEESEFORK_SEMESTER_SCHEDULE in app.js
old_cf_sun = '''            dayIndex: 0,
            name: "ראשון",
            fullName: "יום ראשון",
            isFree: false,
            classes: [
                {
                    courseId: "104228",
                    courseName: "משוואות דיפרנציאליות חלקיות מ'",
                    type: "תרגול 22",
                    lecturer: "אמתי אלפרין",
                    room: "אולמן 506",
                    startTime: "11:30",
                    endTime: "13:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-pde"
                }
            ]'''

new_cf_sun = '''            dayIndex: 0,
            name: "ראשון",
            fullName: "יום ראשון",
            isFree: false,
            classes: [
                {
                    courseId: "104228",
                    courseName: "משוואות דיפרנציאליות חלקיות מ'",
                    type: "תרגול 22",
                    lecturer: "אמתי אלפרין",
                    room: "אולמן 506",
                    startTime: "11:30",
                    endTime: "13:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-pde"
                },
                {
                    courseId: "034056",
                    courseName: "מבוא לחישוב מדעי והנדסי",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר דניאל הקסנר",
                    room: "הנדסה כימית 1",
                    startTime: "14:30",
                    endTime: "17:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-computing"
                }
            ]'''

assert old_cf_sun in text, "old_cf_sun not found"
text = text.replace(old_cf_sun, new_cf_sun)

# 2. Update Monday Solids lecture in CHEESEFORK_SEMESTER_SCHEDULE
old_cf_mon_solids = '''                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "11:30",
                    endTime: "14:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-solids"
                },'''

new_cf_mon_solids = '''                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "13:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-solids"
                },'''

assert old_cf_mon_solids in text, "old_cf_mon_solids not found"
text = text.replace(old_cf_mon_solids, new_cf_mon_solids)

# 3. Update Wednesday in CHEESEFORK_SEMESTER_SCHEDULE
old_cf_wed = '''        {
            dayIndex: 3,
            name: "רביעי",
            fullName: "יום רביעי",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר גדעון אלון",
                    room: "פיזיקה 1",
                    startTime: "08:30",
                    endTime: "09:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "תרגול 21",
                    lecturer: "מר אייל קלמן",
                    room: "אולמן 606",
                    startTime: "09:30",
                    endTime: "10:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "034056",
                    courseName: "מבוא לחישוב מדעי והנדסי",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר דניאל הקסנר",
                    room: "הנדסה כימית 1",
                    startTime: "14:30",
                    endTime: "17:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-computing"
                }
            ]
        },'''

new_cf_wed = '''        {
            dayIndex: 3,
            name: "רביעי",
            fullName: "יום רביעי",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה 10",
                    lecturer: "ד\\"ר גדעון אלון",
                    room: "פיזיקה 1",
                    startTime: "08:30",
                    endTime: "09:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "תרגול 21",
                    lecturer: "מר אייל קלמן",
                    room: "אולמן 606",
                    startTime: "09:30",
                    endTime: "10:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                }
            ]
        },'''

assert old_cf_wed in text, "old_cf_wed not found"
text = text.replace(old_cf_wed, new_cf_wed)

# 4. Update AUTHENTIC_TIMETABLE_METADATA
old_meta_sun = """    // Sunday (ראשון - dayIndex 0)
    '104228_0_11:30':   { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '01040228_0_11:30': { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '0104228_0_11:30':  { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '1040228_0_11:30':  { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },"""

new_meta_sun = """    // Sunday (ראשון - dayIndex 0)
    '104228_0_11:30':   { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '01040228_0_11:30': { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '0104228_0_11:30':  { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '1040228_0_11:30':  { room: 'אולמן 506', lecturer: 'אמתי אלפרין' },
    '034056_0_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '34056_0_14:30':    { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '00340056_0_14:30': { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '340056_0_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },"""

assert old_meta_sun in text, "old_meta_sun not found"
text = text.replace(old_meta_sun, new_meta_sun)

# 5. Remove Wednesday Computing from AUTHENTIC_TIMETABLE_METADATA
old_meta_wed_comp = """    '034056_3_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '34056_3_14:30':    { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '00340056_3_14:30': { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },
    '340056_3_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד\"ר דניאל הקסנר' },"""

if old_meta_wed_comp in text:
    text = text.replace(old_meta_wed_comp, "")

# 6. Update enrichTimetableWithAuthenticRooms auto-heals
old_heal_solids = """            // Auto-heal Monday Solid Mechanics lecture time to 11:30 - 14:30 if old 10:30 was present
            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.startTime === '10:30' && c.endTime === '14:30') {
                    c.startTime = '11:30';
                    enrichedCount++;
                }
            }"""

new_heal_solids = """            // Auto-heal Monday Solid Mechanics lecture time to 10:30 - 13:30
            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.type && c.type.includes('הרצאה')) {
                    if (c.startTime !== '10:30' || c.endTime !== '13:30') {
                        c.startTime = '10:30';
                        c.endTime = '13:30';
                        enrichedCount++;
                    }
                }
            }"""

assert old_heal_solids in text, "old_heal_solids not found"
text = text.replace(old_heal_solids, new_heal_solids)

# 7. In syncLiveCheeseForkData: ensure Computing Lecture 10 is placed on Sunday (day 0)
old_cf_sync_day = """                        if (isMatch && itemDay && itemTime) {
                            const dayIdx = dayMap[itemDay];"""

new_cf_sync_day = """                        if (isMatch && itemDay && itemTime) {
                            let dayIdx = dayMap[itemDay];
                            // Computing Lecture 10 belongs to Sunday 14:30 - 17:30
                            if ((cleanCode === '034056' || cleanCode === '34056' || cleanCode === '00340056') && itemType.includes('הרצאה') && itemTime.includes('14:30')) {
                                dayIdx = 0; // Sunday
                            }"""

assert old_cf_sync_day in text, "old_cf_sync_day not found"
text = text.replace(old_cf_sync_day, new_cf_sync_day)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("app.js updated successfully!")
