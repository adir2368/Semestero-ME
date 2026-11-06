import sys
sys.stdout.reconfigure(encoding='utf-8')

user_profile_path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\04_Agent_Memory\User_Profile.md"
with open(user_profile_path, "r", encoding="utf-8") as f:
    text = f.read()

addition = """3. **Task-Specific Drive Reference Deep-Linking**:
   - Instead of linking to the root of the Faculty Drive, automatically resolve and deep-link each task to its specific course folder and subfolder (e.g. `Mechanical Engineering Drive / Semester 3 / 104228 - PDE / Homework References`).
   - Default all external links (Moodle, Drive, Panopto) to open in the external default system browser to preserve pre-authenticated SSO sessions and avoid re-login prompts.
"""

if "Task-Specific Drive Reference Deep-Linking" not in text:
    text += "\n" + addition
    with open(user_profile_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated User_Profile.md successfully!")
