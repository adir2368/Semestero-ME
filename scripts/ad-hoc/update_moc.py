import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain\05_MOC\MOC_Atlas_ME.md'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = "- [[ADR-072-Flowchart-Tree-Purity-Physics-Variant-Suppression-and-Chemistry-Lab-Lock]]: Flowchart Course Tree Purity & Chemistry Lab Lock"
new_entry = """- [[ADR-072-Flowchart-Tree-Purity-Physics-Variant-Suppression-and-Chemistry-Lab-Lock]]: Flowchart Course Tree Purity & Chemistry Lab Lock
- [[ADR-073-Watch-Test-Notification-Button-and-Schedule-Disentanglement]]: Watch Test Notification Button, Complication Abbreviations, CheeseFork Tutorial Disentanglement, and v2.10.0 Release Promotion"""

if target in text and "ADR-073" not in text:
    text = text.replace(target, new_entry)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Updated MOC_Atlas_ME.md with ADR-073")
else:
    print("Already updated or target not found")
