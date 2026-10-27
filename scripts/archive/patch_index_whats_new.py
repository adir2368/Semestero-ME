fp = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update display-system-version
content = content.replace(
    'id="display-system-version">v2.7.0</span>',
    'id="display-system-version">v2.7.3</span>',
    1
)

# 2. Update app-version-badge
content = content.replace(
    'color: #38bdf8;">גרסה אחרונה v2.5.2</span>',
    'color: #38bdf8;">גרסה אחרונה v2.7.3</span>',
    1
)

# 3. Update What's New top item
old_whats_new = """                    <ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">
                        <li><strong>v2.6.9 (26/10/2026):</strong> v2.6.9 - Task Deduplication Engine, Refresh Stale Information Overwrite & Multi-Course Merge</li>
                    </ul>"""

new_whats_new = """                    <ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">
                        <li><strong>v2.7.3 (27/10/2026):</strong> טיהור מלא של קורסי הספורט מסמסטר 4, תיקון פתיחת חלונית פרטי קורס לספורט ומל״ג (escapeHtml), סנכרון הרמטי לענן Supabase ומניעת מטמון שגוי.</li>
                    </ul>"""

assert old_whats_new in content, "old_whats_new not found in index.html"
content = content.replace(old_whats_new, new_whats_new, 1)

with open(fp, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated index.html with v2.7.3 display and changelog!")
