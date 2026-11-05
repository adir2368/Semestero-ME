wear_path = 'android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java'
with open(wear_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Sunday
pos_sun = text.find('case Calendar.SUNDAY:')
pos_mon = text.find('case Calendar.MONDAY:')
new_sun_block = '''case Calendar.SUNDAY: // יום ראשון
                list.add(new CourseSlot(
                    "משוואות דיפרנציאליות חלקיות מ'",
                    "11:30 - 13:30",
                    690, 810,
                    "אולמן 506",
                    "אמתי אלפרין",
                    "תרגול 22"
                ));
                list.add(new CourseSlot(
                    "מבוא לחישוב מדעי והנדסי",
                    "14:30 - 17:30",
                    870, 1050,
                    "הנדסה כימית 1",
                    "ד\\"ר דניאל הקסנר",
                    "הרצאה 10"
                ));
                break;

            '''
text = text[:pos_sun] + new_sun_block + text[pos_mon:]

# Monday Solids
text = text.replace('"11:30 - 14:30",\n                    690, 870,\n                    "דן קאהן - מכונות 6"',
                    '"10:30 - 13:30",\n                    630, 810,\n                    "דן קאהן - מכונות 6"')

# Wednesday
pos_wed = text.find('case Calendar.WEDNESDAY:')
pos_thu = text.find('case Calendar.THURSDAY:')
new_wed_block = '''case Calendar.WEDNESDAY: // יום רביעי
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "08:30 - 09:30",
                    510, 570,
                    "פיזיקה 1",
                    "ד\\"ר גדעון אלון",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "09:30 - 10:30",
                    570, 630,
                    "אולמן 606",
                    "מר אייל קלמן",
                    "תרגול 21"
                ));
                break;

            '''
text = text[:pos_wed] + new_wed_block + text[pos_thu:]

with open(wear_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("WearScheduleHelper.java successfully patched!")
