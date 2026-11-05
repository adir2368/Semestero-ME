with open('android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'public static List<CourseSlot> getScheduleForDay.*?public static ScheduleResolution resolve', text, re.DOTALL)
if m:
    with open('scripts/ad-hoc/wear_sched_snippet.txt', 'w', encoding='utf-8') as out:
        out.write(m.group(0))
    print("Extracted schedule snippet, length:", len(m.group(0)))
