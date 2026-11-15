@echo off
cd /d "C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
"C:\Users\user\AppData\Local\Programs\Python\Python313\python.exe" sync_from_google_calendars.py >> google_sync_log.txt 2>&1
