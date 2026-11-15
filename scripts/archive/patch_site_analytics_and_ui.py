import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Patch site_analytics.js
with open("site_analytics.js", "r", encoding="utf-8") as f:
    analytics_content = f.read()

old_open_modal = """        async openModal() {
            // Restrict access: Developer Adir only, or require master password
            const isAdir = window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive();
            if (!isAdir) {
                const pass = prompt('🔒 גישה לנתוני משתמשים וכניסות מוגבלת למנהל המערכת בלבד.\\nאנא הזן סיסמת מפתח:');
                if (pass !== 'BenchyTech1' && pass !== 'adir2368') {
                    if (typeof showToastNotification === 'function') {
                        showToastNotification('⛔ סיסמה שגויה - גישה נדחתה', 'error');
                    } else {
                        alert('⛔ סיסמה שגויה - גישה נדחתה');
                    }
                    return;
                }
            }"""

new_open_modal = """        async openModal() {
            // Restrict access: Strictly Developer Adir Moshe account only
            const isAdir = window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive();
            if (!isAdir) {
                if (typeof showToastNotification === 'function') {
                    showToastNotification('⛔ גישה חסומה - נתוני משתמשים וכניסות מוגבלים לחשבון מנהל המערכת (אדיר משה) בלבד', 'error');
                } else {
                    alert('⛔ גישה חסומה - נתוני משתמשים וכניסות מוגבלים לחשבון מנהל המערכת (אדיר משה) בלבד');
                }
                return;
            }"""

if old_open_modal in analytics_content:
    analytics_content = analytics_content.replace(old_open_modal, new_open_modal)
    print("✓ Secured SiteAnalytics.openModal() to strictly require Adir's authenticated account")
else:
    print("Note: old_open_modal not matched exactly, checking regex...")
    analytics_content = re.sub(
        r'''async\s+openModal\(\)\s*\{[\s\S]*?if\s*\(!isAdir\)\s*\{[\s\S]*?return;\s*\}\s*\}''',
        new_open_modal.strip(),
        analytics_content
    )
    print("✓ Applied regex replacement for openModal()")

# Also enhance init to fetchStats if Adir is active
old_init_pills = """            // Update stats badge in Settings once idle
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => this.updateSettingsPills(), { timeout: 5000 });
            } else {
                setTimeout(() => this.updateSettingsPills(), 3500);
            }"""

new_init_pills = """            // Update stats badge in Settings once idle and fetch stats if Adir is active
            const refreshPills = () => {
                this.updateSettingsPills();
                if (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive()) {
                    this.fetchStats();
                }
            };
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(refreshPills, { timeout: 2000 });
            } else {
                setTimeout(refreshPills, 1200);
            }"""

if old_init_pills in analytics_content:
    analytics_content = analytics_content.replace(old_init_pills, new_init_pills)
    print("✓ Enhanced SiteAnalytics.init() with early refresh")

with open("site_analytics.js", "w", encoding="utf-8") as f:
    f.write(analytics_content)
print("✓ Successfully updated site_analytics.js")

# Patch app.js in renderSettingsPage()
with open("app.js", "r", encoding="utf-8") as f:
    app_content = f.read()

target_settings_point = """function renderSettingsPage() {
    ensureBaselineRevisions();"""

replacement_settings_point = """function renderSettingsPage() {
    ensureBaselineRevisions();
    if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
        window.SiteAnalytics.updateSettingsPills();
    }"""

if target_settings_point in app_content and "window.SiteAnalytics.updateSettingsPills" not in app_content[app_content.find("function renderSettingsPage()"):app_content.find("function renderSettingsPage()") + 300]:
    app_content = app_content.replace(target_settings_point, replacement_settings_point, 1)
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(app_content)
    print("✓ Added SiteAnalytics.updateSettingsPills() to renderSettingsPage() in app.js")
else:
    print("Note: renderSettingsPage target point already patched or not found")

# Patch ui_enhancements.js for Command Palette and Shortcuts
with open("ui_enhancements.js", "r", encoding="utf-8") as f:
    ui_content = f.read()

# Add SiteAnalytics to Command Palette
old_actions_end = """        actions.forEach(a => items.push({ ...a, type: 'action', group: 'פעולות מערכת' }));"""
new_actions_end = """        if (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive()) {
            actions.push({
                id: 'act-site-analytics',
                title: 'סטטיסטיקת שימוש, משתמשים וכניסות (Audience & Telemetry)',
                icon: '👥',
                shortcut: 'Ctrl+Shift+A',
                type: 'action',
                group: 'ניהול מערכת (מנהל בלבד)',
                action: () => window.SiteAnalytics && window.SiteAnalytics.openModal()
            });
        }
        actions.forEach(a => items.push({ ...a, type: 'action', group: a.group || 'פעולות מערכת' }));"""

if old_actions_end in ui_content and "act-site-analytics" not in ui_content:
    ui_content = ui_content.replace(old_actions_end, new_actions_end, 1)
    print("✓ Added SiteAnalytics command to Command Palette for Adir")

# Add shortcut listener for Ctrl+Shift+A
old_keyboard_block = """            // Ctrl+K / Cmd+K - Command Palette"""
new_keyboard_block = """            // Ctrl+Shift+A - Admin Site Analytics (Adir only)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                if (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive()) {
                    e.preventDefault();
                    if (window.SiteAnalytics) window.SiteAnalytics.openModal();
                    return;
                }
            }

            // Ctrl+K / Cmd+K - Command Palette"""

if old_keyboard_block in ui_content and "Ctrl+Shift+A - Admin Site Analytics" not in ui_content:
    ui_content = ui_content.replace(old_keyboard_block, new_keyboard_block, 1)
    print("✓ Added Ctrl+Shift+A shortcut for Admin Site Analytics")

with open("ui_enhancements.js", "w", encoding="utf-8") as f:
    f.write(ui_content)
print("✓ Successfully updated ui_enhancements.js")
