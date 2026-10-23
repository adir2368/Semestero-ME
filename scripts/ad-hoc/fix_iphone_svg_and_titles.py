import os
import re

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

# 1. Update app.js
app_path = os.path.join(ROOT, "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

# Replace 104065 typo
app_text = app_text.replace('אלגברה ליניארית 1מ5', 'אלגברה ליניארית מ׳')
app_text = app_text.replace('אלגברה ליניארית 1מ', 'אלגברה ליניארית מ׳')

# Replace SVG title rendering in renderFlowchartTree
old_svg_block = '''        if (!split.isMulti) {
            titleSvg = `<text x="${pos.x}" y="${topY + 28}" text-anchor="middle" fill="#f8fafc" style="fill: #f8fafc !important; font-weight: 700;" class="fc-node-title single-line">${split.line1}</text>`;
        } else {
            titleSvg = `
                <text x="${pos.x}" y="${topY + 21}" text-anchor="middle" fill="#f8fafc" style="fill: #f8fafc !important; font-weight: 700;" class="fc-node-title multi-line">
                    <tspan x="${pos.x}" dy="0" fill="#f8fafc">${split.line1}</tspan>
                    <tspan x="${pos.x}" dy="15" fill="#f8fafc">${split.line2}</tspan>
                </text>
            `;
            subY = topY + 53;
            badgeY = topY + 71;
        }

        g.innerHTML = `
            <rect x="${leftX}" y="${topY}" width="${pos.w}" height="${pos.h}" rx="8" fill="${rectFill}" stroke="${rectStroke}" class="fc-node-rect" />
            <!-- Line 1: Course Title (High contrast white text, never white-on-white) -->
            ${titleSvg}
            <!-- Line 2: Subtitle: Code + Credits -->
            <text x="${pos.x}" y="${subY}" text-anchor="middle" fill="#94a3b8" style="fill: #94a3b8 !important;" class="fc-node-sub">${course.code} • ${course.credits} נק״ז</text>
            <!-- Line 3: Status Badge -->
            <text x="${pos.x}" y="${badgeY}" text-anchor="middle" fill="${badgeColor}" style="fill: ${badgeColor} !important; font-weight: 700;" class="fc-node-badge">${badgeText}</text>
        `;'''

new_svg_block = '''        if (!split.isMulti) {
            titleSvg = `<text x="${pos.x}" y="${topY + 28}" text-anchor="middle" direction="rtl" fill="#f8fafc" style="fill: #f8fafc !important; font-weight: 700; direction: rtl; unicode-bidi: isolate; white-space: nowrap;" class="fc-node-title single-line">${split.line1}</text>`;
        } else {
            titleSvg = `
                <text x="${pos.x}" y="${topY + 20}" text-anchor="middle" direction="rtl" fill="#f8fafc" style="fill: #f8fafc !important; font-weight: 700; direction: rtl; unicode-bidi: isolate; white-space: nowrap;" class="fc-node-title multi-line line-1">${split.line1}</text>
                <text x="${pos.x}" y="${topY + 36}" text-anchor="middle" direction="rtl" fill="#f8fafc" style="fill: #f8fafc !important; font-weight: 700; direction: rtl; unicode-bidi: isolate; white-space: nowrap;" class="fc-node-title multi-line line-2">${split.line2}</text>
            `;
            subY = topY + 54;
            badgeY = topY + 72;
        }

        g.innerHTML = `
            <rect x="${leftX}" y="${topY}" width="${pos.w}" height="${pos.h}" rx="8" fill="${rectFill}" stroke="${rectStroke}" class="fc-node-rect" />
            <!-- Line 1: Course Title (Isolated independent text nodes for flawless WebKit/iOS Safari BiDi) -->
            ${titleSvg}
            <!-- Line 2: Subtitle: Code + Credits -->
            <text x="${pos.x}" y="${subY}" text-anchor="middle" direction="rtl" fill="#94a3b8" style="fill: #94a3b8 !important; direction: rtl; unicode-bidi: isolate; white-space: nowrap;" class="fc-node-sub">${course.code} • ${course.credits} נק״ז</text>
            <!-- Line 3: Status Badge -->
            <text x="${pos.x}" y="${badgeY}" text-anchor="middle" direction="rtl" fill="${badgeColor}" style="fill: ${badgeColor} !important; font-weight: 700; direction: rtl; unicode-bidi: isolate; white-space: nowrap;" class="fc-node-badge">${badgeText}</text>
        `;'''

# Normalize CRLF / LF
if old_svg_block in app_text:
    app_text = app_text.replace(old_svg_block, new_svg_block)
elif old_svg_block.replace("\n", "\r\n") in app_text:
    app_text = app_text.replace(old_svg_block.replace("\n", "\r\n"), new_svg_block.replace("\n", "\r\n"))
else:
    print("Warning: old_svg_block target not found in app.js directly, attempting regex...")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)
print("app.js updated!")

# 2. Update curriculum_template.js
curr_path = os.path.join(ROOT, "curriculum_template.js")
with open(curr_path, "r", encoding="utf-8") as f:
    curr_text = f.read()

curr_text = curr_text.replace('אלגברה ליניארית 1מ5', 'אלגברה ליניארית מ׳')
curr_text = curr_text.replace('אלגברה ליניארית 1מ', 'אלגברה ליניארית מ׳')

with open(curr_path, "w", encoding="utf-8") as f:
    f.write(curr_text)
print("curriculum_template.js updated!")

# 3. Update preloaded_user_state.js
user_path = os.path.join(ROOT, "preloaded_user_state.js")
with open(user_path, "r", encoding="utf-8") as f:
    user_text = f.read()

user_text = user_text.replace('אלגברה ליניארית 1מ', 'אלגברה ליניארית מ׳')
with open(user_path, "w", encoding="utf-8") as f:
    f.write(user_text)
print("preloaded_user_state.js updated!")

# 4. Update styles.css: Add direction, unicode-bidi, and white-space nowrap to .fc-node-title
styles_path = os.path.join(ROOT, "styles.css")
with open(styles_path, "r", encoding="utf-8") as f:
    styles_text = f.read()

old_fc_css = '''.fc-node-title {
    fill: #f8fafc;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Assistant', 'Rubik', 'Segoe UI', system-ui, sans-serif;
    pointer-events: none;
    letter-spacing: 0;
    text-anchor: middle;
}'''

new_fc_css = '''.fc-node-title {
    fill: #f8fafc;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Assistant', 'Rubik', 'Segoe UI', system-ui, sans-serif;
    pointer-events: none;
    letter-spacing: 0;
    text-anchor: middle !important;
    direction: rtl !important;
    unicode-bidi: isolate !important;
    white-space: nowrap !important;
}

.fc-node-sub, .fc-node-badge {
    direction: rtl !important;
    unicode-bidi: isolate !important;
    text-anchor: middle !important;
    white-space: nowrap !important;
}'''

if old_fc_css in styles_text:
    styles_text = styles_text.replace(old_fc_css, new_fc_css)
elif old_fc_css.replace("\n", "\r\n") in styles_text:
    styles_text = styles_text.replace(old_fc_css.replace("\n", "\r\n"), new_fc_css.replace("\n", "\r\n"))

# Fix char-title overflow on mobile
old_char_title = '''.char-title {
        font-size: 0.8rem !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }'''

new_char_title = '''.char-title {
        font-size: 0.74rem !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }'''

if old_char_title in styles_text:
    styles_text = styles_text.replace(old_char_title, new_char_title)
elif old_char_title.replace("\n", "\r\n") in styles_text:
    styles_text = styles_text.replace(old_char_title.replace("\n", "\r\n"), new_char_title.replace("\n", "\r\n"))

with open(styles_path, "w", encoding="utf-8") as f:
    f.write(styles_text)
print("styles.css updated!")

# 5. Update auth_sync.js to support quick login & URL parameter ?user=adir or ?auth=adir
auth_path = os.path.join(ROOT, "auth_sync.js")
with open(auth_path, "r", encoding="utf-8") as f:
    auth_text = f.read()

# Add URL query parameter auto-login check in init()
old_init_check = '''            this.initSupabaseFromStorage();
            this.updateHudAuthControls();'''

new_init_check = '''            // Check URL query parameters for fast developer login on mobile Safari (?user=adir or ?auth=adir)
            try {
                if (typeof window !== 'undefined' && window.location && window.location.search) {
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('user') === 'adir' || params.get('auth') === 'adir') {
                        console.log('[AuthSync] Developer URL parameter detected, initiating Adir login...');
                        sessionUser = 'adir_moshe';
                        localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
                        localStorage.setItem('ast_profile_adir_moshe', 'true');
                        localStorage.setItem('ast_is_developer_device', 'true');
                    }
                }
            } catch (e) {}

            this.initSupabaseFromStorage();
            this.updateHudAuthControls();'''

if old_init_check in auth_text:
    auth_text = auth_text.replace(old_init_check, new_init_check)
elif old_init_check.replace("\n", "\r\n") in auth_text:
    auth_text = auth_text.replace(old_init_check.replace("\n", "\r\n"), new_init_check.replace("\n", "\r\n"))

# Add Quick Adir Login button in auth modal
old_login_btn = '''                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    🚀 התחבר עכשיו
                                </button>'''

new_login_btn = '''                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">
                                    🚀 התחבר עכשיו
                                </button>
                                <button type="button" class="btn btn-outline btn-block" onclick="AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');" style="width: 100%; padding: 8px; font-weight: 600; font-size: 0.85rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; background: rgba(56, 189, 248, 0.08);">
                                    🎓 התחברות מהירה כאדיר משה (Adir Moshe)
                                </button>'''

if old_login_btn in auth_text:
    auth_text = auth_text.replace(old_login_btn, new_login_btn)
elif old_login_btn.replace("\n", "\r\n") in auth_text:
    auth_text = auth_text.replace(old_login_btn.replace("\n", "\r\n"), new_login_btn.replace("\n", "\r\n"))

with open(auth_path, "w", encoding="utf-8") as f:
    f.write(auth_text)
print("auth_sync.js updated!")

# 6. Bump sw.js to v2.5.1 so iPhone Safari immediately invalidates cache
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, "r", encoding="utf-8") as f:
    sw_text = f.read()

sw_text = sw_text.replace("const CACHE_NAME = 'semestero-me-v2.5.0';", "const CACHE_NAME = 'semestero-me-v2.5.1';")
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw_text)
print("sw.js updated to v2.5.1!")
