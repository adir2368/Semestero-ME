with open('scripts/ad-hoc/wear_sched_snippet.txt', 'r', encoding='utf-8') as f:
    text = f.read()

for line in text.split('\n'):
    safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in line)
    print(safe)
