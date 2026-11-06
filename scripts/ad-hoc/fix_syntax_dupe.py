app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

dupe_block = """const FACULTY_DRIVE_LOCAL_PATH = 'C:\\\\Users\\\\user\\\\OneDrive - Technion\\\\Mechanichal Info TSA\\'s files - Mechanical Engineering Drive';
if (typeof window !== 'undefined') {
    window.FACULTY_DRIVE_WEB_URL = FACULTY_DRIVE_WEB_URL;
    window.FACULTY_DRIVE_LOCAL_PATH = FACULTY_DRIVE_LOCAL_PATH;
}"""

assert dupe_block in text, "dupe_block not found in app.js"
text = text.replace(dupe_block, "", 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Removed duplicate FACULTY_DRIVE_LOCAL_PATH declaration!")
