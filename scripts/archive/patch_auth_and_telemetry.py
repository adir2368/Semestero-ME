import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

auth_sync_path = "auth_sync.js"
with open(auth_sync_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Clean up stray </button>
stray_pattern = r'''(<button type="submit" class="btn btn-primary btn-block"[^>]*>\s*🚀 התחבר עכשיו\s*</button>)\s*</button>'''
if re.search(stray_pattern, content):
    content = re.sub(stray_pattern, r'\1', content)
    print("✓ Fixed stray </button> in auth_sync.js")
else:
    print("Note: stray </button> not found by regex")

# 2. Update isAdirActive()
old_is_adir = """        // Check if active account is Adir Moshe
        isAdirActive() {
            if (isCapacitorOrNative()) return true;
            return this.isLoggedIn() && this.getActiveUser().id === 'adir_moshe';
        },"""

new_is_adir = """        // Check if active account is Adir Moshe (strictly verified)
        isAdirActive() {
            if (!this.isLoggedIn()) return false;
            const user = this.getActiveUser();
            return !!(user && (user.id === 'adir_moshe' || user.id === 'adir' || user.name === 'אדיר משה'));
        },"""

if old_is_adir in content:
    content = content.replace(old_is_adir, new_is_adir)
    print("✓ Updated isAdirActive() to strictly verify logged-in Adir Moshe account")
else:
    print("Note: old isAdirActive() string match not exact, checking normalized...")
    content = re.sub(
        r'''isAdirActive\(\)\s*\{\s*if\s*\(isCapacitorOrNative\(\)\)\s*return\s*true;\s*return\s*this\.isLoggedIn\(\)\s*&&\s*this\.getActiveUser\(\)\.id\s*===\s*'adir_moshe';\s*\}''',
        new_is_adir.strip(),
        content
    )
    print("✓ Applied regex replacement for isAdirActive()")

# 3. Enhance loginWithPassword for Adir with developer flags and telemetry sync
old_adir_login = """            // 1. Check Master Password for Developer Adir Moshe ONLY if identifier is Adir
            if (MASTER_PASSWORDS.includes(cleanPass) && isAdirIdentifier) {
                localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
                this.setupRealtimeSubscription();
                await this.pullLatestStateFromCloud(true);
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();
                if (typeof showHudToast === 'function') {
                    showHudToast('שלום אדיר! התחברת בהצלחה 🎓', 'success');
                } else {
                    alert('שלום אדיר! התחברת בהצלחה.');
                }
                return true;
            }"""

new_adir_login = """            // 1. Check Master Password for Developer Adir Moshe ONLY if identifier is Adir
            if (MASTER_PASSWORDS.includes(cleanPass) && isAdirIdentifier) {
                localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
                try {
                    localStorage.setItem('ast_profile_adir_moshe', 'true');
                    localStorage.setItem('ast_is_developer_device', 'true');
                } catch (e) {}
                this.setupRealtimeSubscription();
                await this.pullLatestStateFromCloud(true);
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();
                if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                    window.SiteAnalytics.updateSettingsPills();
                    if (typeof window.SiteAnalytics.fetchStats === 'function') {
                        window.SiteAnalytics.fetchStats();
                    }
                }
                if (typeof showHudToast === 'function') {
                    showHudToast('שלום אדיר! התחברת בהצלחה 🎓', 'success');
                } else {
                    alert('שלום אדיר! התחברת בהצלחה.');
                }
                return true;
            }"""

if old_adir_login in content:
    content = content.replace(old_adir_login, new_adir_login)
    print("✓ Enhanced loginWithPassword for Adir")

# 4. In logout(), update SiteAnalytics pills
old_logout = """            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();"""

new_logout = """            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();
            if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                window.SiteAnalytics.updateSettingsPills();
            }"""

if old_logout in content:
    content = content.replace(old_logout, new_logout)
    print("✓ Added SiteAnalytics update to logout()")

# 5. In renderAuthModal(), add Admin quick link to Telemetry for Adir
old_overview_card = """                        <!-- Overview Card -->"""
admin_telemetry_snippet = """                        <!-- Admin Telemetry & User Stats (Adir Moshe Only) -->
                        ${isDev ? `
                        <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <div style="font-weight: 700; color: #38bdf8; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                                    <span>👥</span> <span>סטטיסטיקת שימוש, משתמשים וכניסות</span>
                                </div>
                                <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                                    צפייה בזמן אמת בכמות משתמשי האפליקציה, כניסות אופליין ואורחים
                                </div>
                            </div>
                            <button type="button" class="btn btn-xs btn-primary" onclick="AuthSync.closeAuthModal(); if (window.SiteAnalytics) SiteAnalytics.openModal();" style="background: linear-gradient(135deg, #0284c7, #2563eb); font-weight: 700; padding: 6px 12px; border-radius: 6px;">
                                🔍 פתח לוח סטטיסטיקה
                            </button>
                        </div>
                        ` : ''}

                        <!-- Overview Card -->"""

if old_overview_card in content and "<!-- Admin Telemetry & User Stats (Adir Moshe Only) -->" not in content:
    content = content.replace(old_overview_card, admin_telemetry_snippet, 1)
    print("✓ Added Admin Telemetry quick action to user profile modal")

with open(auth_sync_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✓ Successfully updated auth_sync.js")
