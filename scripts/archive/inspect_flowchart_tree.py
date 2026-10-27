import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function renderFlowchartTree')
print('Found renderFlowchartTree at:', idx)
print(text[idx:idx+1500])
