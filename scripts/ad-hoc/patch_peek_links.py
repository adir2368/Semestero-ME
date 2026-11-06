app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

old_moodle_peek = """    if (moodleRow && moodleLink) {
        if (resolvedMoodleUrl) {
            moodleRow.style.display = "grid";
            moodleLink.href = resolvedMoodleUrl;
        } else {
            moodleRow.style.display = "none";
        }
    }"""

new_moodle_peek = """    if (moodleRow && moodleLink) {
        if (resolvedMoodleUrl) {
            moodleRow.style.display = "grid";
            moodleLink.href = resolvedMoodleUrl;
            moodleLink.onclick = function(e) {
                if (window.openExternalUrlOrBrowser) {
                    window.openExternalUrlOrBrowser(resolvedMoodleUrl);
                    e.preventDefault();
                }
            };
        } else {
            moodleRow.style.display = "none";
        }
    }"""

assert old_moodle_peek in text, "old_moodle_peek not found"
text = text.replace(old_moodle_peek, new_moodle_peek, 1)

old_pangea_peek = """    if (pangeaRow && pangeaLink) {
        if (resolvedPangeaUrl) {
            pangeaRow.style.display = "grid";
            pangeaLink.href = resolvedPangeaUrl;
        } else {
            pangeaRow.style.display = "none";
        }
    }"""

new_pangea_peek = """    if (pangeaRow && pangeaLink) {
        if (resolvedPangeaUrl) {
            pangeaRow.style.display = "grid";
            pangeaLink.href = resolvedPangeaUrl;
            pangeaLink.onclick = function(e) {
                if (window.openExternalUrlOrBrowser) {
                    window.openExternalUrlOrBrowser(resolvedPangeaUrl);
                    e.preventDefault();
                }
            };
        } else {
            pangeaRow.style.display = "none";
        }
    }"""

assert old_pangea_peek in text, "old_pangea_peek not found"
text = text.replace(old_pangea_peek, new_pangea_peek, 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated Side Peek moodle and pangea onclick handlers!")
