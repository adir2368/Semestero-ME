import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Target 1: Settings Google Calendar Card Header
target_html_1 = """                    <div class="settings-card-header">
                        <div class="settings-card-title">
                            <span>📅 הגדרות סנכרון יומני Google (Editable Calendar IDs & Webhook)</span>
                        </div>
                        <button type="button" class="btn btn-xs btn-outline" id="btn-save-section-calendars" style="border-color: #38bdf8; color: #38bdf8;">
                            💾 שמור הגדרות יומנים
                        </button>
                    </div>"""

replacement_html_1 = """                    <div class="settings-card-header" style="flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div class="settings-card-title">
                                <span>📅 הגדרות סנכרון יומני Google (Editable Calendar IDs & Webhook)</span>
                            </div>
                            <div id="settings-gcal-status-badge" style="font-size: 0.76rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(148, 163, 184, 0.4); background: rgba(148, 163, 184, 0.1); color: #94a3b8; display: inline-flex; align-items: center; gap: 5px; margin-top: 4px;">
                                ⚪ אינו מחובר ליומני Google — הזן מזהי יומן או Webhook לסנכרון
                            </div>
                        </div>
                        <button type="button" class="btn btn-xs btn-outline" id="btn-save-section-calendars" style="border-color: #38bdf8; color: #38bdf8;">
                            💾 שמור הגדרות יומנים
                        </button>
                    </div>"""

# Target 2: Phone status indicator & description
target_html_2 = """                                        <div style="font-size: 0.88rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                            <span>מספר טלפון מקושר:</span>
                                            <span class="phone-status-badge badge-pending" id="phone-status-indicator">⚠️ לא הוגדר מספר</span>
                                        </div>
                                        <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                                            מספר הטלפון מוגדר ומאובטח בפרטי החשבון ומסונכרן לענן
                                        </div>"""

replacement_html_2 = """                                        <div style="font-size: 0.88rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                            <span>מספר טלפון מקושר:</span>
                                            <span class="phone-status-badge badge-pending" id="phone-status-indicator">⚪ ערוץ טלפון אינו מחובר</span>
                                        </div>
                                        <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;" id="phone-status-desc">
                                            ערוץ התראות אינו מחובר — לא הוגדר מספר טלפון
                                        </div>"""

# Normalize line endings for replacement
crlf = '\r\n' in html
if crlf:
    target_html_1_norm = target_html_1.replace('\n', '\r\n')
    replacement_html_1_norm = replacement_html_1.replace('\n', '\r\n')
    target_html_2_norm = target_html_2.replace('\n', '\r\n')
    replacement_html_2_norm = replacement_html_2.replace('\n', '\r\n')
else:
    target_html_1_norm = target_html_1
    replacement_html_1_norm = replacement_html_1
    target_html_2_norm = target_html_2
    replacement_html_2_norm = replacement_html_2

assert target_html_1_norm in html, "target_html_1 not found in index.html"
assert target_html_2_norm in html, "target_html_2 not found in index.html"

html = html.replace(target_html_1_norm, replacement_html_1_norm, 1)
html = html.replace(target_html_2_norm, replacement_html_2_norm, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html successfully.")
