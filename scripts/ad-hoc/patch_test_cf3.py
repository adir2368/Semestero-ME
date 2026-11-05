with open('tests/cheesefork_precision_sync.test.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    // Verify Monday Solids Tutorial 20
    const mondaySolidsTut = tt.days[1].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.ok(mondaySolidsTut, "Monday 034053 tutorial 20 must be present");
    assert.strictEqual(mondaySolidsTut.startTime, '14:30', "Monday 034053 tutorial must start at 14:30");
    assert.strictEqual(mondaySolidsTut.room, 'אולמן 602', "Monday 034053 tutorial must be in אולמן 602");
    assert.strictEqual(mondaySolidsTut.lecturer, 'מר מירון דואר', "Monday 034053 tutorial lecturer must be מר מירון דואר");

    // Verify Tuesday Solids Tutorial 11 is strictly filtered out (unselected candidate)
    const tuesdaySolids = tt.days[2].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.strictEqual(tuesdaySolids, undefined, "Tuesday 034053 tutorial 11 must be discarded");"""

replacement = """    // Verify Monday has NO Solids Tutorial (unselected candidate discarded)
    const mondaySolidsTut = tt.days[1].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.strictEqual(mondaySolidsTut, undefined, "Monday 034053 tutorial must be discarded");

    // Verify Tuesday Solids Tutorial 11 (authentic tutorial Adir attends)
    const tuesdaySolids = tt.days[2].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.ok(tuesdaySolids, "Tuesday 034053 tutorial 11 must be present");
    assert.strictEqual(tuesdaySolids.startTime, '14:30', "Tuesday 034053 tutorial 11 must start at 14:30");
    assert.strictEqual(tuesdaySolids.endTime, '16:30', "Tuesday 034053 tutorial 11 must end at 16:30");
    assert.strictEqual(tuesdaySolids.room, 'אולמן 103', "Tuesday 034053 tutorial 11 must be in אולמן 103");
    assert.strictEqual(tuesdaySolids.lecturer, 'מר איתם טננבאום', "Tuesday 034053 tutorial 11 lecturer must be מר איתם טננבאום");"""

assert target in text, "Target not found in tests/cheesefork_precision_sync.test.js"
text = text.replace(target, replacement)

with open('tests/cheesefork_precision_sync.test.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("tests/cheesefork_precision_sync.test.js updated successfully!")
