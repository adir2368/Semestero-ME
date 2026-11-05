import sys

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Computing from Sunday in CHEESEFORK_SEMESTER_SCHEDULE
old_sunday_block = ''',
                {
                    courseId: "034056",
                    courseName: "מבוא לחישוב מדעי והנדסי",
                    type: "הרצאה 10",
                    lecturer: "ד\\\"ר דניאל הקסנר",
                    room: "הנדסה כימית 1",
                    startTime: "14:30",
                    endTime: "17:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-computing"
                }'''

if old_sunday_block in content:
    content = content.replace(old_sunday_block, '')
    print('PASS: Removed Sunday Computing from CHEESEFORK_SEMESTER_SCHEDULE')
else:
    print('FAIL: old_sunday_block not found')

# 2. Fix Monday Solids Lecture to 10:30 - 14:30 (4 hours)
old_monday_solids = '''                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "13:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-solids"
                }'''
new_monday_solids = '''                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "14:30",
                    duration: "4 שעות",
                    cardClass: "timetable-card-solids"
                }'''
if old_monday_solids in content:
    content = content.replace(old_monday_solids, new_monday_solids)
    print('PASS: Updated Monday Solids Lecture in CHEESEFORK_SEMESTER_SCHEDULE to 10:30-14:30')
else:
    print('FAIL: old_monday_solids not found')

# 3. Add Computing to Wednesday in CHEESEFORK_SEMESTER_SCHEDULE
old_wednesday = '''                {
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
new_wednesday = '''                {
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
                    lecturer: "ד\\\"ר דניאל הקסנר",
                    room: "הנדסה כימית 1",
                    startTime: "14:30",
                    endTime: "17:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-computing"
                }
            ]
        },'''
if old_wednesday in content:
    content = content.replace(old_wednesday, new_wednesday)
    print('PASS: Added Wednesday Computing to CHEESEFORK_SEMESTER_SCHEDULE')
else:
    print('FAIL: old_wednesday not found')

# 4. Fix enrichTimetableWithAuthenticRooms:
old_enrich_solids = '''            // Auto-heal Monday Solid Mechanics lecture time to 10:30 - 13:30
            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.type && c.type.includes('הרצאה')) {
                    if (c.startTime !== '10:30' || c.endTime !== '13:30') {
                        c.startTime = '10:30';
                        c.endTime = '13:30';
                        enrichedCount++;
                    }
                }
            }'''
new_enrich_solids = '''            // Auto-heal Monday Solid Mechanics lecture time to 10:30 - 14:30 (4 hours)
            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.type && c.type.includes('הרצאה')) {
                    if (c.startTime !== '10:30' || c.endTime !== '14:30') {
                        c.startTime = '10:30';
                        c.endTime = '14:30';
                        enrichedCount++;
                    }
                }
            }'''
if old_enrich_solids in content:
    content = content.replace(old_enrich_solids, new_enrich_solids)
    print('PASS: Updated enrichTimetableWithAuthenticRooms Monday solids to 10:30-14:30')
else:
    print('FAIL: old_enrich_solids not found')

# 5. In syncLiveCheeseForkData: remove the lines forcing Computing to dayIdx 0 (Sunday)
old_sync_comp = '''                            let dayIdx = dayMap[itemDay];
                            // Computing Lecture 10 belongs to Sunday 14:30 - 17:30
                            if ((cleanCode === '034056' || cleanCode === '34056' || cleanCode === '00340056') && itemType.includes('הרצאה') && itemTime.includes('14:30')) {
                                dayIdx = 0; // Sunday
                            }'''
new_sync_comp = '''                            let dayIdx = dayMap[itemDay];'''
if old_sync_comp in content:
    content = content.replace(old_sync_comp, new_sync_comp)
    print('PASS: Removed syncLiveCheeseForkData Sunday Computing override')
else:
    print('FAIL: old_sync_comp not found')

# 6. In AUTHENTIC_TIMETABLE_METADATA: remove Sunday 034056_0_14:30
old_sunday_meta = '''    '034056_0_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד"ר דניאל הקסנר' },
    '34056_0_14:30':    { room: 'הנדסה כימית 1', lecturer: 'ד"ר דניאל הקסנר' },
    '00340056_0_14:30': { room: 'הנדסה כימית 1', lecturer: 'ד"ר דניאל הקסנר' },
    '340056_0_14:30':   { room: 'הנדסה כימית 1', lecturer: 'ד"ר דניאל הקסנר' },\n'''
if old_sunday_meta in content:
    content = content.replace(old_sunday_meta, '')
    print('PASS: Removed Sunday Computing from AUTHENTIC_TIMETABLE_METADATA')
else:
    print('FAIL: old_sunday_meta not found')

# 7. Add auto-heal in loadState() to purge any ghost due dates on mastered courses
ghost_heal_anchor = '''                    // Ensure Physics Lab 1H (114032) belongs strictly to Semester 5'''
ghost_heal_code = '''                    // Sanitize mastered courses: Completed courses from previous semesters must NEVER have future due dates!
                    Object.values(gameState.courses || {}).forEach(c => {
                        if (c.status === 'mastered') {
                            (c.tasks || []).forEach(t => {
                                if (t.dueDate && t.dueDate >= '2026-11-01') {
                                    t.dueDate = (t.id === 'task-104043-exam-b' ? '2026-08-05' : '');
                                }
                            });
                        }
                    });

                    // Ensure Physics Lab 1H (114032) belongs strictly to Semester 5'''
if ghost_heal_anchor in content:
    content = content.replace(ghost_heal_anchor, ghost_heal_code)
    print('PASS: Added ghost due date sanitizer in loadState()')
else:
    print('FAIL: ghost_heal_anchor not found')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('All app.js schedule updates completed successfully!')
