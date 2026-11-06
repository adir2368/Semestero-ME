app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

old_btn = '<a href="${directMoodleUrl}" target="_blank" rel="noopener noreferrer" id="btn-check-task-moodle" style="background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.45); padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; text-decoration: none; transition: all 0.15s ease;">'
new_btn = '<a href="${directMoodleUrl}" target="_blank" rel="noopener noreferrer" id="btn-check-task-moodle" onclick="if (window.openExternalUrlOrBrowser) { window.openExternalUrlOrBrowser(\'${directMoodleUrl}\'); event.preventDefault(); }" style="background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.45); padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; text-decoration: none; transition: all 0.15s ease;">'

assert old_btn in text, "old_btn not found"
text = text.replace(old_btn, new_btn, 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated verification modal check button to use openExternalUrlOrBrowser!")
