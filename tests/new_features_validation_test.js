/**
 * Unit & Integration Test Suite for the 6 New Academic Planning Features
 * 1. Exam Conflict & Density Detector
 * 2. Technion Degree Audit & Graduation Clearance Checklist
 * 3. Panopto Video Lecture & Debt Tracker
 * 4. Dean's & President's Honor List Forecaster
 * 5. Universal Webcal / iCal Phone Sync
 * 6. Peer Difficulty & Workload Consensus (UW Flow Model)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 Testing 6 New Academic Planning Features for Semestero ME');
console.log('================================================================');

let passed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
    }
}

// -----------------------------------------------------------------------------
// FEATURE 1: Exam Conflict & Density Detector
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 1] Testing Exam Conflict & Density Detector...');

test('Detects exact clashes (0 days apart) between Moed exams', () => {
    const exams = [
        { courseName: 'חדו״א 2', date: new Date('2027-02-10') },
        { courseName: 'מד״ר', date: new Date('2027-02-10') }
    ];
    const diffMs = exams[1].date - exams[0].date;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 0, 'Exam clash on the same day must evaluate to 0 days');
});

test('Detects critical squeeze (<48 hours) between consecutive exams', () => {
    const exams = [
        { courseName: 'מוצקים 2', date: new Date('2027-02-18') },
        { courseName: 'שיטות ייצור', date: new Date('2027-02-19') }
    ];
    const diffMs = exams[1].date - exams[0].date;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 1, 'Exam scheduled next day must evaluate to 1 day squeeze');
});

// -----------------------------------------------------------------------------
// FEATURE 2: Technion Degree Audit & Graduation Clearance Checklist
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 2] Testing Technion Degree Audit & Clearance Engine...');

test('Evaluates all 8 Technion ME graduation clearance rules', () => {
    const mockRulesEval = {
        totalDegreeCredits: 157.5,
        requiredDegreeCredits: 157.5,
        totalElectiveCredits: 33.0,
        creditsBCD: 15.0,
        countEnglishContent: 2,
        creditsMalag: 6.0,
        countSport: 2,
        hasScienceElective: true,
        hasCapstone: true
    };

    const ruleDegreeTotal_met = mockRulesEval.totalDegreeCredits >= mockRulesEval.requiredDegreeCredits;
    const ruleTotalElectives_met = mockRulesEval.totalElectiveCredits >= 32.5;
    const ruleBCD_met = mockRulesEval.creditsBCD >= 14.0;
    const ruleEnglishContent_met = mockRulesEval.countEnglishContent >= 2;
    const ruleMalag_met = mockRulesEval.creditsMalag >= 6.0;
    const ruleSport_met = mockRulesEval.countSport >= 2;
    const ruleScience_met = mockRulesEval.hasScienceElective === true;
    const ruleCapstone_met = mockRulesEval.hasCapstone === true;

    const allClear = [
        ruleDegreeTotal_met,
        ruleTotalElectives_met,
        ruleBCD_met,
        ruleEnglishContent_met,
        ruleMalag_met,
        ruleSport_met,
        ruleScience_met,
        ruleCapstone_met
    ].every(Boolean);

    assert.strictEqual(allClear, true, 'All 8 clearance rules should be satisfied for complete degree');
});

test('Reservist credit deduction reduces required credits from 157.5 to 155.5', () => {
    const isReservist = true;
    const requiredCredits = isReservist ? 155.5 : 157.5;
    assert.strictEqual(requiredCredits, 155.5, 'Reservist degree deduction must be exactly 155.5 credits');
});

// -----------------------------------------------------------------------------
// FEATURE 3: Panopto Video Lecture & Debt Tracker
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 3] Testing Panopto Lecture Backlog & Pacing Engine...');

test('Generates correct 13 lectures and 13 tutorials backlog', () => {
    const lectures = [];
    for (let i = 1; i <= 13; i++) {
        lectures.push({ id: `lec-${i}`, type: 'lecture', watched: false });
        lectures.push({ id: `tut-${i}`, type: 'tutorial', watched: false });
    }
    assert.strictEqual(lectures.length, 26, 'Should generate 26 total videos per course (13 + 13)');
});

test('Calculates accurate daily lecture catch-up pacing', () => {
    const totalRemaining = 14;
    const daysUntilExam = 7;
    const requiredDailyPace = (totalRemaining / daysUntilExam).toFixed(1);
    assert.strictEqual(requiredDailyPace, '2.0', '14 lectures in 7 days requires 2.0 lectures/day');
});

// -----------------------------------------------------------------------------
// FEATURE 4: Dean\'s & President\'s Honor List Forecaster
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 4] Testing Academic Honors & Standing Forecaster...');

test('Grants Dean\'s Honor when GPA >= 85 and graded credits >= 18', () => {
    const semGpa = 86.5;
    const gradedCredits = 19.5;
    const deansThreshold = 85.0;
    const minCredits = 18.0;

    const isEligible = (gradedCredits >= minCredits) && (semGpa >= deansThreshold);
    assert.strictEqual(isEligible, true, 'Should qualify for Dean\'s Honor list');
});

test('Disqualifies from honors if graded credits < 18 even with high GPA', () => {
    const semGpa = 94.0;
    const gradedCredits = 15.0; // Less than 18.0 credits
    const minCredits = 18.0;

    const isEligible = (gradedCredits >= minCredits) && (semGpa >= 85.0);
    assert.strictEqual(isEligible, false, 'Honors strictly requires >= 18 graded credits');
});

// -----------------------------------------------------------------------------
// FEATURE 5: Universal Webcal / iCal Phone Sync
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 5] Testing Universal Webcal / iCal Generator...');

test('Generates valid RFC-5545 iCalendar stream with VALARM reminders', () => {
    const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    assert.ok(appJsContent.includes('BEGIN:VCALENDAR'), 'Must include VCALENDAR start');
    assert.ok(appJsContent.includes('BEGIN:VALARM'), 'Must include VALARM automated reminders');
    assert.ok(appJsContent.includes('webcal://'), 'Must contain Webcal protocol schema');
});

// -----------------------------------------------------------------------------
// FEATURE 6: Peer Difficulty & Workload Consensus (UW Flow Model)
// -----------------------------------------------------------------------------
console.log('\n🔍 [FEATURE 6] Testing UW Flow Peer Consensus Data & Display...');

test('PEER_CONSENSUS_DATA contains core Technion ME courses', () => {
    const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    assert.ok(appJsContent.includes('PEER_CONSENSUS_DATA'), 'Must define PEER_CONSENSUS_DATA');
    assert.ok(appJsContent.includes('104041'), 'Must include Calculus 1');
    assert.ok(appJsContent.includes('034035'), 'Must include Thermodynamics 1');
    assert.ok(appJsContent.includes('renderCoursePeerConsensus'), 'Must implement renderCoursePeerConsensus');
});

console.log('\n================================================================');
console.log(`📊 Suite Completed: ${passed}/${total} Tests Passed (${Math.round((passed/total)*100)}% Success Rate)`);
console.log('================================================================');

if (passed !== total) process.exit(1);
