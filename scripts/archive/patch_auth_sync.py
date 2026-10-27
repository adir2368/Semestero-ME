import re

fp = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\auth_sync.js"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

sanitize_func = """    // Inbound state sanitization against accidental test infiltrators
    function sanitizeInboundState(state) {
        if (!state) return state;
        const targets = [
            '03240269', '3240269',
            '03940800', '3940800', '0394800', '394800',
            '03940808', '3940808', '0394808', '394808'
        ];
        if (state.courses) {
            targets.forEach(t => {
                const c = state.courses[t];
                if (c && !c.grade && (c.semester === 4 || !c.semester)) {
                    delete state.courses[t];
                }
            });
        }
        if (Array.isArray(state.degreePlan)) {
            state.degreePlan.forEach(s => {
                if (s && s.semester === 4 && Array.isArray(s.courses)) {
                    s.courses = s.courses.filter(c => {
                        if (!c) return false;
                        const code = String(c.code || '');
                        const alt = String(c.altCode || '');
                        if (targets.includes(code) || targets.includes(alt)) return false;
                        if (c.type === 'sports' || c.list === 'SPORTS') return false;
                        if (code.startsWith('0394') || code.startsWith('394')) return false;
                        if (code.startsWith('0324') || code.startsWith('324')) return false;
                        return true;
                    });
                }
            });
        }
        return state;
    }
"""

if "function sanitizeInboundState" not in content:
    content = content.replace(
        "function isCapacitorOrNative() {",
        sanitize_func + "\n    function isCapacitorOrNative() {",
        1
    )

# Sanitize in loadActiveUserState
content = re.sub(
    r"const parsed = JSON\.parse\(saved\);",
    "let parsed = JSON.parse(saved);\n                    parsed = sanitizeInboundState(parsed);",
    content,
    count=1
)

# Sanitize in setupRealtimeSubscription
content = re.sub(
    r"const remoteState = payload\.new\.state_json;",
    "const remoteState = sanitizeInboundState(payload.new.state_json);",
    content,
    count=1
)

# Sanitize in pullLatestStateFromCloud
content = re.sub(
    r"const remoteState = data\.state_json;",
    "const remoteState = sanitizeInboundState(data.state_json);",
    content,
    count=1
)

with open(fp, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched auth_sync.js with inbound state sanitization!")
