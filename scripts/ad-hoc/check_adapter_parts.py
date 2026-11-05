with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'interface OnCarouselActionListener' in line or 'bindSync' in line:
        for j in range(max(0, i-2), min(len(lines), i+30)):
            safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in lines[j])
            print(f"{j+1}: {safe}", end='')
        print('\n---')
