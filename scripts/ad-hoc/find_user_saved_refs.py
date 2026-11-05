import os

exclude = {'.git', 'node_modules', 'android', 'dist', '.gradle', 'build'}
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude]
    for f in files:
        p = os.path.join(root, f)
        try:
            with open(p, 'r', encoding='utf-8') as fl:
                content = fl.read()
                if 'user_saved_state.json' in content:
                    print(f"{p}: references user_saved_state.json")
        except:
            pass
