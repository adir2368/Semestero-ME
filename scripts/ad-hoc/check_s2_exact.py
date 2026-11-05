with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('03140533')
print(ascii(text[pos-100:pos+300]))
