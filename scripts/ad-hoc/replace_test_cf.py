with open('tests/cheesefork_precision_sync.test.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_comp_block = [
    '    // Verify Sunday has NO Computing lecture (Sunday only has PDE tutorial 11:30 - 13:30)\n',
    "    const sundayComp = tt.days[0].classes.find(c => c.courseId.includes('34056'));\n",
    '    assert.strictEqual(sundayComp, undefined, "Sunday must not have Computing lecture");\n',
    '\n',
    '    // Verify Wednesday HAS Computing Lecture 10 (14:30 - 17:30)\n',
    "    const wednesdayComp = tt.days[3].classes.find(c => c.courseId.includes('34056') && c.type.includes('הרצאה'));\n",
    '    assert.ok(wednesdayComp, "Wednesday 034056 lecture must be present on Wednesday");\n',
    "    assert.strictEqual(wednesdayComp.startTime, '14:30', \"Wednesday 034056 lecture must start at 14:30\");\n",
    "    assert.strictEqual(wednesdayComp.endTime, '17:30', \"Wednesday 034056 lecture must end at 17:30\");\n",
    "    assert.strictEqual(wednesdayComp.room, 'הנדסה כימית 1', \"Wednesday 034056 lecture room must be הנדסה כימית 1\");\n",
    "    assert.strictEqual(wednesdayComp.lecturer, 'ד\\\"ר דניאל הקסנר', \"Wednesday 034056 lecturer must be ד\\\"ר דניאל הקסנר\");\n"
]

lines[127:138] = new_comp_block

with open('tests/cheesefork_precision_sync.test.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Updated tests/cheesefork_precision_sync.test.js lines 128-138')
