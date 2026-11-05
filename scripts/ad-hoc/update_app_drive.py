import sys

sys.stdout.reconfigure(encoding="utf-8")

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Constant definition
target_const = "const PANGEA_COURSE_MAP = {"
replacement_const = """const FACULTY_DRIVE_WEB_URL = 'https://technionmail-my.sharepoint.com/personal/adir_moshe_campus_technion_ac_il/_layouts/15/onedrive.aspx?listurl=https%3A%2F%2Ftechnionmail-my%2Esharepoint%2Ecom%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments&view=3&id=%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments%2FMechanical%20Engineering%20Drive&csf=1&web=1&e=jG2HFG&FolderCTID=0x01200020FCF278196BFF4B9D20B38488EBB4E7';
const FACULTY_DRIVE_LOCAL_PATH = 'C:\\\\Users\\\\user\\\\OneDrive - Technion\\\\Mechanichal Info TSA\\'s files - Mechanical Engineering Drive';
if (typeof window !== 'undefined') {
    window.FACULTY_DRIVE_WEB_URL = FACULTY_DRIVE_WEB_URL;
    window.FACULTY_DRIVE_LOCAL_PATH = FACULTY_DRIVE_LOCAL_PATH;
}

const PANGEA_COURSE_MAP = {"""

if target_const in text:
    text = text.replace(target_const, replacement_const, 1)
    print("Added FACULTY_DRIVE_WEB_URL and LOCAL_PATH to app.js")
else:
    print("Warning: target_const not found in app.js")

# 2. renderTechnionPlusLinks driveUrl
target_drive_link = """    const driveUrl = `https://www.google.com/search?q=${encodeURIComponent('טכניון ' + (cleanCode || fullCode) + ' ' + (course.name || '') + ' סיכומים מבחנים drive')}`;"""
replacement_drive_link = """    const driveUrl = FACULTY_DRIVE_WEB_URL;"""

if target_drive_link in text:
    text = text.replace(target_drive_link, replacement_drive_link)
    print("Updated driveUrl in renderTechnionPlusLinks")
else:
    print("Warning: target_drive_link not found in app.js")

target_btn_title = """title="חיפוש תיקיות Google Drive, סיכומים וחומרי עזר">
            <img src="drive_icon.svg" alt="Google Drive" loading="lazy" decoding="async" class="technion-btn-brand-icon" style="width: 15px; height: 15px; object-fit: contain; vertical-align: -2px; flex-shrink: 0;"> דרייב וסיכומים ↗"""

replacement_btn_title = """title="מעבר ישיר לדרייב הפקולטה להנדסת מכונות (אס״ט) - פתרונות שיעורי בית ישנים, רפרנסים ומבחני עבר">
            <img src="drive_icon.svg" alt="Google Drive" loading="lazy" decoding="async" class="technion-btn-brand-icon" style="width: 15px; height: 15px; object-fit: contain; vertical-align: -2px; flex-shrink: 0;"> דרייב הפקולטה ↗"""

if target_btn_title in text:
    text = text.replace(target_btn_title, replacement_btn_title)
    print("Updated Drive button in renderTechnionPlusLinks")
else:
    print("Warning: target_btn_title not found in app.js")

# 3. renderNotionTasksTable
target_table_pangea = """        const pangeaUrl = getPangeaTaskUrl(c.code, t);
        const pangeaLinkHtml = pangeaUrl ? `
            <a href="${pangeaUrl}" target="_blank" rel="noopener noreferrer" class="notion-pangea-link-btn" title="מעבר ישיר לסיכומי הקורס, דפי נוסחאות וחומרי לימוד בפנגייה (Ido Fang Bentov)" onclick="event.stopPropagation();">
                <span>🌍 פנגיאה ↗</span>
            </a>
        ` : '';"""

replacement_table_pangea = """        const pangeaUrl = getPangeaTaskUrl(c.code, t);
        const pangeaLinkHtml = pangeaUrl ? `
            <a href="${pangeaUrl}" target="_blank" rel="noopener noreferrer" class="notion-pangea-link-btn" title="מעבר ישיר לסיכומי הקורס, דפי נוסחאות וחומרי לימוד בפנגייה (Ido Fang Bentov)" onclick="event.stopPropagation();">
                <span>🌍 פנגיאה ↗</span>
            </a>
        ` : '';

        const facultyDriveUrl = FACULTY_DRIVE_WEB_URL;
        const facultyDriveLinkHtml = facultyDriveUrl ? `
            <a href="${facultyDriveUrl}" target="_blank" rel="noopener noreferrer" class="notion-drive-link-btn" title="מעבר ישיר לדרייב הפקולטה להנדסת מכונות (אס״ט) - פתרונות שיעורי בית ישנים, רפרנסים ומבחני עבר" onclick="event.stopPropagation();">
                <span>📁 דרייב ↗</span>
            </a>
        ` : '';"""

if target_table_pangea in text:
    text = text.replace(target_table_pangea, replacement_table_pangea)
    print("Added facultyDriveLinkHtml in renderNotionTasksTable")
else:
    print("Warning: target_table_pangea not found in app.js")

target_cell = """                        ${moodleLinkHtml}
                        ${pangeaLinkHtml}
                        <button class="notion-open-peek-btn" title="פתח תצוגת צד">🔲 OPEN</button>"""

replacement_cell = """                        ${moodleLinkHtml}
                        ${pangeaLinkHtml}
                        ${facultyDriveLinkHtml}
                        <button class="notion-open-peek-btn" title="פתח תצוגת צד">🔲 OPEN</button>"""

if target_cell in text:
    text = text.replace(target_cell, replacement_cell)
    print("Updated notion-title-cell with facultyDriveLinkHtml")
else:
    print("Warning: target_cell not found in app.js")

# 4. openTaskSidePeek
target_peek_app = """    const pangeaRow = document.getElementById("peek-property-pangea-row");
    const pangeaLink = document.getElementById("peek-property-pangea-link");
    const resolvedPangeaUrl = getPangeaTaskUrl(course.code, task);
    if (pangeaRow && pangeaLink) {
        if (resolvedPangeaUrl) {
            pangeaRow.style.display = "grid";
            pangeaLink.href = resolvedPangeaUrl;
        } else {
            pangeaRow.style.display = "none";
        }
    }"""

replacement_peek_app = """    const pangeaRow = document.getElementById("peek-property-pangea-row");
    const pangeaLink = document.getElementById("peek-property-pangea-link");
    const resolvedPangeaUrl = getPangeaTaskUrl(course.code, task);
    if (pangeaRow && pangeaLink) {
        if (resolvedPangeaUrl) {
            pangeaRow.style.display = "grid";
            pangeaLink.href = resolvedPangeaUrl;
        } else {
            pangeaRow.style.display = "none";
        }
    }

    const driveRow = document.getElementById("peek-property-drive-row");
    const driveLink = document.getElementById("peek-property-drive-link");
    if (driveRow && driveLink) {
        driveRow.style.display = "grid";
        driveLink.href = FACULTY_DRIVE_WEB_URL;
    }"""

if target_peek_app in text:
    text = text.replace(target_peek_app, replacement_peek_app)
    print("Updated openTaskSidePeek with driveRow in app.js")
else:
    print("Warning: target_peek_app not found in app.js")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)
print("app.js updated successfully!")
