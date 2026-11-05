with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = "if (course.status === 'locked') return; // Only active and enrolled courses on the calendar!"
replacement = "if (course.status === 'locked' || course.status === 'mastered') return; // Only active and enrolled courses on the calendar!"

assert target in text, "Target not found in app.js"
text = text.replace(target, replacement)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Line 22086 in app.js updated successfully!")
