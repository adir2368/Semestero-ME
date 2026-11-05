with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(94, 115):
    print(f"{i+1}: {lines[i].strip()}")
