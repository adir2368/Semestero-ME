import sys
sys.stdout.reconfigure(encoding='utf-8')

user_profile_path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\04_Agent_Memory\User_Profile.md"
with open(user_profile_path, "r", encoding="utf-8") as f:
    text = f.read()

pairing_note = """
4. **Dual-Component Homework Pairing (Digital + Written Scan)**:
   - In courses like Solid Mechanics (034053 - מכניקת מוצקים), each homework assignment is split into two linked Moodle items:
     - **Component A**: Digital Online Sheet / Quiz (e.g. `HW 1 - Stress Tensor`).
     - **Component B**: Written Solution PDF Upload (e.g. `הגשת פתרון תרגיל בית 1`).
   - Both components share the same sheet number (HW 1).
   - In the Homework Progress & "Best N of M" Tracker, intelligently group/pair these under a single homework entity with sub-status badges (`[ דיגיטלי ]` + `[ פתרון בכתב ]`) so students clearly see when a sheet is partially vs. fully submitted.
"""

if "Dual-Component Homework Pairing" not in text:
    text += "\n" + pairing_note
    with open(user_profile_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated User_Profile.md with dual-component homework pairing!")
else:
    print("Already exists in User_Profile.md")
