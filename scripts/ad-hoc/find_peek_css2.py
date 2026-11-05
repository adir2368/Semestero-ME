with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.rfind('.peek-close-btn')
print(repr(text[pos-200:pos+250]))
