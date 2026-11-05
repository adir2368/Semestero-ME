import re

with open('curriculum_template.js', 'r', encoding='utf-8') as f:
    content = f.read()

print('114071 in curriculum_template:', '114071' in content)
print('114075 in curriculum_template:', '114075' in content)

for m in re.finditer(r'["\']125013["\']', content):
    start = max(0, m.start() - 20)
    end = min(len(content), m.end() + 100)
    print("Match 125013:", repr(content[start:end]))
