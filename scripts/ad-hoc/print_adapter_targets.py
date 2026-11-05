with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'private void bindSync' in line:
        for j in range(i, i+25):
            print(lines[j], end='')
    if 'public static class SyncViewHolder' in line:
        for j in range(i, min(len(lines), i+20)):
            print(lines[j], end='')
