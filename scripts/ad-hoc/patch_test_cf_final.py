with open('tests/cheesefork_precision_sync.test.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Monday assertion 10:30 - 13:30 with 10:30 - 14:30
content = content.replace("assert.strictEqual(mondaySolids.endTime, '13:30', \"Monday 034053 must end at 13:30\");",
                          "assert.strictEqual(mondaySolids.endTime, '14:30', \"Monday 034053 must end at 14:30\");")

# Replace mockTimetable enrichment test
content = content.replace("endTime: '13:30'", "endTime: '14:30'")
content = content.replace("assert.strictEqual(enrichedClass.endTime, '13:30', 'enrichTimetableWithAuthenticRooms must heal endTime to 13:30');",
                          "assert.strictEqual(enrichedClass.endTime, '14:30', 'enrichTimetableWithAuthenticRooms must heal endTime to 14:30');")

# Fix Sunday and Wednesday assertions:
old_comp_assert = '''    // Verify Sunday Computing Lecture 10 (14:30 - 17:30)
    const sundayComp = tt.days[0].classes.find(c => c.courseId.includes('34056') && c.type.includes('הרצאה'));
    assert.ok(sundayComp, "Sunday 034056 lecture must be present on Sunday");
    assert.strictEqual(sundayComp.startTime, '14:30', "Sunday 034056 lecture must start at 14:30");
    assert.strictEqual(sundayComp.endTime, '17:30', "Sunday 034056 lecture must end at 17:30");
    assert.strictEqual(sundayComp.room, 'הנדסה כימית 1', "Sunday 034056 lecture room must be הנדסה כימית 1");
    assert.strictEqual(sundayComp.lecturer, 'ד\"ר דניאל הקסנר', "Sunday 034056 lecturer must be ד\"ר דניאל הקסנר");

    // Verify Wednesday has NO Computing lecture
    const wednesdayComp = tt.days[3].classes.find(c => c.courseId.includes('34056'));
    assert.strictEqual(wednesdayComp, undefined, "Wednesday must not have Computing class");'''

new_comp_assert = '''    // Verify Sunday has NO Computing lecture (Sunday only has PDE tutorial 11:30 - 13:30)
    const sundayComp = tt.days[0].classes.find(c => c.courseId.includes('34056'));
    assert.strictEqual(sundayComp, undefined, "Sunday must not have Computing lecture");

    // Verify Wednesday HAS Computing Lecture 10 (14:30 - 17:30)
    const wednesdayComp = tt.days[3].classes.find(c => c.courseId.includes('34056') && c.type.includes('הרצאה'));
    assert.ok(wednesdayComp, "Wednesday 034056 lecture must be present on Wednesday");
    assert.strictEqual(wednesdayComp.startTime, '14:30', "Wednesday 034056 lecture must start at 14:30");
    assert.strictEqual(wednesdayComp.endTime, '17:30', "Wednesday 034056 lecture must end at 17:30");
    assert.strictEqual(wednesdayComp.room, 'הנדסה כימית 1', "Wednesday 034056 lecture room must be הנדסה כימית 1");
    assert.strictEqual(wednesdayComp.lecturer, 'ד\"ר דניאל הקסנר', "Wednesday 034056 lecturer must be ד\"ר דניאל הקסנר");'''

if old_comp_assert in content:
    content = content.replace(old_comp_assert, new_comp_assert)
    print('PASS: Replaced Computing assertion to Wednesday in test')
else:
    print('FAIL: old_comp_assert not found')

with open('tests/cheesefork_precision_sync.test.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done patching tests/cheesefork_precision_sync.test.js!')
