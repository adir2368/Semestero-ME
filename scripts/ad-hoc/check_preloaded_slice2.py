with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(520, 545):
    print(f"{i+1}: {lines[i]}", end='')
