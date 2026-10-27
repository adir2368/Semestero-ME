import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
AUTH_SYNC_PATH = os.path.join(ROOT, "auth_sync.js")
APP_PATH = os.path.join(ROOT, "app.js")
INDEX_PATH = os.path.join(ROOT, "index.html")

def patch_auth_sync():
    with open(AUTH_SYNC_PATH, "r", encoding="utf-8") as f:
        c = f.read()

    # 1. Protect Adir in finishOnboarding
    target_finish = """        // Finish Onboarding Wizard
        finishOnboarding() {"""

    replacement_finish = """        // Finish Onboarding Wizard
        finishOnboarding() {
            // Guard: If developer Adir tests onboarding, do NOT overwrite his authentic degree data
            if (this.isAdirActive() || (this.getActiveUser && this.getActiveUser().id === 'adir_moshe')) {
                console.log('[AuthSync] Developer Adir testing onboarding: preserving authentic state');
                localStorage.setItem('ast_onboarding_shown', 'true');
                const modal = document.getElementById('onboarding-wizard-modal');
                if (modal) modal.classList.remove('active');
                if (typeof showToastNotification === 'function') {
                    showToastNotification('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                } else if (typeof showHudToast === 'function') {
                    showHudToast('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                }
                setTimeout(() => {
                    if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                        window.InteractiveTour.startTour(0);
                    } else if (typeof window.startInteractiveTour === 'function') {
                        window.startInteractiveTour(0);
                    }
                }, 600);
                return;
            }"""

    c = c.replace(target_finish.replace('\n', '\r\n'), replacement_finish.replace('\n', '\r\n'))
    c = c.replace(target_finish, replacement_finish)

    # 2. Only write LEGACY_SAVE_KEY if user is adir_moshe
    target_legacy_save = """                localStorage.setItem(key, JSON.stringify(state));
                localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(state));"""

    replacement_legacy_save = """                localStorage.setItem(key, JSON.stringify(state));
                if (user.id === 'adir_moshe') {
                    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(state));
                }"""

    c = c.replace(target_legacy_save.replace('\n', '\r\n'), replacement_legacy_save.replace('\n', '\r\n'))
    c = c.replace(target_legacy_save, replacement_legacy_save)

    # 3. Auto-heal in loadActiveUserState if adir_moshe local save is wiped or corrupted
    target_load = """                    } else if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        return parsed;
                    }"""

    replacement_load = """                    } else if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        if (user.id === 'adir_moshe') {
                            const isAdirCorrupted = !parsed.gpa || parsed.gpa === 0 || !parsed.courses['104041'] || !parsed.courses['104041'].grade;
                            if (isAdirCorrupted) {
                                console.warn('[AuthSync] Adir Moshe local save is corrupted/reset. Restoring from PRELOADED_USER_STATE...');
                                if (typeof PRELOADED_USER_STATE !== 'undefined') {
                                    const restored = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
                                    localStorage.setItem(key, JSON.stringify(restored));
                                    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(restored));
                                    return restored;
                                }
                            }
                        }
                        return parsed;
                    }"""

    c = c.replace(target_load.replace('\n', '\r\n'), replacement_load.replace('\n', '\r\n'))
    c = c.replace(target_load, replacement_load)

    with open(AUTH_SYNC_PATH, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ auth_sync.js patched with Adir state guards")

def patch_app_js():
    with open(APP_PATH, "r", encoding="utf-8") as f:
        c = f.read()

    target = """            if (isAdirActiveUser && preloadedUserState && preloadedUserState.courses) {
                const preloadedCount = Object.keys(preloadedUserState.courses).length;
                const localCount = Object.keys(gameState.courses || {}).length;
                if (localCount < preloadedCount) {"""

    replacement = """            if (isAdirActiveUser && preloadedUserState && preloadedUserState.courses) {
                const preloadedCount = Object.keys(preloadedUserState.courses).length;
                const localCount = Object.keys(gameState.courses || {}).length;
                const isAdirCorrupted = !gameState.gpa || gameState.gpa === 0 || !gameState.courses || !gameState.courses['104041'] || !gameState.courses['104041'].grade;
                if (localCount < preloadedCount || isAdirCorrupted) {"""

    c = c.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
    c = c.replace(target, replacement)

    with open(APP_PATH, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ app.js patched with Adir auto-heal logic")

def patch_index_canonical():
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        c = f.read()

    c = c.replace("https://adir2368.github.io/Semestero-ME/", "https://semestero.me/Semestero-ME/")

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ index.html canonical and OpenGraph updated to semestero.me")

if __name__ == '__main__':
    patch_auth_sync()
    patch_app_js()
    patch_index_canonical()
