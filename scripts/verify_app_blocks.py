import os

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    'function saveCalendarsSection()',
    'function renderPhoneAndNotificationPreferences()',
    'function testSendPhoneNotification()',
    'async function syncScheduleToCloudGist',
    'const triggerBtn = document.getElementById("btn-trigger-cloud-sync");',
    'function exportTimetableCancellationICS()',
    'function generateMorning730BriefingData'
]

for c in checks:
    pos = content.find(c)
    print(f"Found '{c}': {pos != -1} at index {pos}")
