import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

print("=== 1. Patching user_saved_state.json ===")
user_saved_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json"
with open(user_saved_path, "r", encoding="utf-8") as f:
    state = json.load(f)

# 1.1 In degreePlan: move 01250013 from sem 4 to sem 2
if "degreePlan" in state and isinstance(state["degreePlan"], list) and len(state["degreePlan"]) >= 4:
    # sem 2 is index 1, sem 4 is index 3
    sem2 = state["degreePlan"][1]
    sem4 = state["degreePlan"][3]

    # Find 01250013 / 125013 in sem4
    chem_lab_item = None
    sem4_courses = []
    for c in sem4.get("courses", []):
        code = c.get("code") if isinstance(c, dict) else str(c)
        alt = c.get("altCode") if isinstance(c, dict) else ""
        if code in ["01250013", "125013"] or alt in ["01250013", "125013"]:
            chem_lab_item = c
        else:
            sem4_courses.append(c)
    sem4["courses"] = sem4_courses

    # Ensure chem_lab_item is in sem2
    sem2_has_chem = any(
        (c.get("code") in ["01250013", "125013"] or c.get("altCode") in ["01250013", "125013"])
        for c in sem2.get("courses", [])
    )
    if not sem2_has_chem:
        if not chem_lab_item:
            chem_lab_item = {
                "code": "01250013",
                "name": "מעבדה בכימיה",
                "type": "mandatory",
                "altCode": "125013",
                "credits": 0.5,
                "prereqs": ["01250001"]
            }
        sem2["courses"].append(chem_lab_item)
    print("  -> Moved 01250013 to degreePlan[1] (Semester 2), removed from degreePlan[3]")

# 1.2 In courses: enforce 125013 semester = 2, status = mastered, grade = 94
if "courses" in state:
    if "125013" in state["courses"]:
        state["courses"]["125013"]["semester"] = 2
        state["courses"]["125013"]["status"] = "mastered"
        state["courses"]["125013"]["grade"] = 94
    if "01250013" in state["courses"]:
        state["courses"]["01250013"]["semester"] = 2
        state["courses"]["01250013"]["status"] = "mastered"
        state["courses"]["01250013"]["grade"] = 94
    # Purge alternative physics variants
    for bad_code in ["114071", "01140071", "114075", "01140075", "114077", "01140077", "114078", "01140078", "114055", "01140055", "114076", "01140076"]:
        state["courses"].pop(bad_code, None)
    print("  -> Enforced 125013 semester=2, purged alternative physics variants from courses")

# 1.3 In removedCourses: track variants
if "removedCourses" not in state or not isinstance(state["removedCourses"], list):
    state["removedCourses"] = []
for p in ["114071", "01140071", "114075", "01140075", "114077", "01140077", "114078", "01140078", "114055", "01140055", "114076", "01140076"]:
    if p not in state["removedCourses"]:
        state["removedCourses"].append(p)

with open(user_saved_path, "w", encoding="utf-8") as f:
    json.dump(state, f, ensure_ascii=False, indent=2)
print("  ✓ user_saved_state.json updated successfully.")

print("\n=== 2. Patching curriculum_template.js ===")
template_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\curriculum_template.js"
with open(template_path, "r", encoding="utf-8") as f:
    tpl_text = f.read()

# 2.1 Remove 114071 and 114075 entries from SAMPLE_ME_DEGREE
# Match "114071": { ... },
tpl_text = re.sub(r'\"114071\":\s*\{[\s\S]*?\},?\s*', '', tpl_text)
tpl_text = re.sub(r'\"114075\":\s*\{[\s\S]*?\},?\s*', '', tpl_text)

# 2.2 In 125013 entry, set semester: 2
tpl_text = re.sub(
    r'(\"125013\":\s*\{[\s\S]*?semester:\s*)4([,\s])',
    r'\g<1>2\g<2>',
    tpl_text
)

# 2.3 In getCleanCurriculumState, guarantee 114071 / 114075 never present
tpl_text = tpl_text.replace(
    'delete courses["114071"];',
    'delete courses["114071"]; delete courses["01140071"]; delete courses["114077"];'
)

with open(template_path, "w", encoding="utf-8") as f:
    f.write(tpl_text)
print("  ✓ curriculum_template.js updated successfully.")

print("\n=== 3. Patching WearScheduleHelper.java ===")
wear_sched_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\wear\src\main\java\com\technion\semestero\wear\WearScheduleHelper.java"
with open(wear_sched_path, "r", encoding="utf-8") as f:
    wear_text = f.read()

# Replace Monday 11:30 - 14:30 with 10:30 - 14:30
old_slot = '''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "11:30 - 14:30",
                    690, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));'''

new_slot = '''                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 14:30",
                    630, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));'''

if old_slot in wear_text:
    wear_text = wear_text.replace(old_slot, new_slot)
    print("  -> Updated Monday Solids 2 lecture in WearScheduleHelper to 10:30 - 14:30 (630 - 870 min)")
else:
    print("  -> Monday slot already updated or matching pattern")

with open(wear_sched_path, "w", encoding="utf-8") as f:
    f.write(wear_text)
print("  ✓ WearScheduleHelper.java updated successfully.")

print("\n=== 4. Patching app.js ===")
app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

# 4.1 In CHEESEFORK_SEMESTER_SCHEDULE Monday Solids lecture: startTime: "10:30", duration: "4 שעות"
app_text = re.sub(
    r'(courseId:\s*"034053"[\s\S]*?type:\s*"הרצאה 10"[\s\S]*?startTime:\s*)"11:30"',
    r'\g<1>"10:30"',
    app_text
)
app_text = re.sub(
    r'(courseId:\s*"034053"[\s\S]*?startTime:\s*"10:30"[\s\S]*?duration:\s*)"3 שעות"',
    r'\g<1>"4 שעות"',
    app_text
)

# 4.2 In AUTHENTIC_TIMETABLE_METADATA: add 10:30 entries for Monday 034053
meta_find = "'034053_1_11:30':   { room: 'דן קאהן - מכונות 6', lecturer: \"פרופ' יוסף גבלי\" },"
meta_replace = """'034053_1_10:30':   { room: 'דן קאהן - מכונות 6', lecturer: "פרופ' יוסף גבלי" },
    '34053_1_10:30':    { room: 'דן קאהן - מכונות 6', lecturer: "פרופ' יוסף גבלי" },
    '00340053_1_10:30': { room: 'דן קאהן - מכונות 6', lecturer: "פרופ' יוסף גבלי" },
    '034053_1_11:30':   { room: 'דן קאהן - מכונות 6', lecturer: "פרופ' יוסף גבלי" },"""
if meta_find in app_text and "'034053_1_10:30'" not in app_text:
    app_text = app_text.replace(meta_find, meta_replace)
    print("  -> Added 10:30 Monday metadata entries for Solids 2")

# 4.3 In enrichTimetableWithAuthenticRooms:
# Fix healing of Monday Solids lecture to ensure 10:30 is preserved!
app_text = app_text.replace(
    '''            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.startTime === '10:30' && c.endTime === '14:30') {
                    c.startTime = '11:30';
                    enrichedCount++;
                }
            }''',
    '''            if (cleanCode === '34053' || cleanCode === '034053') {
                if (day.dayIndex === 1 && c.startTime === '11:30' && c.endTime === '14:30') {
                    c.startTime = '10:30';
                    enrichedCount++;
                }
            }'''
)

# 4.4 In syncLiveCheeseForkData: ensure Tuesday 034053 tutorial 11 is strictly discarded
cf_sched_filter = '''                        if (isMatch && itemDay && itemTime) {
                            const dayIdx = dayMap[itemDay];
                            if (dayIdx !== undefined && dayIdx >= 0 && dayIdx <= 4) {'''

cf_sched_filter_patched = '''                        if (isMatch && itemDay && itemTime) {
                            const dayIdx = dayMap[itemDay];
                            // Strict guard: Tuesday must NEVER have candidate Solids 2 tutorial
                            if (dayIdx === 2 && (cleanCode === '034053' || cleanCode === '34053' || cleanCode === '00340053') && itemType.includes('תרגול')) {
                                return;
                            }
                            if (dayIdx !== undefined && dayIdx >= 0 && dayIdx <= 4) {'''

if cf_sched_filter in app_text:
    app_text = app_text.replace(cf_sched_filter, cf_sched_filter_patched)
    print("  -> Patched syncLiveCheeseForkData to strictly discard Tuesday Solids 2 tutorial 11")

# 4.5 Enforce permanent purge of alternative physics variants in recalculateCourseStates & loadState
purge_hook = '''    // Strict mutual exclusivity: Purge alternative physics variants when standard physics exists
    if (gameState.courses['114051'] || gameState.courses['01140051']) {
        delete gameState.courses['114071'];
        delete gameState.courses['01140071'];
        delete gameState.courses['114077'];
        delete gameState.courses['01140077'];
        delete gameState.courses['114055'];
        delete gameState.courses['01140055'];
    }
    if (gameState.courses['114052'] || gameState.courses['01140052']) {
        delete gameState.courses['114075'];
        delete gameState.courses['01140075'];
        delete gameState.courses['114078'];
        delete gameState.courses['01140078'];
        delete gameState.courses['114076'];
        delete gameState.courses['01140076'];
    }'''

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)
print("  ✓ app.js updated successfully.")
