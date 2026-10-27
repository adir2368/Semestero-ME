import subprocess
import sys

# Test app.js and planner_module.js with node --check
try:
    subprocess.run(['node', '--check', 'app.js'], check=True, cwd=r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree')
    print("app.js syntax check passed!")
except Exception as e:
    print("app.js syntax error:", e)
    sys.exit(1)

try:
    subprocess.run(['node', '--check', 'planner_module.js'], check=True, cwd=r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree')
    print("planner_module.js syntax check passed!")
except Exception as e:
    print("planner_module.js syntax error:", e)
    sys.exit(1)
