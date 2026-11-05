import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# ==========================================
# 1. Update index.html
# ==========================================
index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace filter-semester with Notion-style multi-select popover
old_sem_block = """                            <div class="filter-group">
                                <label for="filter-semester">סמסטר:</label>
                                <select id="filter-semester" aria-label="סינון לפי סמסטר">
                                    <option value="active" selected>סמסטר נוכחי (ג׳)</option>
                                    <option value="all">כל הסמסטרים</option>
                                    <option value="3">סמסטר ג׳ (נוכחי)</option>
                                    <option value="4">סמסטר ד׳</option>
                                    <option value="1">סמסטר א׳ (הושלם)</option>
                                    <option value="2">סמסטר ב׳ (הושלם)</option>
                                </select>
                            </div>"""

new_sem_block = """                            <!-- Semester Filter Multi-Select Popover -->
                            <div class="filter-group notion-filter-pill-wrapper">
                                <label>סמסטר:</label>
                                <button type="button" class="notion-filter-btn" id="notion-semester-filter-btn" title="סינון משימות לפי סמסטר">
                                    <span id="notion-semester-filter-summary">סמסטר ג׳ (נוכחי)</span>
                                    <span class="dropdown-arrow">▾</span>
                                </button>
                                <select id="filter-semester" style="display: none;" aria-hidden="true">
                                    <option value="active" selected>סמסטר נוכחי (ג׳)</option>
                                    <option value="all">כל הסמסטרים</option>
                                    <option value="3">סמסטר ג׳ (נוכחי)</option>
                                    <option value="4">סמסטר ד׳</option>
                                    <option value="1">סמסטר א׳ (הושלם)</option>
                                    <option value="2">סמסטר ב׳ (הושלם)</option>
                                </select>
                                <div class="notion-filter-popover" id="notion-semester-filter-popover">
                                    <div class="notion-filter-popover-header">
                                        <span>Semester <strong>is</strong> ▾</span>
                                        <span id="notion-semester-select-all" style="color: #38bdf8; font-size: 0.76rem; cursor: pointer;">בחר הכל</span>
                                    </div>
                                    <div class="notion-filter-popover-body">
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-3" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-3" style="pointer-events: none;">סמסטר ג׳ (נוכחי)</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-3" class="notion-filter-cb notion-sem-opt-cb" data-sem="3" checked>
                                        </div>
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-4" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-4" style="pointer-events: none;">סמסטר ד׳</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-4" class="notion-filter-cb notion-sem-opt-cb" data-sem="4">
                                        </div>
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-1" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-1" style="pointer-events: none;">סמסטר א׳ (הושלם)</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-1" class="notion-filter-cb notion-sem-opt-cb" data-sem="1">
                                        </div>
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-2" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-2" style="pointer-events: none;">סמסטר ב׳ (הושלם)</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-2" class="notion-filter-cb notion-sem-opt-cb" data-sem="2">
                                        </div>
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-5" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-5" style="pointer-events: none;">סמסטר ה׳</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-5" class="notion-filter-cb notion-sem-opt-cb" data-sem="5">
                                        </div>
                                        <div class="notion-filter-item-row flat">
                                            <label for="filter-sem-6" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-semester-pill sem-6" style="pointer-events: none;">סמסטר ו׳</span>
                                            </label>
                                            <input type="checkbox" id="filter-sem-6" class="notion-filter-cb notion-sem-opt-cb" data-sem="6">
                                        </div>
                                    </div>
                                </div>
                            </div>"""

if old_sem_block in html:
    html = html.replace(old_sem_block, new_sem_block)
    print("Replaced filter-semester with Notion popover in index.html")
else:
    print("Warning: old_sem_block not found in index.html")

# Replace filter-course with Notion-style multi-select popover
old_course_block = """                            <div class="filter-group">
                                <label for="filter-course">קבוצה (קורס):</label>
                                <select id="filter-course" aria-label="סינון לפי קורס">
                                    <option value="all">הכל (כל הקורסים)</option>
                                </select>
                            </div>"""

new_course_block = """                            <!-- Course Filter Multi-Select Popover -->
                            <div class="filter-group notion-filter-pill-wrapper">
                                <label>קבוצה (קורס):</label>
                                <button type="button" class="notion-filter-btn" id="notion-course-filter-btn" title="סינון משימות לפי קורסים">
                                    <span id="notion-course-filter-summary">הכל (כל הקורסים)</span>
                                    <span class="dropdown-arrow">▾</span>
                                </button>
                                <select id="filter-course" style="display: none;" aria-hidden="true">
                                    <option value="all">הכל (כל הקורסים)</option>
                                </select>
                                <div class="notion-filter-popover" id="notion-course-filter-popover" style="min-width: 280px; max-height: 380px;">
                                    <div class="notion-filter-popover-header">
                                        <span>Course <strong>is</strong> ▾</span>
                                        <span id="notion-course-select-all" style="color: #38bdf8; font-size: 0.76rem; cursor: pointer;">בחר הכל</span>
                                    </div>
                                    <div class="notion-filter-popover-body" id="notion-course-filter-body" style="max-height: 320px; overflow-y: auto;">
                                        <!-- Dynamically populated course checkboxes -->
                                    </div>
                                </div>
                            </div>"""

if old_course_block in html:
    html = html.replace(old_course_block, new_course_block)
    print("Replaced filter-course with Notion popover in index.html")
else:
    print("Warning: old_course_block not found in index.html")

# Update Pangea in Side Peek
old_peek_pangea = """                <!-- Direct Pangea Materials Link -->
                <div class="peek-property-row" id="peek-property-pangea-row" style="display: none;">
                    <span class="peek-property-label">🌍 מאגר פנגיאה (Pangea)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-pangea-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #34d399; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח סיכומים וחומרי עזר בפנגייה ↗
                        </a>
                    </span>
                </div>"""

new_peek_pangea = """                <!-- Direct Pangea Materials Link -->
                <div class="peek-property-row" id="peek-property-pangea-row" style="display: none;">
                    <span class="peek-property-label"><img src="pangea_icon.png" alt="Pangea" style="width: 15px; height: 15px; object-fit: contain; vertical-align: -2px; border-radius: 2px; margin-left: 4px;"> מאגר פנגייה (Pangea)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-pangea-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #34d399; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח סיכומים וחומרי עזר בפנגייה ↗
                        </a>
                    </span>
                </div>"""

if old_peek_pangea in html:
    html = html.replace(old_peek_pangea, new_peek_pangea)
    print("Updated Pangea label & icon in index.html Side Peek")
else:
    print("Warning: old_peek_pangea not found in index.html")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(html)
print("index.html write complete!")
