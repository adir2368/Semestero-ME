import sys
sys.stdout.reconfigure(encoding='utf-8')

sync_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\moodle_sync.js"
with open(sync_path, "r", encoding="utf-8") as f:
    text = f.read()

old_block = """                // Extract URL if available
                let moodleUrl = '';
                const urlMatch = block.match(/URL(?:;[^:]+)?:([^\\r\\n]+)/i);
                if (urlMatch && urlMatch[1].trim().startsWith('http')) {
                    moodleUrl = urlMatch[1].trim();
                } else {
                    const descMatch = block.match(/DESCRIPTION:([^\\r\\n]+)/i);
                    const descUrlMatch = (descMatch ? descMatch[1] : block).match(/https?:\\/\\/[^\\s"<>]+/i);
                    if (descUrlMatch) {
                        moodleUrl = descUrlMatch[0];
                    } else if (eventId && /^\\d+$/.test(eventId)) {
                        const host = (this.config.url && this.config.url.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
                        moodleUrl = `${host}/calendar/view.php?view=event&id=${eventId}`;
                    }
                }"""

new_block = """                // Extract URL if available (prioritize direct activity links over calendar redirects)
                let moodleUrl = '';
                const directModMatch = block.match(/https?:\\/\\/[^\\s"<>\\'\\\\]*moodle\\d*\\.technion\\.ac\\.il\\/mod\\/[a-z]+\\/view\\.php\\?id=\\d+/i);
                if (directModMatch) {
                    moodleUrl = directModMatch[0];
                } else {
                    const urlMatch = block.match(/URL(?:;[^:]+)?:([^\\r\\n]+)/i);
                    if (urlMatch && urlMatch[1].trim().startsWith('http') && !urlMatch[1].includes('/calendar/')) {
                        moodleUrl = urlMatch[1].trim();
                    } else {
                        const descMatch = block.match(/DESCRIPTION:([^\\r\\n]+)/i);
                        const descUrlMatch = (descMatch ? descMatch[1] : block).match(/https?:\\/\\/[^\\s"<>]+/i);
                        if (descUrlMatch && !descUrlMatch[0].includes('/calendar/')) {
                            moodleUrl = descUrlMatch[0];
                        }
                    }
                }"""

assert old_block in text, "old_block not found in moodle_sync.js"
text = text.replace(old_block, new_block, 1)

with open(sync_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully patched moodle_sync.js to reject calendar links and prioritize direct mod/ activities!")
