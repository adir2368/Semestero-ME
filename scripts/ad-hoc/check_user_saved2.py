with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(71, 95):
    print(f"{i+1}: {lines[i].strip()}")
