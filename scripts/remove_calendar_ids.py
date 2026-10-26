with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'const defaultCals = isAdirSettings ? {' in line:
        new_lines.append("    const defaultCals = {\n")
        new_lines.append("        exams: (gameState.calendarIds && gameState.calendarIds.exams) || (isAdirSettings ? (localStorage.getItem('ast_cal_exams') || '') : ''),\n")
        new_lines.append("        hw: (gameState.calendarIds && gameState.calendarIds.hw) || (isAdirSettings ? (localStorage.getItem('ast_cal_hw') || '') : ''),\n")
        new_lines.append("        practice: (gameState.calendarIds && gameState.calendarIds.practice) || (isAdirSettings ? (localStorage.getItem('ast_cal_practice') || '') : '')\n")
        new_lines.append("    };\n")
        skip = True
        continue
    if skip:
        if line.strip() == '};':
            skip = False
        continue
    new_lines.append(line)

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Calendar IDs removed from app.js successfully.")
