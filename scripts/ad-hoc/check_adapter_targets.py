with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("Found btnTriggerSync in bindSync:", "h.btnTriggerSync.setOnClickListener" in text)
print("Found SyncViewHolder:", "class SyncViewHolder" in text)
