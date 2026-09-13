import json

js_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
save_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json"

with open(save_path, 'r', encoding='utf-8') as f:
    saved_state = json.load(f)

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

target_marker = "// Load state from local storage\nfunction loadSavedState() {"

preloaded_var = "const PRELOADED_USER_STATE = " + json.dumps(saved_state, ensure_ascii=False, indent=2) + ";\n\n"

replacement_func = preloaded_var + """// Load state from local storage
function loadSavedState() {
    const saved = localStorage.getItem("academic_skill_tree_save");
    let needsRestoreFromPreload = false;

    if (saved) {
        try {
            gameState = JSON.parse(saved);
            // If the saved state is empty or an initial empty state (0 credits and 0 completed), upgrade to user's saved progress
            if (!gameState.courses || Object.keys(gameState.courses).length === 0 || (gameState.credits === 0 && gameState.completedCourses === 0)) {
                needsRestoreFromPreload = true;
            } else {
                // Ensure all tasks under already mastered courses are marked completed
                Object.values(gameState.courses).forEach(course => {
                    if (course.status === 'mastered' && course.tasks) {
                        course.tasks.forEach(task => {
                            task.completed = true;
                            task.status = 'done';
                        });
                    }
                });
            }
        } catch (e) {
            console.error("Error loading save file, loading user preloaded progress", e);
            needsRestoreFromPreload = true;
        }
    } else {
        needsRestoreFromPreload = true;
    }

    if (needsRestoreFromPreload) {
        console.log("Restoring user's website progress into local storage...");
        gameState = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
        recalculateCourseStates();
        saveState();
    }
}"""

# Find the start of function loadSavedState()
start_idx = js.find("// Load state from local storage\nfunction loadSavedState() {")
if start_idx == -1:
    start_idx = js.find("function loadSavedState() {")

end_idx = js.find("// Save state to local storage", start_idx)

if start_idx != -1 and end_idx != -1:
    js = js[:start_idx] + replacement_func + "\n\n" + js[end_idx:]
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully updated app.js with PRELOADED_USER_STATE and loadSavedState logic.")
else:
    print("Could not find start/end bounds for loadSavedState in app.js!")
