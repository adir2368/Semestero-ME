import os

entry = """

## 2026-11-05 - ADR: Notion Tasks Board Overhaul, Next-Action Focus, Pangea Deep-Linking & Moodle Conflict Guard (v2.10.2)

### Context & Problem
1. **Cognitive Load on Tasks Board**:
   - The Notion tasks board was displaying all future exercises simultaneously (e.g. Homework 1, 2, 3...) as well as past homework from mastered semesters 1 and 2, cluttering the board.
   - The user requested sequential gating ("Next-Action Focus" / משימה רלוונטית בלבד) to display only the single immediate relevant uncompleted assignment in any sequence.
   - The existing type filter was a single-select `<select>`, preventing arbitrary combinations (e.g. Homework + Projects without Exams).
   - Tasks lacked an explicit Semester column and default active semester filter.
2. **Pangea (Fangia) Deep-Linking**:
   - The user requested direct linking from each task to relevant study materials (lecture notes, summaries, formula sheets, tutorial sheets) on Pangea (`https://idofangbentov.uk/Technion/...`).
3. **Moodle Submission Direct Routing & Conflict Safeguard**:
   - Clicking "הגשה במודל" previously defaulted to the monthly calendar view (`/calendar/view.php?view=month`) rather than the direct assignment activity (`/mod/scorm/...`, `/mod/assign/...`) or focused event card (`/calendar/event.php?id=...`).
   - PDE 104228 Homework 1 ("תרגיל אלקטרוני 1 - סיווג מד״ח", due 2026-11-09 23:59) is hosted as a SCORM module (`id=95378`).
   - Tasks completed or in progress in Moodle needed automated state mapping (`submitted`/`done`, `in_progress`), while manual completions of unconfirmed Moodle/Miluim tasks in Semestero required a verification guard modal to avoid accidental dismissals vs legitimate non-reservist dismissals.
   - Deleted tasks must stay permanently deleted across subsequent syncs (`gameState.deletedTaskIds` and `dismissedTaskRegistry`).

### Decision & Implementation
- **Sequential Task Gating & Multi-Select Type Filter**:
  - Implemented `#notion-focus-toggle-btn` ("🎯 משימה רלוונטית בלבד") in `app.js` using `uncompletedSeqSeen` dictionary per `(courseCode, normalizedCategory)`.
  - Replaced `<select id="filter-type">` with a Notion-style multi-select popover `#notion-type-filter-popover` supporting arbitrary combinations (`hw`, `project`, `exam`).
  - Added dedicated `סמסטר` (Semester) column with color-coded semester pills (`.notion-semester-pill.sem-3`, etc.) and filtered to active semester by default.
- **Pangea Deep-Linking Engine**:
  - Built `getPangeaTaskUrl(courseCode, task)` dynamically routing tasks to exact subfolders (`/סיכומים`, `/תרגולים`, `/מבחנים`, `/נוסחאות`) or root course page across all 34 catalog courses.
  - Added emerald badge (`.notion-pangea-link-btn`) to every table row and Side Peek drawer property row.
- **Moodle Direct Submission & SCORM Integration**:
  - Updated direct links to point straight to the module `/mod/scorm/...` or focused `/calendar/event.php?id=...`.
  - Integrated PDE 104228 SCORM activity (`https://moodle26.technion.ac.il/mod/scorm/view.php?id=95378`).
  - Implemented `showTaskCompletionVerificationModal` and guaranteed permanent deletion via `gameState.deletedTaskIds` and `moodle_sync.js`.
- **System Verification & Release Delivery**:
  - Bumped version to `2.10.2` (code 56) across `package.json`, `app.js`, `index.html`, `sw.js`, and Android Gradle manifests.
  - Automated test suite passed 11/11 tests. Pushed to `origin/main`, packaged Electron desktop (`dist/Semestero ME-win32-x64`), and built `Semestero-ME.apk` and `wear-debug.apk`.
"""

path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\05_MOC\MOC_Atlas_ME.md"
with open(path, "a", encoding="utf-8") as f:
    f.write(entry)

print("Obsidian Second Brain updated successfully!")
