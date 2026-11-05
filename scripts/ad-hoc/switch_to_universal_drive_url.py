import re

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace personal adir_moshe link with universal mech_info link
old_url = "https://technionmail-my.sharepoint.com/personal/adir_moshe_campus_technion_ac_il/_layouts/15/onedrive.aspx?listurl=https%3A%2F%2Ftechnionmail-my%2Esharepoint%2Ecom%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments&view=3&id=%2Fpersonal%2Fmech_info_asat_technion_ac_il%2FDocuments%2FMechanical%20Engineering%20Drive&csf=1&web=1&e=jG2HFG&FolderCTID=0x01200020FCF278196BFF4B9D20B38488EBB4E7"
universal_url = "https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx"

text_new = text.replace(old_url, universal_url)
if text != text_new:
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(text_new)
    print("Updated app.js with universal Faculty Drive URL!")
else:
    print("Warning: old_url not found in app.js")

index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    index_text = f.read()

index_text_new = index_text.replace(old_url, universal_url)
if index_text != index_text_new:
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_text_new)
    print("Updated index.html with universal Faculty Drive URL!")
else:
    print("Warning: old_url not found in index.html")
