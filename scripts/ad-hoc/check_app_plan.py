with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(7050, 7120):
    if 'degreePlan' in lines[i] or 'plan' in lines[i] or '{' in lines[i] and 'title' in lines[i]:
        print(f"{i+1}: {lines[i].strip()[:100]}")
