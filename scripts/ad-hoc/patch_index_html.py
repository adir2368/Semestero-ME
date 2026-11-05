import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add filter-semester right after filter-course
old_course_filter = '''                            <div class="filter-group">
                                <label for="filter-course">קבוצה (קורס):</label>
                                <select id="filter-course">
                                    <option value="all">הכל (All Courses)</option>
                                </select>
                            </div>'''

new_course_and_sem_filter = '''                            <div class="filter-group">
                                <label for="filter-course">קבוצה (קורס):</label>
                                <select id="filter-course">
                                    <option value="all">הכל (All Courses)</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filter-semester">סמסטר:</label>
                                <select id="filter-semester" aria-label="סינון לפי סמסטר">
                                    <option value="active" selected>סמסטר נוכחי (ג׳)</option>
                                    <option value="all">כל הסמסטרים</option>
                                    <option value="3">סמסטר ג׳ (נוכחי)</option>
                                    <option value="4">סמסטר ד׳</option>
                                    <option value="1">סמסטר א׳ (הושלם)</option>
                                    <option value="2">סמסטר ב׳ (הושלם)</option>
                                </select>
                            </div>'''

assert old_course_filter in content, "old_course_filter not found in index.html"
content = content.replace(old_course_filter, new_course_and_sem_filter, 1)

# 2. Replace single select filter-type with multi-select popover + focus button
old_type_filter = '''                            <div class="filter-group">
                                <label for="filter-type">סוג:</label>
                                <select id="filter-type">
                                    <option value="all">הכל (All)</option>
                                    <option value="hw">📜 שיעורי בית / גיליונות</option>
                                    <option value="project">🛡️ עבודה / פרויקט</option>
                                    <option value="exam">📝 מבחן סוף</option>
                                </select>
                            </div>'''

new_type_and_focus = '''                            <div class="filter-group notion-filter-pill-wrapper">
                                <label>סוג:</label>
                                <button type="button" class="notion-filter-btn" id="notion-type-filter-btn">
                                    <span id="notion-type-filter-summary">הכל (3)</span>
                                    <span class="dropdown-arrow">▾</span>
                                </button>
                                <!-- Notion Type Filter Popover -->
                                <div class="notion-filter-popover" id="notion-type-filter-popover">
                                    <div class="notion-filter-popover-header">
                                        <span>Type <strong>is</strong> ▾</span>
                                    </div>
                                    <div class="notion-filter-popover-body">
                                        <div class="notion-filter-item-row flat" data-type="hw">
                                            <label for="filter-opt-type-hw" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-status-pill in_progress" style="pointer-events: none;">📜 שיעורי בית / גיליונות</span>
                                            </label>
                                            <input type="checkbox" id="filter-opt-type-hw" class="notion-filter-cb notion-filter-type-cb" data-type="hw" checked>
                                        </div>
                                        <div class="notion-filter-item-row flat" data-type="project">
                                            <label for="filter-opt-type-project" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-status-pill done" style="pointer-events: none;">🛡️ עבודה / פרויקט</span>
                                            </label>
                                            <input type="checkbox" id="filter-opt-type-project" class="notion-filter-cb notion-filter-type-cb" data-type="project" checked>
                                        </div>
                                        <div class="notion-filter-item-row flat" data-type="exam">
                                            <label for="filter-opt-type-exam" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                                <span class="notion-status-pill late" style="pointer-events: none;">📝 מבחן סוף</span>
                                            </label>
                                            <input type="checkbox" id="filter-opt-type-exam" class="notion-filter-cb notion-filter-type-cb" data-type="exam" checked>
                                        </div>
                                    </div>
                                    <div class="notion-filter-popover-footer">
                                        <button type="button" class="notion-filter-clear-btn" id="notion-type-filter-clear-btn">נקה הכל</button>
                                    </div>
                                </div>
                            </div>
                            <!-- Next-Action Focus Mode Toggle Button -->
                            <div class="filter-group">
                                <button type="button" class="notion-focus-toggle-btn active" id="notion-focus-toggle-btn" title="הצג רק את המשימה הרלוונטית הבאה מכל סוג">
                                    <span class="focus-icon">🎯</span>
                                    <span class="focus-label">משימה רלוונטית בלבד</span>
                                </button>
                            </div>'''

assert old_type_filter in content, "old_type_filter not found in index.html"
content = content.replace(old_type_filter, new_type_and_focus, 1)

# 3. Add Semester column header in table
old_table_headers = '''                                    <th>משימה (Task)</th>
                                    <th>קורס (Course)</th>
                                    <th style="width: 150px;">תאריך הגשה (Due Date)</th>'''

new_table_headers = '''                                    <th>משימה (Task)</th>
                                    <th>קורס (Course)</th>
                                    <th style="width: 105px;">סמסטר (Semester)</th>
                                    <th style="width: 150px;">תאריך הגשה (Due Date)</th>'''

assert old_table_headers in content, "old_table_headers not found in index.html"
content = content.replace(old_table_headers, new_table_headers, 1)

# 4. Add Pangea Link row in Side Peek modal
old_peek_moodle = '''                <!-- Direct Moodle Assignment Link -->
                <div class="peek-property-row" id="peek-property-moodle-row" style="display: none;">
                    <span class="peek-property-label">🎓 הגשה במודל (Moodle)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-moodle-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח דף הגשה במודל ↗
                        </a>
                    </span>
                </div>'''

new_peek_moodle_and_pangea = '''                <!-- Direct Moodle Assignment Link -->
                <div class="peek-property-row" id="peek-property-moodle-row" style="display: none;">
                    <span class="peek-property-label">🎓 הגשה במודל (Moodle)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-moodle-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח דף הגשה במודל ↗
                        </a>
                    </span>
                </div>
                <!-- Direct Pangea Materials Link -->
                <div class="peek-property-row" id="peek-property-pangea-row" style="display: none;">
                    <span class="peek-property-label">🌍 מאגר פנגיאה (Pangea)</span>
                    <span class="peek-property-value">
                        <a id="peek-property-pangea-link" href="#" target="_blank" rel="noopener noreferrer" style="color: #34d399; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem;">
                            פתח סיכומים וחומרי עזר בפנגייה ↗
                        </a>
                    </span>
                </div>'''

assert old_peek_moodle in content, "old_peek_moodle not found in index.html"
content = content.replace(old_peek_moodle, new_peek_moodle_and_pangea, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html patched successfully!")
