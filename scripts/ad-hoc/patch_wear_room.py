import sys, re
sys.stdout.reconfigure(encoding='utf-8')

fpath = 'C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java'
with open(fpath, 'r', encoding='utf-8') as f:
    text = f.read()

text_new = text.replace('cs.room.startsWith("חדר") ? cs.room : "חדר " + cs.room', 'formatRoom(cs.room)')
text_new = text_new.replace('activeSlot.room.startsWith("חדר") ? activeSlot.room : "חדר " + activeSlot.room', 'formatRoom(activeSlot.room)')
text_new = text_new.replace('upcomingSlot.room.startsWith("חדר") ? upcomingSlot.room : "חדר " + upcomingSlot.room', 'formatRoom(upcomingSlot.room)')
text_new = text_new.replace('nextDaySlot.room.startsWith("חדר") ? nextDaySlot.room : "חדר " + nextDaySlot.room', 'formatRoom(nextDaySlot.room)')
text_new = text_new.replace('res.roomText = "חדר חופשי";', 'res.roomText = "יום חופשי";')

helper_method = """
    public static String formatRoom(String room) {
        if (room == null || room.trim().isEmpty()) return "";
        String r = room.trim();
        if (r.startsWith("חדר:") || r.startsWith("חדר ")) {
            if (!r.contains("כושר")) {
                r = r.replaceFirst("^חדר[:\\\\s]+", "").trim();
            }
        }
        return r;
    }
}
"""

text_new = re.sub(r'\n\}\s*$', helper_method, text_new)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(text_new)

print('Updated WearScheduleHelper.java successfully!')
