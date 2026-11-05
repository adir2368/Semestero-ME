with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        // 1. Status Filter (Multi-select)
        const currentTaskStatus = t.status || 'not_started';
        if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(currentTaskStatus)) {
            return false;
        }'''

replacement = '''        // 1. Status Filter (Multi-select)
        let currentTaskStatus = t.status || 'not_started';
        if (currentTaskStatus === 'todo' || currentTaskStatus === 'pending') {
            currentTaskStatus = 'not_started';
        }
        if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(currentTaskStatus)) {
            return false;
        }'''

assert target in content, "target not found in app.js"
content = content.replace(target, replacement, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed status normalization in app.js successfully!")
