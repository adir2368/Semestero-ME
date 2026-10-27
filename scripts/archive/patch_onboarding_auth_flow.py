import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
auth_path = os.path.join(ROOT, "auth_sync.js")

with open(auth_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update init() entrance trigger
old_init = """            // Auto-trigger onboarding wizard on very first launch for fresh guests
            if (localStorage.getItem('ast_onboarding_shown') !== 'true' && !this.isLoggedIn() && !hasAdirLocalData()) {
                setTimeout(() => {
                    this.openOnboardingWizard();
                }, 1200);
            }"""

new_init = """            // Auto-trigger auth modal (login prompt) on entrance for unauthenticated visitors
            try {
                const isQaTest = typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('qa_health_test');
                const dismissed = sessionStorage.getItem('ast_auth_prompt_dismissed') === 'true';
                if (!isQaTest && !dismissed && !this.isLoggedIn() && !hasAdirLocalData()) {
                    setTimeout(() => {
                        this.openAuthModal('login');
                    }, 1000);
                }
            } catch (e) {}"""

if old_init in text:
    text = text.replace(old_init, new_init, 1)
    print("✓ Patched init() entrance trigger")
else:
    print("⚠ old_init not found")

# 2. Update registerStudent()
old_reg = """            if (typeof showHudToast === 'function') {
                showHudToast('ברוך הבא ל-Semestero ME, ' + name + '! 🎉', 'success');
            } else {
                alert('החשבון נוצר בהצלחה!');
            }
            return true;"""

new_reg = """            if (typeof showHudToast === 'function') {
                showHudToast('ברוך הבא ל-Semestero ME, ' + name + '! 🎉', 'success');
            } else {
                alert('החשבון נוצר בהצלחה!');
            }

            // Launch interactive guided tour right after successful registration
            setTimeout(() => {
                if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                    window.InteractiveTour.startTour(0);
                } else if (typeof window.startInteractiveTour === 'function') {
                    window.startInteractiveTour(0);
                }
            }, 600);
            return true;"""

if old_reg in text:
    text = text.replace(old_reg, new_reg, 1)
    print("✓ Patched registerStudent() tour trigger")
else:
    print("⚠ old_reg not found")

# 3. Update renderAuthModal() login form
old_login = """                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">
                                    🚀 התחבר עכשיו
                                </button>
                                <div style="text-align: center; margin-top: 12px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('reset_password')" style="color: #38bdf8; font-size: 0.82rem; text-decoration: underline; cursor: pointer;">
                                        שכחת סיסמה? / אפס סיסמה
                                    </a>
                                </div>
                            </form>"""

new_login = """                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">
                                    🚀 התחבר עכשיו
                                </button>
                                <div style="text-align: center; margin-top: 10px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('reset_password')" style="color: #38bdf8; font-size: 0.82rem; text-decoration: underline; cursor: pointer;">
                                        שכחת סיסמה? / אפס סיסמה
                                    </a>
                                </div>
                                <div style="margin-top: 14px; text-align: center; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.12);">
                                    <div style="font-size: 0.84rem; color: #94a3b8; margin-bottom: 8px;">
                                        עדיין אין לך חשבון ב-Semestero ME?
                                    </div>
                                    <button type="button" class="btn btn-outline" id="btn-switch-to-register" onclick="AuthSync.renderAuthModal('register')" style="width: 100%; border-color: #38bdf8; color: #38bdf8; font-weight: 700; padding: 9px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                                        <span>✨</span> <span>הרשמה מהירה (סטודנט חדש) ←</span>
                                    </button>
                                </div>
                                <div style="text-align: center; margin-top: 12px;">
                                    <button type="button" onclick="AuthSync.closeAuthModal(); sessionStorage.setItem('ast_auth_prompt_dismissed', 'true');" style="background: none; border: none; color: #64748b; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                                        המשך כאורח בינתיים (ללא סנכרון ענן) ←
                                    </button>
                                </div>
                            </form>"""

if old_login in text:
    text = text.replace(old_login, new_login, 1)
    print("✓ Patched renderAuthModal() login form")
else:
    print("⚠ old_login not found")

# 4. Update renderAuthModal() register form
old_reg_form = """                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    ✨ צור חשבון והתחל
                                </button>
                            </form>"""

new_reg_form = """                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    ✨ צור חשבון והתחל בסיור
                                </button>
                                <div style="text-align: center; margin-top: 12px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('login')" style="color: #38bdf8; font-size: 0.82rem; cursor: pointer; text-decoration: underline;">
                                        כבר יש לך חשבון קיים? לחץ כאן להתחברות ←
                                    </a>
                                </div>
                                <div style="text-align: center; margin-top: 8px;">
                                    <button type="button" onclick="AuthSync.closeAuthModal(); sessionStorage.setItem('ast_auth_prompt_dismissed', 'true');" style="background: none; border: none; color: #64748b; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                                        המשך כאורח בינתיים ←
                                    </button>
                                </div>
                            </form>"""

if old_reg_form in text:
    text = text.replace(old_reg_form, new_reg_form, 1)
    print("✓ Patched renderAuthModal() register form")
else:
    print("⚠ old_reg_form not found")

with open(auth_path, "w", encoding="utf-8") as f:
    f.write(text)

print("\nAll auth onboarding flow patches applied successfully!")
