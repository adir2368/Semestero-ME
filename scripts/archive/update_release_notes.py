import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rel_path = os.path.join(ROOT, "scripts", "create_github_release.py")

with open(rel_path, "r", encoding="utf-8") as f:
    c = f.read()

target = '''    body_notes = f"""## מה חדש בגרסה v{VERSION} 🛡️✨🎯

### 1. טיהור קורסי ספורט זרים וחסימת סנכרון ענן (Tree & Cloud Purge)
- קורסי ספורט ניסיוניים (כושר גופני וחדר כושר `03940800`, פילאטיס ומתיחות `03940808`) סולקו לחלוטין מסמסטר 4 ומעץ התואר.
- סנכרון ענן Supabase נוקה ישירות בטבלת `user_states`, ונחסמה כל חדירה חוזרת ממקורות חיצוניים באמצעות `sanitizeInboundState`.
- מעבדה לפיזיקה 1ח׳ (`114032`) מקובעת במדויק בסמסטר 5 (חורף תשפ"ז).

### 2. תיקון קריסת חלונית פרטי קורס (escapeHtml Fix)
- תוקנה שגיאת `ReferenceError: escapeHtml is not defined` שהתרחשה בעת לחיצה על כרטיסיות קורסים בעץ או במערכת.
- כל פתיחת חלונית עטופה כעת בבלוק הגנה מלא למניעת שגיאות UI.

### 3. כפתור רענון גרסה וניקוי מטמון בדפדפן (Force Update)
- נוסף כפתור מהיר בהגדרות: `🔄 רענן גרסה ונקה מטמון` לניקוי Service Worker ומטמון הדפדפן בלחיצה אחת.

### 4. סנכרון גרסאות מלא
- סנכרון אחיד של גרסה v{VERSION} בכל רכיבי המערכת, בסיסי הנתונים וממשקי המשתמש."""'''

replacement = '''    body_notes = f"""## מה חדש בגרסה v{VERSION} 🛡️⚡🎯

### 1. ביקורת תקינות קוד וארכוב תסריטי תחזוקה (Code Integrity & Optimization)
- ארכוב מלא של מעל 130 תסריטי ad-hoc ישנים לתיקיית `scripts/archive/` ייעודית, תוך פינוי סביבת העבודה.
- סריקת שלמות רכיבי DOM וזיהוי תגיות גרסה ישנות (`v2.5.8`) והחלפתן בתגיות חיות ומעודכנות.
- הוספת מנגנון הגנה מלא לכפתורי רישום קורסים (`btn-register-course`) למניעת שגיאות הרצה בלתי צפויות.

### 2. ערכת בדיקות בריאות ורגרסיה אוטומטית (Automated Health Test Suite)
- הוטמעה פקודת `npm test` המריצה באופן אוטומטי מול headless Chrome (CDP) בדיקות חיוניות ב-7 מישורים:
  1. היעדר שגיאות JavaScript בלתי מטופלות בטעינת האפליקציה.
  2. הגדרה תקינה ומלאה של פונקציית הסינון `escapeHtml`.
  3. תאימות מלאה של תגיות הגרסה ב-DOM מול `window.APP_VERSION`.
  4. פתיחה חלקה של חלונית פרטי קורס (`course-modal`) בעת לחיצה בעץ.
  5. וידוא קיומם של 4 קורסי החובה בלבד בסמסטר 4 והיעדר קורסי ספורט זרים.
  6. קיבוע מעבדה לפיזיקה 1ח׳ (`114032`) בסמסטר 5 (חורף תשפ"ז).
  7. קיומה ופעולתה של פונקציית Force Update.

### 3. נעילת שמירת תוכנית לימודים (saveCustomPlan Sanitizer)
- נוסף פילטר הגנה פנימי ב-`planner_module.js` בעת שמירת תוכנית הלימודים (`saveCustomPlan`), החוסם באופן הרמטי חדירת קורסי ספורט לסמסטר 4.

### 4. חבילות הפצה מעודכנות
- חבילת Android APK מעודכנת (v{VERSION}, versionCode 30).
- חבילת Windows שולחנית עצמאית (Semestero-ME.exe + ZIP).
- סנכרון מלא ל-GitHub Pages."""'''

if '\r\n' in c:
    target = target.replace('\n', '\r\n')
    replacement = replacement.replace('\n', '\r\n')

if target in c:
    c = c.replace(target, replacement, 1)
    with open(rel_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated body_notes successfully")
else:
    print("Warning: target not found in create_github_release.py")
