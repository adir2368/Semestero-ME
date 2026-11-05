import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\moodle_sync.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's see all places where moodleUrl is set or extracted
import re
print("Matches in moodle_sync.js:")
for m in re.finditer(r'moodleUrl\s*=', text):
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 150)
    print("---")
    print(text[start:end])
