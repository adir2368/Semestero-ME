import sys
sys.stdout.reconfigure(encoding='utf-8')

user_profile_path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\04_Agent_Memory\User_Profile.md"
with open(user_profile_path, "r", encoding="utf-8") as f:
    text = f.read()

status_insight = """
5. **Ontology of 'Submitted' vs. 'Done' Statuses**:
   - **`Submitted` (הוגש)**: The student has delivered their work in Moodle (e.g., uploaded the PDF scan or completed the digital sheet), awaiting final grading or grading validation.
   - **`Done` (הושלם)**: The full lifecycle of the assignment is complete — both parts (digital + written) are handed in, solutions are reviewed, or final grade is recorded.
   - This clear semantic separation directly clarifies why both statuses exist and should be reflected in the progress tracker.
"""

if "Ontology of 'Submitted' vs. 'Done' Statuses" not in text:
    text += "\n" + status_insight
    with open(user_profile_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated User_Profile.md with Submitted vs. Done ontology!")
else:
    print("Already exists in User_Profile.md")
