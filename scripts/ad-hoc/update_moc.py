moc_path = r"C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\05_MOC\MOC_Atlas_ME.md"
with open(moc_path, "r", encoding="utf-8") as f:
    text = f.read()

target = "## 🚀 Chronological Development Sprints & Logs\n\n### November 3, 2026"
replacement = "## 🚀 Chronological Development Sprints & Logs\n\n### November 5, 2026\n- [[04_Agent_Memory/Session_Logs/2026-11-05_v2.10.3_Notion_Filters_Z_Index_Fix_Pangea_Branding_And_Direct_Moodle|v2.10.3 Notion Multi-Select Filters, Z-Index Bleedthrough Fix, Pangea Branding & Direct Moodle Routing]]\n\n### November 3, 2026"

if target not in text:
    target = target.replace("\n", "\r\n")
    replacement = replacement.replace("\n", "\r\n")

assert target in text, "Target not found in MOC_Atlas_ME.md"
text = text.replace(target, replacement, 1)

with open(moc_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated MOC_Atlas_ME.md successfully!")
