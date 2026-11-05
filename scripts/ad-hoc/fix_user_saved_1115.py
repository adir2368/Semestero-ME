with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    text = f.read()

count_before = text.count('2026-11-15')
text = text.replace('"2026-11-15"', '"2026-08-05"')
count_after = text.count('2026-11-15')

with open('user_saved_state.json', 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Sanitized user_saved_state.json: {count_before} occurrences of 2026-11-15 replaced with 2026-08-05 (remaining: {count_after})")
