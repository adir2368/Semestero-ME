with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const result = await cdp.evaluate(', 'const result = await cdp.eval(')

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed evaluate -> eval in tests/verify_system_health.js")
