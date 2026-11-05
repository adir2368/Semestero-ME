import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. WearScheduleHelper.java
wear_path = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\wear\src\main\java\com\technion\semestero\wear\WearScheduleHelper.java'
with open(wear_path, 'r', encoding='utf-8') as f:
    wear_text = f.read()

wear_text = wear_text.replace(
'''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 14:30",
                    630, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));''',
'''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "11:30 - 14:30",
                    690, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));'''
)
with open(wear_path, 'w', encoding='utf-8') as f:
    f.write(wear_text)
print("Updated WearScheduleHelper.java to 11:30 - 14:30")

# 2. app.js
app_path = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace(
'''            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.startTime === '11:30' && c.endTime === '14:30') {
                    c.startTime = '10:30';
                    enrichedCount++;
                }
            }''',
'''            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.startTime === '10:30' && c.endTime === '14:30') {
                    c.startTime = '11:30';
                    enrichedCount++;
                }
            }'''
)

# In CHEESEFORK_SEMESTER_SCHEDULE
app_text = app_text.replace(
'''                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "10:30",
                    endTime: "14:30",
                    duration: "4 שעות",''',
'''                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "הרצאה 10",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "דן קאהן - מכונות 6",
                    startTime: "11:30",
                    endTime: "14:30",
                    duration: "3 שעות",'''
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_text)
print("Updated app.js Monday Solids lecture to 11:30 - 14:30")
