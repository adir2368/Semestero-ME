import sys

sys.stdout.reconfigure(encoding="utf-8")

index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

target = '<div class="filter-group">\n                                <label for="filter-course">קבוצה (קורס):</label>\n                                <select id="filter-course">\n                                    <option value="all">הכל (All Courses)</option>\n                                </select>\n                            </div>'

replacement = """<!-- Course Filter Multi-Select Popover -->
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

if target in html:
    html = html.replace(target, replacement)
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Replaced filter-course with Notion popover in index.html successfully!")
else:
    print("target not found")
