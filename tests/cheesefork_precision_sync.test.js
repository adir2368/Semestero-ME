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
    setItem: () => {},
    removeItem: () => {}
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
                        startTime: '10:30',
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
    assert.strictEqual(enrichedClass.startTime, '10:30', 'enrichTimetableWithAuthenticRooms must heal startTime to 10:30');
    assert.strictEqual(enrichedClass.endTime, '14:30', 'enrichTimetableWithAuthenticRooms must heal endTime to 14:30');
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
    assert.strictEqual(mondaySolids.startTime, '10:30', "Monday 034053 must start at 10:30");
    assert.strictEqual(mondaySolids.endTime, '14:30', "Monday 034053 must end at 14:30");
    assert.strictEqual(mondaySolids.room, 'דן קאהן - מכונות 6', "Monday 034053 must be in דן קאהן - מכונות 6");
    assert.strictEqual(mondaySolids.lecturer, "פרופ' יוסף גבלי", "Monday 034053 lecturer must be פרופ' יוסף גבלי");

    // Verify Monday has NO Solids Tutorial (unselected candidate discarded)
    const mondaySolidsTut = tt.days[1].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.strictEqual(mondaySolidsTut, undefined, "Monday 034053 tutorial must be discarded");

    // Verify Tuesday Solids has NO tutorial (Adir changed tutorial to Thursday Group 21)
    const tuesdaySolids = tt.days[2].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.strictEqual(tuesdaySolids, undefined, "Tuesday 034053 must have NO tutorial (moved to Thursday 21)");

    // Verify Tuesday Computing Tutorial 11 (moved from Thursday)
    const tuesdayComp = tt.days[2].classes.find(c => c.courseId.includes('34056') && c.type.includes('תרגול'));
    assert.ok(tuesdayComp, "Tuesday 034056 tutorial 11 must be present");
    assert.strictEqual(tuesdayComp.startTime, '14:30', "Tuesday 034056 tutorial 11 must start at 14:30");
    assert.strictEqual(tuesdayComp.endTime, '16:30', "Tuesday 034056 tutorial 11 must end at 16:30");
    assert.strictEqual(tuesdayComp.room, 'אולמן 501', "Tuesday 034056 tutorial 11 must be in אולמן 501");
    assert.strictEqual(tuesdayComp.lecturer, 'מר גיא ארבר', "Tuesday 034056 tutorial 11 lecturer must be מר גיא ארבר");

    // Verify Wednesday Physics 2 Tutorial 13 (authentic group chosen in CheeseFork)
    const wednesdayPhysTut = tt.days[3].classes.find(c => c.courseId.includes('114052') && c.type.includes('תרגול'));
    assert.ok(wednesdayPhysTut, "Wednesday 114052 tutorial must be present");
    assert.strictEqual(wednesdayPhysTut.type, 'תרגול 13', "Wednesday 114052 tutorial must be Group 13");
    assert.strictEqual(wednesdayPhysTut.room, 'שרמן - חינוך למדע וטכנולוגיה 107', "Wednesday 114052 tutorial 13 must be in Sherman 107");
    assert.strictEqual(wednesdayPhysTut.lecturer, 'גב\' נעם הנץ גמליאל', "Wednesday 114052 tutorial 13 lecturer must be Noam Hentz Gamliel");

    // Verify Thursday PDE Lecture 20
    const thursdayPde = tt.days[4].classes.find(c => c.courseId.includes('104228') && c.type.includes('הרצאה'));
    assert.ok(thursdayPde, "Thursday 104228 lecture must be present");
    assert.strictEqual(thursdayPde.room, 'הנדסה כימית 1', "Thursday 104228 lecture must be in הנדסה כימית 1");
    assert.strictEqual(thursdayPde.lecturer, 'ד"ר רועי בר און', "Thursday 104228 lecturer must be ד\"ר רועי בר און");

    // Verify Thursday Solids Tutorial 21 (authentic chosen tutorial)
    const thursdaySolids = tt.days[4].classes.find(c => c.courseId.includes('34053') && c.type.includes('תרגול'));
    assert.ok(thursdaySolids, "Thursday 034053 tutorial 21 must be present");
    assert.strictEqual(thursdaySolids.startTime, '12:30', "Thursday 034053 tutorial 21 must start at 12:30");
    assert.strictEqual(thursdaySolids.endTime, '14:30', "Thursday 034053 tutorial 21 must end at 14:30");
    assert.strictEqual(thursdaySolids.room, 'אולמן 205', "Thursday 034053 tutorial 21 must be in אולמן 205");
    assert.strictEqual(thursdaySolids.lecturer, 'מר יובל בר-רצון', "Thursday 034053 tutorial 21 lecturer must be מר יובל בר-רצון");

    // Verify Thursday has NO Computing tutorial
    const thursdayComp = tt.days[4].classes.find(c => c.courseId.includes('34056') && c.type.includes('תרגול'));
    assert.strictEqual(thursdayComp, undefined, "Thursday must not have Computing tutorial");

    // Verify Sunday has NO Computing lecture (Sunday only has PDE tutorial 11:30 - 13:30)
    const sundayComp = tt.days[0].classes.find(c => c.courseId.includes('34056'));
    assert.strictEqual(sundayComp, undefined, "Sunday must not have Computing lecture");

    // Verify Wednesday HAS Computing Lecture 10 (14:30 - 17:30)
    const wednesdayComp = tt.days[3].classes.find(c => c.courseId.includes('34056') && c.type.includes('הרצאה'));
    assert.ok(wednesdayComp, "Wednesday 034056 lecture must be present on Wednesday");
    assert.strictEqual(wednesdayComp.startTime, '14:30', "Wednesday 034056 lecture must start at 14:30");
    assert.strictEqual(wednesdayComp.endTime, '17:30', "Wednesday 034056 lecture must end at 17:30");
    assert.strictEqual(wednesdayComp.room, 'הנדסה כימית 1', "Wednesday 034056 lecture room must be הנדסה כימית 1");
    assert.strictEqual(wednesdayComp.lecturer, 'ד\"ר דניאל הקסנר', "Wednesday 034056 lecturer must be ד\"ר דניאל הקסנר");

    console.log("✓ Test 3 Passed: Live CheeseFork sync produces authentic schedule without duplicate/unselected tutorials or missing lectures");

    console.log("\n🎉 ALL 3 CHEESEFORK PRECISION TESTS PASSED FLAWLESSLY!");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
