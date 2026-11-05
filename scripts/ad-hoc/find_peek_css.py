with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

idx = 0
while True:
    pos = text.find('peek-close-btn', idx)
    if pos == -1: break
    print(repr(text[pos-50:pos+120]))
    print('---')
    idx = pos + 1
