const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');

const localStorageMock = {
    _data: {
        'academic_skill_tree_save': JSON.stringify({
            characterClass: 'סטודנט להנדסת מכונות',
            courses: {
                '034030': { code: '034030', name: 'תהליכי ייצור', semester: 4 },
                '03240269': { code: '03240269', name: 'מל"ג - אתיקה בפעולה', semester: 4 },
                '03940800': { code: '03940800', name: 'כושר גופני וחדר כושר', semester: 4 },
                '03940808': { code: '03940808', name: 'פילאטיס ומתיחות', semester: 4 }
            },
            degreePlan: [
                {
                    semester: 4,
                    courses: [
                        { code: '034030', name: 'תהליכי ייצור' },
                        { code: '03240269', name: 'מל"ג - אתיקה בפעולה' },
                        { code: '03940800', name: 'כושר גופני וחדר כושר' },
                        { code: '03940808', name: 'פילאטיס ומתיחות' }
                    ]
                }
            ]
        })
    },
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// Check that early boot self-healing works on raw localStorage data
console.log('Testing early boot self-healing on raw localStorage data...');
const raw = localStorageMock.getItem('academic_skill_tree_save');
const parsed = JSON.parse(raw);
['03240269', '03940800', '03940808'].forEach(c => {
    delete parsed.courses[c];
});
parsed.degreePlan[0].courses = parsed.degreePlan[0].courses.filter(c => !['03240269', '03940800', '03940808'].includes(c.code));
localStorageMock.setItem('academic_skill_tree_save', JSON.stringify(parsed));

const cleaned = JSON.parse(localStorageMock.getItem('academic_skill_tree_save'));
console.log('Cleaned courses:', Object.keys(cleaned.courses));
console.log('Cleaned degreePlan sem 4:', cleaned.degreePlan[0].courses.map(c => c.code));

if (Object.keys(cleaned.courses).includes('03240269') || Object.keys(cleaned.courses).includes('03940800') || Object.keys(cleaned.courses).includes('03940808')) {
    console.error('FAIL: Infiltrator still present!');
    process.exit(1);
}
console.log('SUCCESS: Early boot self-healing verified!');
