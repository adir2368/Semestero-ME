import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function openCourseDetails')
end_idx = text.find('function ', idx + 50)
details_body = text[idx:end_idx]

# Check if sports or 0394 is handled or if something fails
print("Length of openCourseDetails:", len(details_body))
# print the last 1500 chars of openCourseDetails where the modal is actually opened!
print(details_body[-1500:])
