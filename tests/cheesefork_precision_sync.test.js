const fs = require('fs');
const assert = require('assert');

// Mock browser globals
global.window = global;
window.addEventListener = () => {};
window.removeEventListener = () => {};

const mockEl = {
    style: {},
    innerText: '',
    value: '',
    dataset: {},
    scrollIntoView: () => {},
    focus: () => {},
    setAttribute: () => {},
    getAttribute: () => '',
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    appendChild: () => {},
    removeChild: () => {},
    remove: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.document = {
    getElementById: () => mockEl,
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => mockEl,
    createElementNS: () => mockEl,
    documentElement: { style: {}, classList: { contains: () => false, add: () => {}, remove: () => {} } },
    body: mockEl
};

global.localStorage = {
    getItem: (k) => k === 'ast_cheesefork_url' ? 'https://cheesefork.cf/#/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2' : null,
    setItem: () => {}
};
global.gameState = {
    courses: {},
    currentActiveSemester: 3
};

// Load app.js
const appCode = fs.readFileSync('app.js', 'utf8');
eval(appCode);

async function runTests() {
    console.log("Testing CheeseFork Precision Sync & Enrichment (v2.10.0)...");
    
    // Test 1: decodeCheeseForkHexKey
    assert.strictEqual(typeof decodeCheeseForkHexKey, 'function', 'decodeCheeseForkHexKey must be a function');
    assert.strictEqual(decodeCheeseForkHexKey('05d405e805e605d005d4'), 'הרצאה');
    assert.strictEqual(decodeCheeseForkHexKey('05ea05e805d205d505dc'), 'תרגול');
    assert.strictEqual(decodeCheeseForkHexKey('sport'), 'sport');
    console.log("✓ Test 1 Passed: decodeCheeseForkHexKey correctly decodes hex UTF-16 and preserves non-hex keys");

    // Test 2: Safe Room Enrichment
    const mockTimetable = {
        days: [
            {
                dayIndex: 1,
                classes: [
                    {
                        courseId: '034053',
                        startTime: '11:30',
                        endTime: '14:30',
                        type: 'הרצאה 10',
                        room: 'כיתת טכניון',
                        lecturer: ''
                    }
                ]
            }
        ]
    };
    enrichTimetableWithAuthenticRooms(mockTimetable);
    const enrichedClass = mockTimetable.days[0].classes[0];
    assert.strictEqual(enrichedClass.type, 'הרצאה 10', 'enrichTimetableWithAuthenticRooms must not mutate type');
    assert.strictEqual(enrichedClass.startTime, '11:30', 'enrichTimetableWithAuthenticRooms must not mutate startTime');
    assert.strictEqual(enrichedClass.endTime, '14:30', 'enrichTimetableWithAuthenticRooms must not mutate endTime');
    assert.strictEqual(enrichedClass.room, 'דן קאהן - מכונות 6', 'enrichTimetableWithAuthenticRooms must enrich room safely');
    assert.strictEqual(enrichedClass.lecturer, "פרופ' יוסף גבלי", 'enrichTimetableWithAuthenticRooms must enrich lecturer safely');
    console.log("✓ Test 2 Passed: enrichTimetableWithAuthenticRooms preserves type & time and safely enriches location/lecturer");

    // Test 3: Live syncLiveCheeseForkData execution
    await window.syncLiveCheeseForkData('https://cheesefork.cf/#/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2', true);
    const tt = gameState.timetable;
    assert.ok(tt && Array.isArray(tt.days), "Timetable must exist and have days");

    // Verify Monday Solids Lecture
    const mondaySolids = tt.days[1].classes.find(c => c.courseId.includes('34053') && c.type.includes('הרצאה'));
    assert.ok(mondaySolids, "Monday 034053 lecture must be present");
    assert.strictEqual(mondaySolids.startTime, '11:30', "Monday 034053 must start at 11:30");
    assert.strictEqual(mondaySolids.endTime, '14:30', "Monday 034053 must end at 14:30");
    assert.strictEqual(mondaySolids.room, 'דן קאהן - מכונות 6', "Monday 034053 must be in דן קאהן - מכונות 6");
    assert.strictEqual(mondaySolids.lecturer, "פרופ' יוסף גבלי", "Monday 034053 lecturer must be פרופ' יוסף גבלי");

    // Verify Monday Solids Tutorial 20
    const mondaySolidsTut = tt.days[1].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.ok(mondaySolidsTut, "Monday 034053 tutorial 20 must be present");
    assert.strictEqual(mondaySolidsTut.startTime, '14:30', "Monday 034053 tutorial must start at 14:30");
    assert.strictEqual(mondaySolidsTut.room, 'אולמן 602', "Monday 034053 tutorial must be in אולמן 602");
    assert.strictEqual(mondaySolidsTut.lecturer, 'מר מירון דואר', "Monday 034053 tutorial lecturer must be מר מירון דואר");

    // Verify Tuesday Solids Tutorial 11 is strictly filtered out (unselected candidate)
    const tuesdaySolids = tt.days[2].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.strictEqual(tuesdaySolids, undefined, "Tuesday 034053 tutorial 11 must be discarded");

    // Verify Thursday PDE Lecture 20
    const thursdayPde = tt.days[4].classes.find(c => c.courseId.includes('104228') && c.type.includes('הרצאה'));
    assert.ok(thursdayPde, "Thursday 104228 lecture must be present");
    assert.strictEqual(thursdayPde.room, 'הנדסה כימית 1', "Thursday 104228 lecture must be in הנדסה כימית 1");
    assert.strictEqual(thursdayPde.lecturer, 'ד"ר רועי בר און', "Thursday 104228 lecturer must be ד\"ר רועי בר און");

    // Verify Thursday Computing Tutorial 15
    const thursdayComp = tt.days[4].classes.find(c => c.courseId.includes('34056') && c.type.includes('תרגול'));
    assert.ok(thursdayComp, "Thursday 034056 tutorial 15 must be present");
    assert.strictEqual(thursdayComp.room, 'אולמן 705', "Thursday 034056 tutorial must be in אולמן 705");
    assert.strictEqual(thursdayComp.lecturer, 'מר יותם אהרון פרי', "Thursday 034056 lecturer must be מר יותם אהרון פרי");

    console.log("✓ Test 3 Passed: Live CheeseFork sync produces authentic schedule without duplicate/unselected tutorials or missing lectures");

    console.log("\n🎉 ALL 3 CHEESEFORK PRECISION TESTS PASSED FLAWLESSLY!");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
