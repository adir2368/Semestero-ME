import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

img_tags = re.findall(r'<img\s+[^>]*>', content, re.IGNORECASE)
print(f'Total img tags found: {len(img_tags)}')
for i, tag in enumerate(img_tags):
    src_m = re.search(r'src=["\']([^"\']+)["\']', tag)
    alt_m = re.search(r'alt=["\']([^"\']*)["\']', tag)
    width_m = re.search(r'width=["\']([^"\']+)["\']', tag)
    height_m = re.search(r'height=["\']([^"\']+)["\']', tag)
    
    src = src_m.group(1) if src_m else None
    alt = alt_m.group(1) if alt_m else None
    w = width_m.group(1) if width_m else None
    h = height_m.group(1) if height_m else None
    
    clean_src = src.split('?')[0] if src else ''
    exists = os.path.exists(clean_src) if clean_src and not clean_src.startswith('http') else True
    
    issues = []
    if not alt: issues.append('missing/empty alt')
    if not exists: issues.append(f'file not found ({clean_src})')
    if not w or not h: issues.append('missing width/height (CLS risk)')
    
    if issues:
        print(f'Img {i}: src={src} -> issues: {issues}')
    else:
        print(f'Img {i}: src={src} -> OK (alt="{alt}", {w}x{h})')

# Check button elements without aria-label or text
button_tags = re.findall(r'<button\s+[^>]*>([^<]*)</button>', content, re.IGNORECASE)
print(f'\nTotal button tags checked: {len(button_tags)}')

# Check interactive elements
inputs = re.findall(r'<input\s+[^>]*>', content, re.IGNORECASE)
print(f'Total input tags: {len(inputs)}')
inputs_without_id_or_label = []
for inp in inputs:
    has_id = 'id=' in inp
    has_aria = 'aria-label=' in inp or 'aria-labelledby=' in inp
    if not has_id and not has_aria:
        inputs_without_id_or_label.append(inp)
print(f'Inputs without id or aria-label: {len(inputs_without_id_or_label)}')
