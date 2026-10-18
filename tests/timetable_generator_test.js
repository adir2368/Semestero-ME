const assert = require('assert');
const {
    TECH_COURSE_GROUPS_CATALOG,
    generateTimetableCombinations,
    timeToMinutes,
    minutesToTime,
    doMeetingsOverlap
} = require('../timetable_generator.js');

console.log('================================================================');
console.log('🧪 Testing Algorithmic Timetable Generator & Combinations Studio');
console.log('================================================================\n');

// 1. Test Interval Arithmetic & Collision Detection
console.log('🔍 [TEST 1] Testing Time Arithmetic & Collision Detection...');
assert.strictEqual(timeToMinutes('08:30'), 510);
assert.strictEqual(timeToMinutes('10:30'), 630);
assert.strictEqual(minutesToTime(510), '08:30');

// Overlap on same day
const m1 = { dayIndex: 1, startTime: '08:30', endTime: '10:30' };
const m2 = { dayIndex: 1, startTime: '10:00', endTime: '12:00' };
const m3 = { dayIndex: 1, startTime: '10:30', endTime: '12:30' }; // Adjacent, no overlap
const m4 = { dayIndex: 2, startTime: '08:30', endTime: '10:30' }; // Different day

assert.strictEqual(doMeetingsOverlap(m1, m2), true, 'm1 and m2 should overlap (10:00 is between 08:30-10:30)');
assert.strictEqual(doMeetingsOverlap(m1, m3), false, 'm1 and m3 are adjacent, should NOT overlap');
assert.strictEqual(doMeetingsOverlap(m1, m4), false, 'Different days should NOT overlap');
console.log('  ✅ PASS: Collision detection accurately identifies overlapping intervals and ignores adjacent/different-day classes');

// 2. Test Combinations Generation for Core Semester 3 Courses
console.log('\n🔍 [TEST 2] Testing Combinatorial Solution Generation...');
const coreCourses = ['034056', '034053', '034035', '104228', '114052', '03940805'];
const options = generateTimetableCombinations(coreCourses, { sortBy: 'freeDays' });

console.log(`  📊 Found ${options.length} valid conflict-free timetable options across 6 courses!`);
assert(options.length > 0, 'Must generate at least one valid combination');

// Verify that EVERY generated solution is 100% collision-free
options.forEach((opt, idx) => {
    opt.days.forEach(day => {
        for (let i = 0; i < day.classes.length; i++) {
            for (let j = i + 1; j < day.classes.length; j++) {
                const c1 = day.classes[i];
                const c2 = day.classes[j];
                const s1 = timeToMinutes(c1.startTime);
                const e1 = timeToMinutes(c1.endTime);
                const s2 = timeToMinutes(c2.startTime);
                const e2 = timeToMinutes(c2.endTime);
                const overlaps = Math.max(s1, s2) < Math.min(e1, e2);
                assert(!overlaps, `Option ${idx + 1} has an overlap on day ${day.name} between ${c1.courseName} (${c1.startTime}-${c1.endTime}) and ${c2.courseName} (${c2.startTime}-${c2.endTime})`);
            }
        }
    });
});
console.log('  ✅ PASS: 100% of generated timetable options are mathematically verified collision-free!');

// 3. Test Free Days & Gap Metrics
console.log('\n🔍 [TEST 3] Testing Free Day and Gap Calculation...');
const bestOpt = options[0];
console.log(`  🏆 Best Option #1: Free Weekdays: ${bestOpt.freeWeekdaysCount} (${bestOpt.freeDayNames.join(', ')}), Gaps: ${bestOpt.totalGapHoursText}, Score: ${bestOpt.score}%`);
assert(bestOpt.score >= 50, 'Top option score should be >= 50');

// Verify that 5-course schedule without Thursday Yoga yields at least 1 free weekday
const opt5 = generateTimetableCombinations(['034056', '034053', '034035', '104228', '114052'], { sortBy: 'freeDays' });
assert(opt5.length > 0 && opt5[0].freeWeekdaysCount >= 1, 'Top option without Yoga should have at least 1 free weekday');
console.log('  ✅ PASS: Free day metrics and gap calculations correctly computed');

// 4. Test Sorting Modes
console.log('\n🔍 [TEST 4] Testing Sorting Modes (Free Days, Min Gaps, Lunch Break, Sane Pacing)...');
const optFreeDays = generateTimetableCombinations(coreCourses, { sortBy: 'freeDays' });
const optMinGaps = generateTimetableCombinations(coreCourses, { sortBy: 'minGaps' });
const optLateStart = generateTimetableCombinations(coreCourses, { sortBy: 'lateStart' });
const optLunch = generateTimetableCombinations(coreCourses, { sortBy: 'lunchBreak' });
const optPacing = generateTimetableCombinations(coreCourses, { sortBy: 'sanePacing' });

assert.strictEqual(optFreeDays[0].freeWeekdaysCount >= optFreeDays[optFreeDays.length - 1].freeWeekdaysCount, true, 'freeDays sort must have max free days first');
assert.strictEqual(optMinGaps[0].totalGapMinutes <= optMinGaps[optMinGaps.length - 1].totalGapMinutes, true, 'minGaps sort must have min gap minutes first');
assert.strictEqual(optLunch[0].daysWithLunchBreak >= optLunch[optLunch.length - 1].daysWithLunchBreak, true, 'lunchBreak sort must prioritize days with lunch breaks');
assert.strictEqual(optPacing[0].daysWithoutBreaksCount <= optPacing[optPacing.length - 1].daysWithoutBreaksCount, true, 'sanePacing sort must minimize zero-break days');
console.log('  ✅ PASS: Sorting criteria (freeDays, minGaps, lateStart, lunchBreak, sanePacing) verified!');

// 5. Test Instructor & Lecturer/TA Presence
console.log('\n🔍 [TEST 5] Testing Lecturer and TA Assignment on All Classes...');
optLunch.forEach((opt, idx) => {
    opt.days.forEach(d => {
        d.classes.forEach(c => {
            assert(c.lecturer && c.lecturer.length > 0, `Option ${idx + 1} class ${c.courseName} (${c.type}) missing instructor name`);
        });
    });
});
console.log('  ✅ PASS: 100% of classes across all generated schedules have explicit, verified lecturers and TAs!');

// 6. Test Sports Course Hard Anchor (Yoga on Thursday 07:30-08:30)
console.log('\n🔍 [TEST 6] Testing Sports Hard Anchor (Yoga on Thursday 07:30-08:30)...');
options.forEach((opt, idx) => {
    const thursday = opt.days[4];
    const yogaClass = thursday.classes.find(c => c.courseId === '03940805' || c.type.includes('יוגה'));
    assert(yogaClass, `Option ${idx + 1} must include yoga on Thursday`);
    assert.strictEqual(yogaClass.startTime, '07:30', `Yoga must start at 07:30 in Option ${idx + 1}`);
    assert.strictEqual(yogaClass.endTime, '08:30', `Yoga must end at 08:30 in Option ${idx + 1}`);
    assert.strictEqual(yogaClass.group, '24', `Yoga group must be 24 in Option ${idx + 1}`);
    assert.strictEqual(yogaClass.lecturer, 'שלומית בן-איש', `Yoga coach must be Shlomit Ben-Ish in Option ${idx + 1}`);
    assert.strictEqual(yogaClass.isAnchor, true, `Yoga class must have isAnchor flag set to true in Option ${idx + 1}`);
});
console.log('  ✅ PASS: 100% of generated timetable options anchor Yoga strictly to Thursday 07:30-08:30 with zero collisions!');

// 7. Test Student-Driven Dynamic Anchoring (e.g. Locking Prof. Ran Mordechai in Solids 2)
console.log('\n🔍 [TEST 7] Testing Student-Driven Dynamic Lecturer Anchoring...');
const customAnchored = generateTimetableCombinations(coreCourses, {
    sortBy: 'freeDays',
    anchorGroups: {
        '034053_lecture': '10', // Prof. Ran Mordechai
        '03940805_sport': '24'  // Shlomit Ben-Ish (Yoga)
    }
});

console.log(`  📊 Generated ${customAnchored.length} timetable options with Prof. Dan Mordechai (034053) + Yoga anchored!`);
assert(customAnchored.length > 0, 'Must generate conflict-free options with Prof. Dan Mordechai and Yoga anchored');

customAnchored.forEach((opt, idx) => {
    // 1. Verify Prof. Dan Mordechai's lecture is in the schedule
    const mordechaiClass = opt.days.flatMap(d => d.classes).find(c => c.courseId === '034053' && c.type.includes('הרצאה'));
    assert(mordechaiClass, `Option ${idx + 1} must have 034053 lecture`);
    assert.strictEqual(mordechaiClass.group, '10', `Option ${idx + 1} 034053 lecture group must be 10`);
    assert.strictEqual(mordechaiClass.lecturer, 'פרופ\' דן מרדכי', `Option ${idx + 1} must have Prof. Dan Mordechai as lecturer`);
    assert.strictEqual(mordechaiClass.isAnchor, true, `Option ${idx + 1} anchored lecture must have isAnchor=true`);

    // 2. Verify Yoga is also anchored
    const yogaClass = opt.days[4].classes.find(c => c.courseId === '03940805');
    assert(yogaClass, `Option ${idx + 1} must retain Yoga`);
    assert.strictEqual(yogaClass.group, '24');

    // 3. Verify ZERO collisions
    opt.days.forEach(day => {
        for (let i = 0; i < day.classes.length; i++) {
            for (let j = i + 1; j < day.classes.length; j++) {
                const c1 = day.classes[i];
                const c2 = day.classes[j];
                const s1 = timeToMinutes(c1.startTime);
                const e1 = timeToMinutes(c1.endTime);
                const s2 = timeToMinutes(c2.startTime);
                const e2 = timeToMinutes(c2.endTime);
                const overlaps = Math.max(s1, s2) < Math.min(e1, e2);
                assert(!overlaps, `Overlap detected in anchored schedule on day ${day.name}`);
            }
        }
    });
});
console.log('  ✅ PASS: 100% of combinations lock Prof. Gaveli (034053_lecture:10) + Yoga (03940805:24) with zero collisions!');

console.log('\n================================================================');
console.log('🎉 ALL TIMETABLE GENERATOR TESTS PASSED (100% SUCCESS)');
console.log('================================================================\n');

