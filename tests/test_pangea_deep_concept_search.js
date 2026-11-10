const assert = require('assert');
const PangeaHub = require('../pangea_knowledge_hub.js');

console.log('🧪 Running Pangea Deep Concept & Theorem Search Tests...');

// 1. Verify concepts index loaded
assert(Array.isArray(PangeaHub.concepts), 'PangeaHub.concepts should be an array');
assert(PangeaHub.concepts.length >= 60, `PangeaHub.concepts length should be >= 60, got ${PangeaHub.concepts.length}`);
console.log(`✅ Test 1: Concepts index loaded (${PangeaHub.concepts.length} concepts).`);

// 2. Test specific theorem searches
const testCases = [
    { query: 'שטיינר', expectedType: 'concept', expectedTitle: 'משפט שטיינר' },
    { query: 'מעגל מור', expectedType: 'concept', expectedTitle: 'מעגל מור' },
    { query: 'ברנולי', expectedType: 'concept', expectedTitle: 'ברנולי' },
    { query: 'פון מיזס', expectedType: 'concept', expectedTitle: 'פון מיזס' },
    { query: 'קסטיליינו', expectedType: 'concept', expectedTitle: 'קסטיליינו' },
    { query: 'נאוויה', expectedType: 'concept', expectedTitle: 'נאוויה-סטוקס' },
    { query: 'חוק שני', expectedType: 'concept', expectedTitle: 'החוק השני של התרמודינמיקה' },
    { query: 'אנטרופיה', expectedType: 'concept', expectedTitle: 'אנטרופיה' },
    { query: 'PID', expectedType: 'concept', expectedTitle: 'PID' },
    { query: 'ריינולדס', expectedType: 'concept', expectedTitle: 'ריינולדס' },
    { query: 'גאוס', expectedType: 'concept', expectedTitle: 'משפט גאוס' },
    { query: 'קריסה', expectedType: 'concept', expectedTitle: 'אוילר' },
    { query: 'זורבסקי', expectedType: 'concept', expectedTitle: 'זורבסקי' }
];

testCases.forEach((tc, idx) => {
    const results = PangeaHub.search(tc.query);
    assert(results.length > 0, `Search for "${tc.query}" should return at least one result`);
    const topResult = results[0];
    assert.strictEqual(topResult.type, tc.expectedType, `Top result for "${tc.query}" should be of type ${tc.expectedType}`);
    assert(topResult.title.includes(tc.expectedTitle), `Top result title "${topResult.title}" should include "${tc.expectedTitle}"`);
    assert(topResult.url && topResult.url.startsWith('https://idofangbentov.uk/'), `Result url should be valid, got ${topResult.url}`);
    assert(topResult.formula, `Concept result should have formula snippet`);
    console.log(`✅ Test 2.${idx + 1}: Query "${tc.query}" -> [${topResult.categoryLabel}] ${topResult.title} (${topResult.courseTitle})`);
});

// 3. Test Course Code Filter in Search
const sldResults = PangeaHub.search('כשל', '034053'); // SLD2
assert(sldResults.length > 0, 'Course filter search should return results');
assert(sldResults.every(r => r.courseTag === 'SLD2'), 'All results should match SLD2');
console.log(`✅ Test 3: Course code filter search verified (${sldResults.length} matches for SLD2).`);

console.log('🎉 All Pangea Deep Concept & Theorem Search tests passed successfully!');
