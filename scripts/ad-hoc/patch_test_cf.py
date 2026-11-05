with open('tests/cheesefork_precision_sync.test.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add removeItem
text = text.replace("setItem: () => {}", "setItem: () => {},\n    removeItem: () => {}")

# Monday Solids 10:30 - 13:30
text = text.replace("assert.strictEqual(mondaySolids.startTime, '11:30', \"Monday 034053 must start at 11:30\");",
                    "assert.strictEqual(mondaySolids.startTime, '10:30', \"Monday 034053 must start at 10:30\");")
text = text.replace("assert.strictEqual(mondaySolids.endTime, '14:30', \"Monday 034053 must end at 14:30\");",
                    "assert.strictEqual(mondaySolids.endTime, '13:30', \"Monday 034053 must end at 13:30\");")

# Add Sunday Computing and Wednesday Computing check
target_block = """    // Verify Thursday Computing Tutorial 15
    const thursdayComp = tt.days[4].classes.find(c => c.courseId.includes('34056') && c.type.includes('תרגול'));
    assert.ok(thursdayComp, "Thursday 034056 tutorial 15 must be present");
    assert.strictEqual(thursdayComp.room, 'אולמן 705', "Thursday 034056 tutorial must be in אולמן 705");
    assert.strictEqual(thursdayComp.lecturer, 'מר יותם אהרון פרי', "Thursday 034056 lecturer must be מר יותם אהרון פרי");"""

replacement_block = """    // Verify Thursday Computing Tutorial 15
    const thursdayComp = tt.days[4].classes.find(c => c.courseId.includes('34056') && c.type.includes('תרגול'));
    assert.ok(thursdayComp, "Thursday 034056 tutorial 15 must be present");
    assert.strictEqual(thursdayComp.room, 'אולמן 705', "Thursday 034056 tutorial must be in אולמן 705");
    assert.strictEqual(thursdayComp.lecturer, 'מר יותם אהרון פרי', "Thursday 034056 lecturer must be מר יותם אהרון פרי");

    // Verify Sunday Computing Lecture 10 (14:30 - 17:30)
    const sundayComp = tt.days[0].classes.find(c => c.courseId.includes('34056') && c.type.includes('הרצאה'));
    assert.ok(sundayComp, "Sunday 034056 lecture must be present on Sunday");
    assert.strictEqual(sundayComp.startTime, '14:30', "Sunday 034056 lecture must start at 14:30");
    assert.strictEqual(sundayComp.endTime, '17:30', "Sunday 034056 lecture must end at 17:30");
    assert.strictEqual(sundayComp.room, 'הנדסה כימית 1', "Sunday 034056 lecture room must be הנדסה כימית 1");
    assert.strictEqual(sundayComp.lecturer, 'ד\\"ר דניאל הקסנר', "Sunday 034056 lecturer must be ד\\"ר דניאל הקסנר");

    // Verify Wednesday has NO Computing lecture
    const wednesdayComp = tt.days[3].classes.find(c => c.courseId.includes('34056'));
    assert.strictEqual(wednesdayComp, undefined, "Wednesday must not have Computing class");"""

text = text.replace(target_block, replacement_block)

with open('tests/cheesefork_precision_sync.test.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("tests/cheesefork_precision_sync.test.js updated successfully!")
