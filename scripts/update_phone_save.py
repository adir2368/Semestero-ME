with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

crlf = '\r\n' in code
t = '''        const settingsInput = document.getElementById("setting-phone-number");
        if (settingsInput) {
            rawPhone = settingsInput.value.trim();
            hasPhoneInput = true;
        }'''

r = '''        const settingsInput = document.getElementById("setting-phone-number");
        if (settingsInput) {
            rawPhone = settingsInput.value.trim();
            hasPhoneInput = true;
        } else if (rawPhone) {
            hasPhoneInput = true;
        }'''

if crlf:
    t = t.replace('\n', '\r\n')
    r = r.replace('\n', '\r\n')

assert t in code, 'Target not found'
code = code.replace(t, r, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('app.js updated with fallback rawPhone successfully!')
