import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\curriculum_template.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add 114071 back after 114051 if missing
p1_entry = '''    "114051": {
        code: "114051",
        name: "פיסיקה 1",
        credits: 2.5,
        semester: 2,
        prerequisites: [],
        status: "available",
        trackGroup: "physics_1",
        mutuallyExclusiveWith: ["114071"],
        tasks: [
            { id: "114051_h1", title: "תרגיל בית 1: קינמטיקה", type: "hw", xp: 50, completed: false },
            { id: "114051_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },'''

p1m_entry = '''    "114071": {
        code: "114071",
        name: "פיסיקה 1מ'",
        credits: 3.5,
        semester: 2,
        prerequisites: [],
        status: "available",
        trackGroup: "physics_1",
        mutuallyExclusiveWith: ["114051"],
        tasks: [
            { id: "114071_h1", title: "תרגיל בית 1: קינמטיקה ודינמיקה", type: "hw", xp: 50, completed: false },
            { id: "114071_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },'''

p2_entry = '''    "114052": {
        code: "114052",
        name: "פיסיקה 2",
        credits: 3.5,
        semester: 3,
        prerequisites: ["114051","104041"],
        status: "locked",
        trackGroup: "physics_2",
        mutuallyExclusiveWith: ["114075"],
        tasks: [
            { id: "114052_h1", title: "תרגיל בית 1: אלקטרוסטטיקה ומגנטיות", type: "hw", xp: 50, completed: false },
            { id: "114052_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },'''

p2mm_entry = '''    "114075": {
        code: "114075",
        name: "פיסיקה 2ממ'",
        credits: 5.0,
        semester: 3,
        prerequisites: ["114071","104041"],
        status: "locked",
        trackGroup: "physics_2",
        mutuallyExclusiveWith: ["114052"],
        tasks: [
            { id: "114075_h1", title: "תרגיל בית 1: שדות חשמליים ומגנטיים", type: "hw", xp: 60, completed: false },
            { id: "114075_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },'''

if '"114071":' not in text:
    text = text.replace(p1_entry, p1_entry + '\n' + p1m_entry)
if '"114075":' not in text:
    text = text.replace(p2_entry, p2_entry + '\n' + p2mm_entry)

# Ensure 125013 in template stays semester 4 for generic curriculum
text = text.replace(
'''    "125013": {
        code: "125013",
        name: "מעבדה בכימיה",
        credits: 0.5,
        semester: 2,''',
'''    "125013": {
        code: "125013",
        name: "מעבדה בכימיה",
        credits: 0.5,
        semester: 4,'''
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated curriculum_template.js cleanly")
