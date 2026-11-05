with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update deleteSingleTask to record into gameState.deletedTaskIds
target_del = '''function deleteSingleTask(courseCode, taskId) {
    const course = gameState.courses[courseCode];
    if (!course || !Array.isArray(course.tasks)) return;
    const task = course.tasks.find(t => t.id === taskId);
    const title = task ? task.title : 'המשימה';

    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${title}"?`)) return;

    if (task && window.MoodleSync && typeof window.MoodleSync.markTaskDismissedInRegistry === 'function') {
        window.MoodleSync.markTaskDismissedInRegistry(courseCode, task);
    }'''

replacement_del = '''function deleteSingleTask(courseCode, taskId, skipConfirm = false) {
    const course = gameState.courses[courseCode];
    if (!course || !Array.isArray(course.tasks)) return;
    const task = course.tasks.find(t => t.id === taskId);
    const title = task ? task.title : 'המשימה';

    if (!skipConfirm && !confirm(`האם אתה בטוח שברצונך למחוק את "${title}"? היא לא תופיע בסנכרון הבא.`)) return;

    if (!gameState.dismissedTaskRegistry) gameState.dismissedTaskRegistry = {};
    if (!gameState.deletedTaskIds) gameState.deletedTaskIds = [];

    if (task) {
        if (task.id && !gameState.deletedTaskIds.includes(task.id)) {
            gameState.deletedTaskIds.push(task.id);
        }
        if (task.moodleEventId && !gameState.deletedTaskIds.includes(String(task.moodleEventId))) {
            gameState.deletedTaskIds.push(String(task.moodleEventId));
        }
        if (task.moodleUid && !gameState.deletedTaskIds.includes(String(task.moodleUid))) {
            gameState.deletedTaskIds.push(String(task.moodleUid));
        }
    }

    if (task && window.MoodleSync && typeof window.MoodleSync.markTaskDismissedInRegistry === 'function') {
        window.MoodleSync.markTaskDismissedInRegistry(courseCode, task);
    }'''

assert target_del in content, "target_del not found in app.js"
content = content.replace(target_del, replacement_del, 1)

# 2. Add verification modal and update toggleTaskStatusInState
target_toggle = '''// Modify status inside our global game state and handle XP triggers
function toggleTaskStatusInState(courseCode, taskId, newStatus, skipRecalcAndSave = false) {
    const course = gameState.courses[courseCode];
    if (!course) return;
    const task = course.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;
    if (oldStatus === newStatus) return;'''

modal_code_and_toggle = '''
function showTaskCompletionVerificationModal(courseCode, task, newStatus) {
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
                </button>
                <button type="button" id="btn-confirm-task-delete" style="background: rgba(239, 68, 68, 0.16); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem;">
                    <span>🗑️</span> <span>לא רלוונטית עבורי — הסר לצמיתות (לא תחזור בסנכרון)</span>
                </button>
                <button type="button" id="btn-confirm-task-cancel" style="background: transparent; color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.84rem;">
                    ביטול
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-confirm-task-done').onclick = () => {
        document.body.removeChild(overlay);
        toggleTaskStatusInState(courseCode, task.id, newStatus, false, true);
        renderNotionTasksTable();
    };

    overlay.querySelector('#btn-confirm-task-delete').onclick = () => {
        document.body.removeChild(overlay);
        deleteSingleTask(courseCode, task.id, true);
    };

    overlay.querySelector('#btn-confirm-task-cancel').onclick = () => {
        document.body.removeChild(overlay);
        renderNotionTasksTable();
    };
}
window.showTaskCompletionVerificationModal = showTaskCompletionVerificationModal;

// Modify status inside our global game state and handle XP triggers
function toggleTaskStatusInState(courseCode, taskId, newStatus, skipRecalcAndSave = false, forceConfirmed = false) {
    const course = gameState.courses[courseCode];
    if (!course) return;
    const task = course.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    // Verify task completion against Moodle state & Miluim relevance if marking complete
    const isMarkingComplete = (newStatus === 'done' || newStatus === 'submitted');
    const isMiluim = !!(task.isMiluim || task.miluim || (task.title && task.title.includes('מילואים')));
    const isFromMoodle = !!(task.source === 'moodle' || task.moodleEventId || task.moodleUid);
    const isMoodleConfirmed = !!(task.moodleCompleted || (task.grade !== undefined && task.grade !== null));

    if (!forceConfirmed && isMarkingComplete && (isMiluim || (isFromMoodle && !isMoodleConfirmed))) {
        showTaskCompletionVerificationModal(courseCode, task, newStatus);
        return;
    }'''

assert target_toggle in content, "target_toggle not found in app.js"
content = content.replace(target_toggle, modal_code_and_toggle, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js patched with verification modal and deletedTaskIds!")

# 3. Update moodle_sync.js
with open('moodle_sync.js', 'r', encoding='utf-8') as f:
    m_content = f.read()

target_is_dismissed = '''        isTaskDismissedInRegistry(courseCode, task) {
            if (!task || !window.gameState || !window.gameState.dismissedTaskRegistry) return false;
            const keys = this.getTaskCompletionKeys(courseCode, task);
            for (let i = 0; i < keys.length; i++) {
                if (window.gameState.dismissedTaskRegistry[keys[i]]) {
                    return true;
                }
            }
            return false;
        },'''

new_is_dismissed = '''        isTaskDismissedInRegistry(courseCode, task) {
            if (!task || !window.gameState) return false;

            // 1. Direct check against persistent deletedTaskIds
            if (Array.isArray(window.gameState.deletedTaskIds)) {
                if (task.id && window.gameState.deletedTaskIds.includes(task.id)) return true;
                const mId = this.extractMoodleId(task);
                if (mId && window.gameState.deletedTaskIds.includes(String(mId))) return true;
                if (task.moodleUid && window.gameState.deletedTaskIds.includes(String(task.moodleUid))) return true;
            }

            // 2. Check dismissed registry keys
            if (window.gameState.dismissedTaskRegistry) {
                const keys = this.getTaskCompletionKeys(courseCode, task);
                for (let i = 0; i < keys.length; i++) {
                    if (window.gameState.dismissedTaskRegistry[keys[i]]) {
                        return true;
                    }
                }
            }
            return false;
        },'''

assert target_is_dismissed in m_content, "target_is_dismissed not found in moodle_sync.js"
m_content = m_content.replace(target_is_dismissed, new_is_dismissed, 1)

with open('moodle_sync.js', 'w', encoding='utf-8') as f:
    f.write(m_content)

print("moodle_sync.js patched successfully!")
