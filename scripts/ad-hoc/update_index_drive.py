import sys

sys.stdout.reconfigure(encoding="utf-8")

index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Notion Toolbar button
target_focus = """                            <div class="filter-group">
                                <button type="button" class="notion-focus-toggle-btn active" id="notion-focus-toggle-btn" title="הצג רק את המשימה הרלוונטית הבאה מכל סוג">
                                    <span class="focus-icon">🎯</span>
                                    <span class="focus-label">משימה רלוונטית בלבד</span>
                                </button>
                            </div>"""

replacement_focus = """                            <div class="filter-group">
                                <button type="button" class="notion-focus-toggle-btn active" id="notion-focus-toggle-btn" title="הצג רק את המשימה הרלוונטית הבאה מכל סוג">
                                    <span class="focus-icon">🎯</span>
                                    <span class="focus-label">משימה רלוונטית בלבד</span>
                                </button>
                            </div>
                            <!-- Direct Faculty Drive Quick Button (פתרונות שיעורי בית ומבחני עבר) -->
                            <div class="filter-group">
                                <a href="https://technionmail-my.sharepoint.com/personal/adir_moshe_campus_technion_ac_il/_layouts/15/onedrive.aspx?listurl=https%3A%2F%2Ftechnionmail-my%2Esharepoint%2Ecom%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments&view=3&id=%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments%2FMechanical%20Engineering%20Drive&csf=1&web=1&e=jG2HFG&FolderCTID=0x01200020FCF278196BFF4B9D20B38488EBB4E7" target="_blank" rel="noopener noreferrer" class="notion-faculty-drive-btn" id="notion-faculty-drive-btn" title="פתיחת דרייב הפקולטה להנדסת מכונות - פתרונות שיעורי בית ישנים, רפרנסים ומבחני עבר (אס״ט)">
                                    <span class="drive-icon">📁</span>
                                    <span class="drive-label">דרייב הפקולטה ↗</span>
                                </a>
                            </div>"""

if target_focus in text:
    text = text.replace(target_focus, replacement_focus)
    print("Added notion-faculty-drive-btn to index.html toolbar")
else:
    print("Warning: target_focus not found in index.html")

# 2. Side Peek drawer
target_peek = """                <!-- Direct Pangea Materials Link -->
                <div class="peek-property-row" id="peek-property-pangea-row" style="display: none;">
                    <span class="peek-property-label">🌍 מאגר פנגיאה (Pangea)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-pangea-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #34d399; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח סיכומים וחומרי עזר בפנגייה ↗
                        </a>
                    </span>
                </div>"""

replacement_peek = """                <!-- Direct Pangea Materials Link -->
                <div class="peek-property-row" id="peek-property-pangea-row" style="display: none;">
                    <span class="peek-property-label">🌍 מאגר פנגיאה (Pangea)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-pangea-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #34d399; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח סיכומים וחומרי עזר בפנגייה ↗
                        </a>
                    </span>
                </div>
                <!-- Direct Faculty Drive (ME Solutions & Past Exams) Link -->
                <div class="peek-property-row" id="peek-property-drive-row">
                    <span class="peek-property-label">📁 דרייב הפקולטה (מכונות)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-drive-link" href="https://technionmail-my.sharepoint.com/personal/adir_moshe_campus_technion_ac_il/_layouts/15/onedrive.aspx?listurl=https%3A%2F%2Ftechnionmail-my%2Esharepoint%2Ecom%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments&view=3&id=%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments%2FMechanical%20Engineering%20Drive&csf=1&web=1&e=jG2HFG&FolderCTID=0x01200020FCF278196BFF4B9D20B38488EBB4E7" target="_blank" rel="noopener noreferrer" style="color: #c084fc; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח פתרונות עבר בדרייב הפקולטי (אס״ט) ↗
                        </a>
                    </span>
                </div>"""

if target_peek in text:
    text = text.replace(target_peek, replacement_peek)
    print("Added peek-property-drive-row to index.html Side Peek")
else:
    print("Warning: target_peek not found in index.html")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(text)
print("index.html successfully updated!")
