with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scripts/ad-hoc/update_check_logic.txt', 'w', encoding='utf-8') as out:
    for i in range(24480, min(len(lines), 24650)):
        out.write(f"{i+1}: {lines[i]}")
print('Wrote update logic')
