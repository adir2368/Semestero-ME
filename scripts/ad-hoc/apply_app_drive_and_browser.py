import json, sys

sys.stdout.reconfigure(encoding='utf-8')

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# Load drive map
with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\scripts\ad-hoc\drive_map_export.json", "r", encoding="utf-8") as f:
    drive_map = json.load(f)

drive_map_json = json.dumps(drive_map, indent=4, ensure_ascii=False)

# 1. Update window.openExternalUrlOrBrowser to support Electron electronAPI.openExternal
old_open_ext = """window.openExternalUrlOrBrowser = function(url) {
    if (!url) return;
    try {
        if (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.openExternalUrl === 'function') {
            window.SemesteroWidgetBridge.openExternalUrl(url);
            return;
        }
    } catch (e) {
        console.warn('[ExternalUrl] Bridge error:', e);
    }"""

new_open_ext = """window.openExternalUrlOrBrowser = function(url) {
    if (!url) return;
    try {
        if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
            window.electronAPI.openExternal(url);
            return;
        }
    } catch (e) {
        console.warn('[ExternalUrl] Electron openExternal error:', e);
    }
    try {
        if (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.openExternalUrl === 'function') {
            window.SemesteroWidgetBridge.openExternalUrl(url);
            return;
        }
    } catch (e) {
        console.warn('[ExternalUrl] Bridge error:', e);
    }"""

assert old_open_ext in text, "old_open_ext not found in app.js"
text = text.replace(old_open_ext, new_open_ext, 1)

# 2. Add COURSE_FACULTY_DRIVE_MAP and getFacultyDriveCourseUrl
target_drive_anchor = "const FACULTY_DRIVE_WEB_URL = 'https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx';"
replacement_drive = f"""const COURSE_FACULTY_DRIVE_MAP = {drive_map_json};

const FACULTY_DRIVE_WEB_URL = 'https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx';
const FACULTY_DRIVE_LOCAL_PATH = 'C:\\\\Users\\\\user\\\\OneDrive - Technion\\\\Mechanichal Info TSA\\'s files - Mechanical Engineering Drive';

function getFacultyDriveCourseUrl(courseCode, task) {{
    if (!courseCode) return FACULTY_DRIVE_WEB_URL;
    const cleanCode = String(courseCode).replace(/^0+/, '');
    const directUrl = COURSE_FACULTY_DRIVE_MAP[courseCode] || COURSE_FACULTY_DRIVE_MAP[cleanCode];
    if (directUrl) return directUrl;
    return FACULTY_DRIVE_WEB_URL;
}}
if (typeof window !== 'undefined') {{
    window.COURSE_FACULTY_DRIVE_MAP = COURSE_FACULTY_DRIVE_MAP;
    window.getFacultyDriveCourseUrl = getFacultyDriveCourseUrl;
}}"""

assert target_drive_anchor in text, "target_drive_anchor not found in app.js"
text = text.replace(target_drive_anchor, replacement_drive, 1)

# 3. Update Notion table drive link to use getFacultyDriveCourseUrl and openExternalUrlOrBrowser
old_notion_drive = """        const facultyDriveUrl = FACULTY_DRIVE_WEB_URL;
        const facultyDriveLinkHtml = facultyDriveUrl ? `
            <a href="${facultyDriveUrl}" target="_blank" rel="noopener noreferrer" class="notion-drive-link-btn" title="מעבר ישיר לדרייב הפקולטה להנדסת מכונות (אס״ט) - פתרונות שיעורי בית ישנים, רפרנסים ומבחני עבר" onclick="event.stopPropagation();">
                <span>📁 דרייב ↗</span>
            </a>
        ` : '';"""

new_notion_drive = """        const facultyDriveUrl = (typeof getFacultyDriveCourseUrl === 'function') ? getFacultyDriveCourseUrl(c.code, t) : FACULTY_DRIVE_WEB_URL;
        const facultyDriveLinkHtml = facultyDriveUrl ? `
            <a href="${facultyDriveUrl}" target="_blank" rel="noopener noreferrer" class="notion-drive-link-btn" title="מעבר ישיר לתיקיית רפרנסים ופתרונות בדרייב הפקולטה להנדסת מכונות (אס״ט)" onclick="event.stopPropagation(); if (window.openExternalUrlOrBrowser) { window.openExternalUrlOrBrowser('${facultyDriveUrl}'); event.preventDefault(); }">
                <span>📁 דרייב ↗</span>
            </a>
        ` : '';"""

assert old_notion_drive in text, "old_notion_drive not found in app.js"
text = text.replace(old_notion_drive, new_notion_drive, 1)

# 4. Update Moodle link in Notion table to also trigger openExternalUrlOrBrowser
old_notion_moodle = """        const moodleUrl = resolveDirectMoodleTaskUrl(c.code, t);
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר ישיר לדף המטלה או דף הקורס במודל (ללא לוח שנה)" onclick="event.stopPropagation();">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';"""

new_notion_moodle = """        const moodleUrl = resolveDirectMoodleTaskUrl(c.code, t);
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר ישיר לדף המטלה או דף הקורס במודל (ללא לוח שנה)" onclick="event.stopPropagation(); if (window.openExternalUrlOrBrowser) { window.openExternalUrlOrBrowser('${moodleUrl}'); event.preventDefault(); }">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';"""

assert old_notion_moodle in text, "old_notion_moodle not found in app.js"
text = text.replace(old_notion_moodle, new_notion_moodle, 1)

# 5. Update Side Peek Moodle and Drive links
old_peek_drive = """    const driveRow = document.getElementById("peek-property-drive-row");
    const driveLink = document.getElementById("peek-property-drive-link");
    if (driveRow && driveLink) {
        driveRow.style.display = "grid";
        driveLink.href = FACULTY_DRIVE_WEB_URL;
    }"""

new_peek_drive = """    const driveRow = document.getElementById("peek-property-drive-row");
    const driveLink = document.getElementById("peek-property-drive-link");
    const resolvedDriveUrl = (typeof getFacultyDriveCourseUrl === 'function') ? getFacultyDriveCourseUrl(course.code, task) : FACULTY_DRIVE_WEB_URL;
    if (driveRow && driveLink) {
        driveRow.style.display = "grid";
        driveLink.href = resolvedDriveUrl;
        driveLink.onclick = function(e) {
            if (window.openExternalUrlOrBrowser) {
                window.openExternalUrlOrBrowser(resolvedDriveUrl);
                e.preventDefault();
            }
        };
    }"""

assert old_peek_drive in text, "old_peek_drive not found in app.js"
text = text.replace(old_peek_drive, new_peek_drive, 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully patched app.js with Drive deep linking and external browser dispatch!")
