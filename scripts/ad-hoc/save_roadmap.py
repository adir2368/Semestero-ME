import sys
sys.stdout.reconfigure(encoding='utf-8')

user_profile_path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\04_Agent_Memory\User_Profile.md"
with open(user_profile_path, "r", encoding="utf-8") as f:
    text = f.read()

roadmap_entry = """

## 🎯 Planned Features for v2.10.4 (Upcoming Sprint)
1. **External Browser Dispatch for Moodle 26**:
   - Route Moodle links via `window.openExternalUrlOrBrowser` and Electron `mainWindow.webContents.setWindowOpenHandler(shell.openExternal)` so links open in default desktop/mobile browser where Technion SSO session is active.
2. **Homework Submission Requirements & "Best N of M" Progress Tracker**:
   - Track policy requirements (e.g., 12 homework sheets total, but only best 10 graded).
   - Display progress, submitted count, target count, and drop-lowest calculations.
   - **Architectural Decision Pending User Review**: Determine optimal UI placement (Course Details Modal vs. Notion Tasks Board tab vs. Side Peek panel).
   - Prepare interactive visual mockup/preview first before implementing changes.
"""

if "Planned Features for v2.10.4" not in text:
    text += roadmap_entry
    with open(user_profile_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Saved to User_Profile.md successfully!")
else:
    print("Already in User_Profile.md")
