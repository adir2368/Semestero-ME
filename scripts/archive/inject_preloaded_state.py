import json
import re

js_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
save_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json"

with open(save_path, 'r', encoding='utf-8') as f:
    saved_state = json.load(f)

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Create JS definition of PRELOADED_USER_STATE
preloaded_code = "const PRELOADED_USER_STATE = " + json.dumps(saved_state, ensure_ascii=False, indent=2) + ";\n\n"

# Put PRELOADED_USER_STATE right before loadSavedState
target_load_func = "// Load state on startup\nfunction loadSavedState() {"

replacement_load_func = preloaded_code + """// Load state on startup
function loadSavedState() {
    let saved = localStorage.getItem("academic_skill_tree_save");
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading state from localStorage:", e);
            gameState = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
        }
    } else {
        // Automatically initialize with user's saved progress from the website
        console.log("No existing localStorage found. Preloading saved degree progress!");
        gameState = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
        try {
            localStorage.setItem("academic_skill_tree_save", JSON.stringify(gameState));
        } catch (err) {
            console.warn("Could not write to localStorage:", err);
        }
    }"""

if target_load_func in js:
    js = js.replace(target_load_func, replacement_load_func, 1)
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully injected PRELOADED_USER_STATE into app.js!")
else:
    print("Could not find target_load_func in app.js")
