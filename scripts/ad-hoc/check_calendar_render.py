with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'function renderFinalsCalendar' in line or 'renderFinalsCalendar = ' in line:
        for j in range(i, min(len(lines), i + 80)):
            safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in lines[j])
            print(f"{j+1}: {safe}", end='')
        break
