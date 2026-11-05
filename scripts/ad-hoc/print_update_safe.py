with open('scripts/ad-hoc/update_check_logic.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Look for compareVersions or how update is handled
lines = text.split('\n')
for i, line in enumerate(lines[:100]):
    # replace non-ascii for safe printing
    safe_line = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in line)
    print(safe_line)
