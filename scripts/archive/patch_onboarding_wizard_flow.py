import os
import re

INDEX_PATH = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
AUTH_SYNC_PATH = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\auth_sync.js"

def patch_index():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace onboarding modal header to include return to login button
    old_header = """            <div class="modal-header">
                <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                    <span>🎓</span> <span>ברוך הבא לתכנון התואר בהנדסת מכונות!</span>
                </h2>
                <p style="margin: 6px 0 0 0; font-size: 0.84rem; color: var(--text-muted);">
                    בוא נגדיר את מסלול הלימודים שלך בטכניון בשלושה שלבים מהירים:
                </p>
            </div>"""

    new_header = """            <div class="modal-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; width: 100%;">
                    <div>
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            <span>🎓</span> <span>ברוך הבא לתכנון התואר בהנדסת מכונות!</span>
                        </h2>
                        <p style="margin: 6px 0 0 0; font-size: 0.84rem; color: var(--text-muted);">
                            בוא נגדיר את מסלול הלימודים שלך בטכניון בשלושה שלבים מהירים:
                        </p>
                    </div>
                    <button type="button" class="btn btn-outline btn-xs" onclick="document.getElementById('onboarding-wizard-modal').classList.remove('active'); AuthSync.openAuthModal('login');" title="מעבר למסך התחברות לבעלי חשבון" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-size: 0.8rem; padding: 5px 10px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; cursor: pointer;">
                        🔑 יש לי חשבון
                    </button>
                </div>
            </div>"""

    # Replace Step 1 to include optional cloud credentials
    old_step1 = """                <div class="onboarding-step-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <label for="onboarding-student-name-input" id="lbl-onboarding-student-name" style="font-weight: 700; font-size: 0.95rem; color: #f8fafc; display: block; margin-bottom: 6px;">
                        1. מה שמך?
                    </label>
                    <input type="text" id="onboarding-student-name-input" aria-labelledby="lbl-onboarding-student-name" aria-label="מה שמך?" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" placeholder="למשל: יוסף כהן">
                </div>"""

    new_step1 = """                <div class="onboarding-step-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                    <label for="onboarding-student-name-input" id="lbl-onboarding-student-name" style="font-weight: 700; font-size: 0.95rem; color: #f8fafc; display: block; margin-bottom: 6px;">
                        1. מה שמך?
                    </label>
                    <input type="text" id="onboarding-student-name-input" aria-labelledby="lbl-onboarding-student-name" aria-label="מה שמך?" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" placeholder="למשל: יוסף כהן">

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1);">
                        <div>
                            <label for="onboarding-student-email-input" id="lbl-onboarding-student-email" style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">
                                כתובת אימייל (אופציונלי לסנכרון ענן):
                            </label>
                            <input type="email" id="onboarding-student-email-input" aria-labelledby="lbl-onboarding-student-email" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.85rem;" placeholder="student@gmail.com">
                        </div>
                        <div>
                            <label for="onboarding-student-pass-input" id="lbl-onboarding-student-pass" style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">
                                סיסמה אישית (אופציונלי):
                            </label>
                            <input type="password" id="onboarding-student-pass-input" aria-labelledby="lbl-onboarding-student-pass" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.85rem;" placeholder="לפחות 4 תווים">
                        </div>
                    </div>
                </div>"""

    # Replace footer
    old_footer = """            <div class="modal-footer" style="padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-secondary" onclick="localStorage.setItem('ast_onboarding_shown', 'true'); document.getElementById('onboarding-wizard-modal').classList.remove('active'); if (window.InteractiveTour && localStorage.getItem('ast_interactive_tour_completed') !== 'true') setTimeout(() => window.InteractiveTour.showWelcomeTourPrompt(), 900);">
                    דלג והתחל
                </button>
                <button class="btn btn-primary" onclick="AuthSync.finishOnboarding()">
                    סיום והתחלת שימוש 🚀
                </button>
            </div>"""

    new_footer = """            <div class="modal-footer" style="padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <a href="javascript:void(0)" onclick="document.getElementById('onboarding-wizard-modal').classList.remove('active'); AuthSync.openAuthModal('login');" style="color: #38bdf8; font-size: 0.82rem; text-decoration: underline; cursor: pointer;">
                    כבר יש לך חשבון קיים? לחץ כאן להתחברות ←
                </a>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="localStorage.setItem('ast_onboarding_shown', 'true'); document.getElementById('onboarding-wizard-modal').classList.remove('active'); if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') setTimeout(() => window.InteractiveTour.startTour(0), 500); else if (typeof window.startInteractiveTour === 'function') setTimeout(() => window.startInteractiveTour(0), 500);">
                        דלג והתחל
                    </button>
                    <button class="btn btn-primary" onclick="AuthSync.finishOnboarding()">
                        סיום והתחלת שימוש 🚀
                    </button>
                </div>
            </div>"""

    # Normalize line endings for replacement
    content = content.replace(old_header.replace('\n', '\r\n'), new_header.replace('\n', '\r\n'))
    content = content.replace(old_header, new_header)

    content = content.replace(old_step1.replace('\n', '\r\n'), new_step1.replace('\n', '\r\n'))
    content = content.replace(old_step1, new_step1)

    content = content.replace(old_footer.replace('\n', '\r\n'), new_footer.replace('\n', '\r\n'))
    content = content.replace(old_footer, new_footer)

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("index.html patched successfully!")

def patch_auth_sync():
    with open(AUTH_SYNC_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update finishOnboarding to handle cloud registration when email/password provided and launch tour immediately
    old_finish = """        // Finish Onboarding Wizard
        finishOnboarding() {
            const nameInput = document.getElementById('onboarding-student-name-input');
            const semSelect = document.getElementById('onboarding-current-sem-select');
            const name = (nameInput && nameInput.value.trim()) || 'סטודנט אורח';
            const semester = parseInt(semSelect && semSelect.value) || 1;
            const priorCompleted = {};
            document.querySelectorAll('#onboarding-courses-checklist input[type="checkbox"]:checked').forEach(chk => {
                const card = chk.closest('.onboarding-course-chip');
                const gInput = card ? card.querySelector('.onboarding-grade-input') : null;
                const gVal = (gInput && gInput.value.trim() !== '') ? parseFloat(gInput.value.trim()) : null;
                priorCompleted[chk.value] = {
                    completed: true,
                    grade: (gVal !== null && !isNaN(gVal) && gVal >= 0 && gVal <= 100) ? gVal : null
                };
            });
            if (typeof window.getCleanCurriculumState === 'function') {
                const newState = window.getCleanCurriculumState(semester, priorCompleted);
                newState.student_name = name;
                this.saveActiveUserState(newState);
                window.gameState = newState;
                if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                    window.DegreePlanner.resetToCleanSyllabus();
                }
                if (typeof notifyStateChanged === 'function') notifyStateChanged({ forceAll: true });
            }
            localStorage.setItem('ast_onboarding_shown', 'true');
            const modal = document.getElementById('onboarding-wizard-modal');
            if (modal) modal.classList.remove('active');
            if (typeof showToastNotification === 'function') {
                showToastNotification(`🎓 ברוך הבא ${name}! מסלול הלימודים הוגדר בהצלחה.`, 'success');
            }

            // Trigger the interactive tour gently only after completing initial data entry
            if (window.InteractiveTour && localStorage.getItem('ast_interactive_tour_completed') !== 'true') {
                setTimeout(() => {
                    window.InteractiveTour.showWelcomeTourPrompt();
                }, 900);
            }
        },"""

    new_finish = """        // Finish Onboarding Wizard
        finishOnboarding() {
            const nameInput = document.getElementById('onboarding-student-name-input');
            const semSelect = document.getElementById('onboarding-current-sem-select');
            const emailInput = document.getElementById('onboarding-student-email-input');
            const passInput = document.getElementById('onboarding-student-pass-input');

            const name = (nameInput && nameInput.value.trim()) || 'סטודנט חדש';
            const semester = parseInt(semSelect && semSelect.value) || 1;
            const email = (emailInput && emailInput.value.trim()) || '';
            const password = (passInput && passInput.value.trim()) || '';

            const priorCompleted = {};
            document.querySelectorAll('#onboarding-courses-checklist input[type="checkbox"]:checked').forEach(chk => {
                const card = chk.closest('.onboarding-course-chip');
                const gInput = card ? card.querySelector('.onboarding-grade-input') : null;
                const gVal = (gInput && gInput.value.trim() !== '') ? parseFloat(gInput.value.trim()) : null;
                priorCompleted[chk.value] = {
                    completed: true,
                    grade: (gVal !== null && !isNaN(gVal) && gVal >= 0 && gVal <= 100) ? gVal : null
                };
            });

            // If user supplied email & password, register account with cloud sync
            if (email && email.includes('@') && password && password.length >= 4) {
                this.registerStudent({
                    name: name,
                    password: password,
                    startingSemester: semester,
                    email: email,
                    priorCompleted: priorCompleted
                });
                const modal = document.getElementById('onboarding-wizard-modal');
                if (modal) modal.classList.remove('active');
                localStorage.setItem('ast_onboarding_shown', 'true');
                return;
            }

            if (typeof window.getCleanCurriculumState === 'function') {
                const newState = window.getCleanCurriculumState(semester, priorCompleted);
                newState.student_name = name;
                this.saveActiveUserState(newState);
                window.gameState = newState;
                if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                    window.DegreePlanner.resetToCleanSyllabus();
                }
                if (typeof notifyStateChanged === 'function') notifyStateChanged({ forceAll: true });
            }
            localStorage.setItem('ast_onboarding_shown', 'true');
            const modal = document.getElementById('onboarding-wizard-modal');
            if (modal) modal.classList.remove('active');
            if (typeof showToastNotification === 'function') {
                showToastNotification(`🎓 ברוך הבא ${name}! מסלול הלימודים הוגדר בהצלחה.`, 'success');
            } else if (typeof showHudToast === 'function') {
                showHudToast(`🎓 ברוך הבא ${name}! מסלול הלימודים הוגדר בהצלחה.`, 'success');
            }

            // Immediately launch the interactive tour after registration / onboarding!
            setTimeout(() => {
                if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                    window.InteractiveTour.startTour(0);
                } else if (typeof window.startInteractiveTour === 'function') {
                    window.startInteractiveTour(0);
                }
            }, 600);
        },"""

    content = content.replace(old_finish.replace('\n', '\r\n'), new_finish.replace('\n', '\r\n'))
    content = content.replace(old_finish, new_finish)

    # 2. Update renderAuthModal: if activeTab === 'register', directly open the full Onboarding Wizard!
    old_tab_check = """        renderAuthModal(activeTab) {
            const container = document.getElementById('auth-modal-content-container');"""

    new_tab_check = """        renderAuthModal(activeTab) {
            if (activeTab === 'register') {
                this.closeAuthModal();
                this.openOnboardingWizard();
                return;
            }
            const container = document.getElementById('auth-modal-content-container');"""

    content = content.replace(old_tab_check.replace('\n', '\r\n'), new_tab_check.replace('\n', '\r\n'))
    content = content.replace(old_tab_check, new_tab_check)

    # 3. Update register button in login modal to directly call closeAuthModal and openOnboardingWizard
    old_top_reg_btn = """<button type="button" class="btn btn-sm ${isRegister ? 'btn-primary' : 'btn-outline'}" onclick="AuthSync.renderAuthModal('register')" style="flex: 1;">
                                ✨ הרשמה (סטודנט חדש)
                            </button>"""

    new_top_reg_btn = """<button type="button" class="btn btn-sm btn-outline" onclick="AuthSync.closeAuthModal(); AuthSync.openOnboardingWizard();" style="flex: 1;">
                                ✨ הרשמה (סטודנט חדש)
                            </button>"""

    content = content.replace(old_top_reg_btn.replace('\n', '\r\n'), new_top_reg_btn.replace('\n', '\r\n'))
    content = content.replace(old_top_reg_btn, new_top_reg_btn)

    old_switch_btn = """<button type="button" class="btn btn-outline" id="btn-switch-to-register" onclick="AuthSync.renderAuthModal('register')" style="width: 100%; border-color: #38bdf8; color: #38bdf8; font-weight: 700; padding: 9px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                                        <span>✨</span> <span>הרשמה מהירה (סטודנט חדש) ←</span>
                                    </button>"""

    new_switch_btn = """<button type="button" class="btn btn-outline" id="btn-switch-to-register" onclick="AuthSync.closeAuthModal(); AuthSync.openOnboardingWizard();" style="width: 100%; border-color: #38bdf8; color: #38bdf8; font-weight: 700; padding: 9px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                                        <span>✨</span> <span>הרשמה מהירה (סטודנט חדש) ←</span>
                                    </button>"""

    content = content.replace(old_switch_btn.replace('\n', '\r\n'), new_switch_btn.replace('\n', '\r\n'))
    content = content.replace(old_switch_btn, new_switch_btn)

    with open(AUTH_SYNC_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("auth_sync.js patched successfully!")

if __name__ == '__main__':
    patch_index()
    patch_auth_sync()
