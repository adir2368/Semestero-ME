import json

p = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json"
with open(p, "r", encoding="utf-8") as f:
    d = json.load(f)

d["scripts"]["build:ios"] = "node scripts/build_mobile_dist.js && npx cap sync ios"
d["scripts"]["build:all"] = "node scripts/build_mobile_dist.js && npx cap sync"
d["scripts"]["open:ios"] = "npx cap open ios"

with open(p, "w", encoding="utf-8") as f:
    json.dump(d, f, indent=2)

print("Updated package.json successfully!")
