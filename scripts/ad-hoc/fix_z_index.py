import re

css_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\styles.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. .peek-overlay z-index: 999 -> 100040
css_new = re.sub(
    r'(\.peek-overlay\s*\{[^}]*?)z-index:\s*999;',
    r'\1z-index: 100040;',
    css
)

# 2. .task-side-peek z-index: 1000 -> 100050
css_new = re.sub(
    r'(\.task-side-peek\s*\{[^}]*?)z-index:\s*1000;',
    r'\1z-index: 100050;',
    css_new
)

# 3. .notion-status-dropdown-menu z-index: 9999 -> 200000 !important
css_new = re.sub(
    r'(\.notion-status-dropdown-menu\s*\{[^}]*?)z-index:\s*9999;',
    r'\1z-index: 200000 !important;',
    css_new
)

# 4. .notion-filter-popover z-index: 3000 -> 200000 !important
css_new = re.sub(
    r'(\.notion-filter-popover\s*\{[^}]*?)z-index:\s*3000;',
    r'\1z-index: 200000 !important;',
    css_new
)

if css != css_new:
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css_new)
    print("styles.css z-index hierarchy updated successfully!")
else:
    print("Warning: No changes made to styles.css z-index")
