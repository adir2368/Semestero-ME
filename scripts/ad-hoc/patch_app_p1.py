import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add resolveDirectMoodleTaskUrl helper before PANGEA_COURSE_MAP
target_top = "const FACULTY_DRIVE_WEB_URL ="
helper_code = """function resolveDirectMoodleTaskUrl(courseCode, task) {
    if (!task) return '';
    const cleanCode = (courseCode || '').toString().replace(/^0+/, '');
    
    // 1. Direct explicit activity URLs (scorm, assign, quiz)
    if (task.moodleUrl && !task.moodleUrl.includes('/calendar/')) {
        return task.moodleUrl;
    }

    const title = (task.title || '').toLowerCase();

    // 2. Exact known assignment activities
    if (cleanCode === '104228' || cleanCode === '01040228') {
        if (title.includes('אלקטרוני 1') || title.includes('סיווג מד״ח') || title.includes('סיווג מדח') || title.includes('h1')) {
            return 'https://moodle26.technion.ac.il/mod/scorm/view.php?id=95378';
        }
    }

    // 3. Fallback to direct Course View in Moodle 26 (NEVER calendar!)
    const moodleCourseId = (typeof MOODLE26_COURSE_MAP !== 'undefined') 
        ? (MOODLE26_COURSE_MAP[courseCode] || MOODLE26_COURSE_MAP[cleanCode])
        : null;
    if (moodleCourseId) {
        return `https://moodle26.technion.ac.il/course/view.php?id=${moodleCourseId}`;
    }

    // 4. Search fallback
    return `https://moodle26.technion.ac.il/course/search.php?search=${encodeURIComponent(cleanCode || courseCode)}`;
}
if (typeof window !== 'undefined') window.resolveDirectMoodleTaskUrl = resolveDirectMoodleTaskUrl;

const FACULTY_DRIVE_WEB_URL ="""

if target_top in text and "function resolveDirectMoodleTaskUrl" not in text:
    text = text.replace(target_top, helper_code, 1)
    print("Added resolveDirectMoodleTaskUrl to app.js")

# 2. Update showTaskCompletionVerificationModal
target_modal = """function showTaskCompletionVerificationModal(courseCode, task, newStatus) {
    const isMiluim = !!(task.isMiluim || task.miluim || (task.title && task.title.includes('מילואים')));
    const reasonText = isMiluim 
        ? `המשימה "${task.title}" מוגדרת כמשימת מילואים ואינה מסומנת כהוגשה במודל.`
        : `המשימה "${task.title}" אינה מסומנת כהוגשה או בעלת ציון במודל.`;

    const overlay = document.createElement('div');
    overlay.className = 'notion-confirm-modal-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    overlay.innerHTML = `
        <div class="notion-confirm-modal-card" style="background: #1e293b; border: 1px solid rgba(56,189,248,0.3); border-radius: 12px; padding: 24px; max-width: 480px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); direction: rtl; color: #f8fafc; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                <span style="font-size: 1.5rem;">🔍</span>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #38bdf8;">אימות סיום משימה</h3>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                ${reasonText}
            </p>
            <p style="font-size: 0.88rem; line-height: 1.5; color: #94a3b8; margin-bottom: 20px;">
                האם באמת סיימת והגשת את המשימה, או שברצונך <strong>להסיר אותה לצמיתות</strong> כי היא אינה רלוונטית עבורך (למשל כי אינך במילואים)?
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button type="button" id="btn-confirm-task-done" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem;">
                    <span>✅</span> <span>סיימתי והגשתי במודל</span>
                </button>"""

replacement_modal = """function showTaskCompletionVerificationModal(courseCode, task, newStatus) {
    const isMiluim = !!(task.isMiluim || task.miluim || (task.title && task.title.includes('מילואים')));
    const reasonText = isMiluim 
        ? `המשימה "${task.title}" מוגדרת כמשימת מילואים ואינה מסומנת כהוגשה במודל.`
        : `המשימה "${task.title}" אינה מסומנת כהוגשה או בעלת ציון במודל.`;

    const directMoodleUrl = resolveDirectMoodleTaskUrl(courseCode, task);

    const overlay = document.createElement('div');
    overlay.className = 'notion-confirm-modal-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200050; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    overlay.innerHTML = `
        <div class="notion-confirm-modal-card" style="background: #1e293b; border: 1px solid rgba(56,189,248,0.3); border-radius: 12px; padding: 24px; max-width: 480px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); direction: rtl; color: #f8fafc; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                <span style="font-size: 1.5rem;">🔍</span>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #38bdf8;">אימות סיום משימה</h3>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                ${reasonText}
            </p>
            <p style="font-size: 0.88rem; line-height: 1.5; color: #94a3b8; margin-bottom: 20px;">
                האם באמת סיימת והגשת את המשימה, או שברצונך <strong>להסיר אותה לצמיתות</strong> כי היא אינה רלוונטית עבורך?
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${directMoodleUrl ? `
                <a href="${directMoodleUrl}" target="_blank" rel="noopener noreferrer" id="btn-check-task-moodle" style="background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.45); padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; text-decoration: none; transition: all 0.15s ease;">
                    <span>🎓</span> <span>פתח מטלה במודל לבדיקת הגשה ↗</span>
                </a>
                ` : ''}
                <button type="button" id="btn-confirm-task-done" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem;">
                    <span>✅</span> <span>סיימתי והגשתי במודל</span>
                </button>"""

if target_modal in text:
    text = text.replace(target_modal, replacement_modal, 1)
    print("Updated showTaskCompletionVerificationModal in app.js")
else:
    print("Warning: target_modal not found in app.js")

# 3. Update moodle link and Pangea icon in renderNotionTasksTable
target_moodle_calc = """        let moodleUrl = t.moodleUrl || '';
        if (!moodleUrl && (t.moodleEventId || t.source === 'moodle')) {
            const evId = t.moodleEventId || (t.id && t.id.startsWith('task_moodle_') ? t.id.split('_')[2] : '');
            if (evId && /^\\d+$/.test(evId)) {
                const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
                moodleUrl = `${baseHost}/calendar/event.php?id=${evId}`;
            }
        }
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר לכרטיס המטלה או דף הפעילות במודל" onclick="event.stopPropagation();">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';

        const pangeaUrl = getPangeaTaskUrl(c.code, t);
        const pangeaLinkHtml = pangeaUrl ? `
            <a href="${pangeaUrl}" target="_blank" rel="noopener noreferrer" class="notion-pangea-link-btn" title="מעבר ישיר לסיכומי הקורס, דפי נוסחאות וחומרי לימוד בפנגייה (Ido Fang Bentov)" onclick="event.stopPropagation();">
                <span>🌍 פנגיאה ↗</span>
            </a>
        ` : '';"""

replacement_moodle_calc = """        const moodleUrl = resolveDirectMoodleTaskUrl(c.code, t);
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר ישיר לדף המטלה או דף הקורס במודל (ללא לוח שנה)" onclick="event.stopPropagation();">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';

        const pangeaUrl = getPangeaTaskUrl(c.code, t);
        const pangeaLinkHtml = pangeaUrl ? `
            <a href="${pangeaUrl}" target="_blank" rel="noopener noreferrer" class="notion-pangea-link-btn" title="מעבר ישיר לסיכומי הקורס, דפי נוסחאות וחומרי לימוד בפנגייה (Ido Fang Bentov)" onclick="event.stopPropagation();">
                <img src="pangea_icon.png" alt="Pangea" class="pangea-btn-icon" style="width: 14px; height: 14px; object-fit: contain; vertical-align: -2px; border-radius: 2px;">
                <span>פנגייה ↗</span>
            </a>
        ` : '';"""

if target_moodle_calc in text:
    text = text.replace(target_moodle_calc, replacement_moodle_calc, 1)
    print("Updated moodle link & Pangea icon in renderNotionTasksTable")
else:
    print("Warning: target_moodle_calc not found in app.js")

# 4. Update openTaskSidePeek Moodle URL
target_peek_moodle = """    let resolvedMoodleUrl = task.moodleUrl;
    if (!resolvedMoodleUrl && (task.moodleEventId || task.source === 'moodle')) {
        const evId = task.moodleEventId || (task.id && task.id.startsWith('task_moodle_') ? task.id.split('_')[2] : '');
        if (evId && /^\\d+$/.test(evId)) {
            const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
            resolvedMoodleUrl = `${baseHost}/calendar/event.php?id=${evId}`;
        }
    }"""

replacement_peek_moodle = """    let resolvedMoodleUrl = resolveDirectMoodleTaskUrl(course.code, task);"""

if target_peek_moodle in text:
    text = text.replace(target_peek_moodle, replacement_peek_moodle, 1)
    print("Updated openTaskSidePeek Moodle URL resolution")
else:
    print("Warning: target_peek_moodle not found in app.js")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)
print("app.js part 1 completed!")
