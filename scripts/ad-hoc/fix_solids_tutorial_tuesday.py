# 1. Update WearScheduleHelper.java
wear_path = 'android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java'
with open(wear_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Monday
old_mon = '''            case Calendar.MONDAY: // יום שני
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "08:30 - 10:30",
                    510, 630,
                    "טאוב - מדמ\\"ח 1",
                    "ד\\"ר גדעון אלון",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 13:30",
                    630, 810,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "14:30 - 16:30",
                    870, 990,
                    "אולמן 602",
                    "מר מירון דואר",
                    "תרגול 20"
                ));
                break;'''

new_mon = '''            case Calendar.MONDAY: // יום שני
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "08:30 - 10:30",
                    510, 630,
                    "טאוב - מדמ\\"ח 1",
                    "ד\\"ר גדעון אלון",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 13:30",
                    630, 810,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));
                break;'''

assert old_mon in text, "old_mon not found"
text = text.replace(old_mon, new_mon)

# Replace Tuesday
old_tue = '''            case Calendar.TUESDAY: // יום שלישי
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "08:30 - 10:30",
                    510, 630,
                    "הנדסה כימית 1",
                    "פרופ' לאוניד טרטקובסקי",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "12:30 - 14:30",
                    750, 870,
                    "אולמן 101",
                    "גב' עומר גזית אורלוב",
                    "תרגול 11"
                ));
                break;'''

new_tue = '''            case Calendar.TUESDAY: // יום שלישי
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "08:30 - 10:30",
                    510, 630,
                    "הנדסה כימית 1",
                    "פרופ' לאוניד טרטקובסקי",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "12:30 - 14:30",
                    750, 870,
                    "אולמן 101",
                    "גב' עומר גזית אורלוב",
                    "תרגול 11"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "14:30 - 16:30",
                    870, 990,
                    "אולמן 103",
                    "מר איתם טננבאום",
                    "תרגול 11"
                ));
                break;'''

assert old_tue in text, "old_tue not found"
text = text.replace(old_tue, new_tue)

with open(wear_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("WearScheduleHelper.java patched successfully with Tuesday Solids Tutorial 11!")
