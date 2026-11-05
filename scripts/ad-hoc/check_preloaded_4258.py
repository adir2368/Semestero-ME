with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4245, 4280):
    print(f"{i+1}: {lines[i]}", end='')
