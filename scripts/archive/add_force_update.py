fp_html = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(fp_html, "r", encoding="utf-8") as f:
    content = f.read()

target = '<span class="app-version-badge" style="font-size: 0.66rem; background: rgba(15, 23, 42, 0.6); border-color: rgba(56, 189, 248, 0.35); color: #7dd3fc;">🔒 נעול לעריכה</span>'
replacement = """<div style="display: flex; align-items: center; gap: 8px;">
                            <button type="button" class="btn btn-xs" id="btn-force-update-app" onclick="if(window.forceUpdateApp) { window.forceUpdateApp(); } else { window.location.reload(true); }" style="background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.76rem; font-weight: 700;">
                                🔄 רענן גרסה ונקה מטמון
                            </button>
                            <span class="app-version-badge" style="font-size: 0.66rem; background: rgba(15, 23, 42, 0.6); border-color: rgba(56, 189, 248, 0.35); color: #7dd3fc;">v2.7.3 פעילה</span>
                        </div>"""

assert target in content
content = content.replace(target, replacement, 1)
with open(fp_html, "w", encoding="utf-8") as f:
    f.write(content)

# Also add window.forceUpdateApp to app.js
fp_app = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(fp_app, "r", encoding="utf-8") as f:
    app_content = f.read()

if "window.forceUpdateApp = " not in app_content:
    func = """
window.forceUpdateApp = async function() {
    if (typeof showToastNotification === 'function') {
        showToastNotification('מנקה מטמון וטוען גרסה עדכנית...', 'info');
    }
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) {
                await r.unregister();
            }
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            for (const k of keys) {
                await caches.delete(k);
            }
        }
    } catch (e) {
        console.warn('Cache clearing notice:', e);
    }
    setTimeout(() => {
        window.location.reload(true);
    }, 250);
};
"""
    app_content = app_content + func
    with open(fp_app, "w", encoding="utf-8") as f:
        f.write(app_content)

print("Successfully added forceUpdateApp button and handler!")
