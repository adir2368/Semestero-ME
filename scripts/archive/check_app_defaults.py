import re, json

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Check guest initialization and default gameState
print("--- Checking default gameState / guest in app.js ---")
m = re.findall(r'(defaultUserState|initialUserState|createDefaultState|guestState|initGuest)[^=]*=\s*(\{[^;]+\});', app_text)
for name, body in m:
    print("Found:", name)

# Search for any hardcoded courses in default states
m_courses = re.findall(r'courses:\s*\{([^}]+)\}', app_text[:30000])
for c in m_courses:
    print("courses snippet:", c[:200])

# Search for 0324 or 0394 in app.js
sports_in_app = re.findall(r'[\'"](0394\d{4}|0324\d{4})[\'"]', app_text)
print("Sports / Malag in app.js:", set(sports_in_app))
