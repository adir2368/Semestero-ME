import sys

sys.stdout.reconfigure(encoding="utf-8")

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """    let resolvedMoodleUrl = task.moodleUrl || '';
    if (!resolvedMoodleUrl && (task.moodleEventId || task.source === 'moodle')) {
        const evId = task.moodleEventId || (task.id && task.id.startsWith('task_moodle_') ? task.id.split('_')[2] : '');
        if (evId && /^\\d+$/.test(evId)) {
            const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
            resolvedMoodleUrl = `${baseHost}/calendar/event.php?id=${evId}`;
        }
    }"""

replacement = """    let resolvedMoodleUrl = resolveDirectMoodleTaskUrl(course.code, task);"""

if target in text:
    text = text.replace(target, replacement)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("openTaskSidePeek resolvedMoodleUrl updated successfully!")
else:
    print("target not found")
