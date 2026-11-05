import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")

drive_path = r"C:\Users\user\OneDrive - Technion\Mechanichal Info TSA's files - Mechanical Engineering Drive"

paths = [
    os.path.join(drive_path, "Read me.docx"),
    os.path.join(drive_path, "General Drive", "הסבר על הדרייב - 2026.docx")
]

for p in paths:
    if os.path.exists(p):
        print(f"\n=== {os.path.basename(p)} ===")
        try:
            with zipfile.ZipFile(p) as z:
                xml_content = z.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                texts = [node.text for node in tree.iter() if node.text]
                full_text = " ".join(texts)
                print(full_text[:1200])
        except Exception as e:
            print("Error:", e)
    else:
        print(f"Path does not exist: {p}")
