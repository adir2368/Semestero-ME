with open('android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Computing from Sunday
old_sun_comp = '''                list.add(new CourseSlot(
                    "מבוא לחישוב מדעי והנדסי",
                    "14:30 - 17:30",
                    870, 1050,
                    "הנדסה כימית 1",
                    "ד\\\"ר דניאל הקסנר",
                    "הרצאה 10"
                ));
'''
if old_sun_comp in content:
    content = content.replace(old_sun_comp, '')
    print('PASS: Removed Computing from Sunday in WearScheduleHelper.java')
else:
    print('FAIL: old_sun_comp not found in WearScheduleHelper.java')

# 2. Update Monday Solids Lecture to 10:30 - 14:30 (630 - 870)
old_mon_solids = '''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 13:30",
                    630, 810,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));'''
new_mon_solids = '''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 14:30",
                    630, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));'''
if old_mon_solids in content:
    content = content.replace(old_mon_solids, new_mon_solids)
    print('PASS: Updated Monday Solids Lecture to 10:30-14:30 in WearScheduleHelper.java')
else:
    print('FAIL: old_mon_solids not found')

# 3. Add Computing to Wednesday (14:30 - 17:30, 870 - 1050)
old_wed = '''                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "09:30 - 10:30",
                    570, 630,
                    "אולמן 606",
                    "מר אייל קלמן",
                    "תרגול 21"
                ));
                break;'''
new_wed = '''                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "09:30 - 10:30",
                    570, 630,
                    "אולמן 606",
                    "מר אייל קלמן",
                    "תרגול 21"
                ));
                list.add(new CourseSlot(
                    "מבוא לחישוב מדעי והנדסי",
                    "14:30 - 17:30",
                    870, 1050,
                    "הנדסה כימית 1",
                    "ד\\\"ר דניאל הקסנר",
                    "הרצאה 10"
                ));
                break;'''
if old_wed in content:
    content = content.replace(old_wed, new_wed)
    print('PASS: Added Computing to Wednesday in WearScheduleHelper.java')
else:
    print('FAIL: old_wed not found')

with open('android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done patching WearScheduleHelper.java!')
