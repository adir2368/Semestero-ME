import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
test_path = os.path.join(ROOT, "tests", "verify_system_health.js")

with open(test_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """        // Test 7: One-click Force Update function is present
        await test('window.forceUpdateApp exists and is a callable function', async () => {
            const fnType = await cdp.eval(`typeof window.forceUpdateApp`);
            assert.strictEqual(fnType, 'function', 'window.forceUpdateApp is not defined');
        });"""

replacement = """        // Test 7: One-click Force Update function is present
        await test('window.forceUpdateApp exists and is a callable function', async () => {
            const fnType = await cdp.eval(`typeof window.forceUpdateApp`);
            assert.strictEqual(fnType, 'function', 'window.forceUpdateApp is not defined');
        });

        // Test 8: Pangea course mapping covers all 34 courses with at least 100 aliases
        await test('Pangea course map contains exhaustive coverage of all 34 courses', async () => {
            const mapStats = await cdp.eval(`(() => {
                const map = window.PANGEA_COURSE_MAP;
                if (!map || typeof map !== 'object') return null;
                const keys = Object.keys(map);
                const uniqueUrls = new Set(Object.values(map));
                return {
                    totalKeys: keys.length,
                    uniqueHubs: uniqueUrls.size,
                    hasDynamics: Boolean(map['034010']),
                    hasFluids: Boolean(map['034055']),
                    hasManufacture: Boolean(map['034030']),
                    hasCalculus1: Boolean(map['104041']),
                    hasPhysicsLab: Boolean(map['114032']),
                    hasMaterials: Boolean(map['314533'])
                };
            })()`);
            assert(mapStats, 'window.PANGEA_COURSE_MAP is not defined on window');
            assert(mapStats.totalKeys >= 100, `Expected at least 100 aliases in PANGEA_COURSE_MAP, got ${mapStats?.totalKeys}`);
            assert.strictEqual(mapStats.uniqueHubs, 34, `Expected 34 unique Pangea course hubs, got ${mapStats?.uniqueHubs}`);
            assert(mapStats.hasDynamics && mapStats.hasFluids && mapStats.hasManufacture && mapStats.hasCalculus1 && mapStats.hasPhysicsLab && mapStats.hasMaterials, 'Key mandatory courses missing from Pangea course map');
        });"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open(test_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS: Added Test 8 to verify_system_health.js")
else:
    print("WARNING: Target not found")
