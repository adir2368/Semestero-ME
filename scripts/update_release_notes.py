import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(ROOT, "scripts", "create_github_release.py")

with open(FILE, "r", encoding="utf-8") as f:
    text = f.read()

# Update release name
text = re.sub(
    r'NAME = f"Semestero ME v\{VERSION\} - [^"]+"',
    'NAME = f"Semestero ME v{VERSION} - Main Windows First Tour, Transition Delay, Bottom Bar Protection & Guest Privacy"',
    text
)

# New release notes
new_notes = '''    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🧭🛡️
    
### 1. הצגת כל 6 החלונות המרכזיים תחילה בסיור המודרך (Main Windows First Tour)
- **סדר מסלול לוגי ומקיף**: הסיור פותח במעבר שלב-אחר-שלב בין כל ששת חלונות הליבה של סמסטרו לפי הסדר הטבעי:
  1. **מפת קורסים (Curriculum Tree)** - עץ הקדמים הפקולטי והארת שרשרת דרישות.
  2. **תכנון תואר (Degree Planner)** - שיבוץ רב-סמסטריאלי, ניהול עומסים ובדיקת זכאות ל-157.5 נק״ז.
  3. **לוח משימות (Tasks Board)** - ניהול מטלות בסגנון Notion, בחירה מרובה וסנכרון Moodle.
  4. **לוח שנה אקדמי (Academic Calendar)** - לוח מועדי בחינות, זמני סמסטר ומעקב חופשות.
  5. **מערכת שעות שבועית (Timetable Studio)** - מחולל קומבינציות וסנכרון CheeseFork.
  6. **הגדרות וגיבוי (Settings & Cloud Backup)** - הורדות למחשב ולנייד, גיבוי מקומי וענן.
  - בסיום 6 החלונות המרכזיים מודגמים כלי העל: **שורת פקודות חכמה (Ctrl+K)** ו**מדריך זכויות אקדמיות ויועץ מילואים**.

### 2. השהיית מעבר מודעת (750ms Transition HUD) והארת טאב פעיל
- **השהיית מעבר מכוונת**: בעת מעבר בין חלונות, המערכת מציגה באנר HUD צף יוקרתי (`🧭 עובר לחלון: ...`) וממתינה 750ms כדי שהסטודנט ישים לב בדיוק לאיזה עמוד הוא הגיע.
- **הדגשת טאב בסרגל הניווט (`tour-nav-tab-active-glow`)**: הטאב של החלון הנוכחי בסרגל מקבל פעימת ניאון זוהרת כדי שהסטודנטים יקשרו מיד בין התוכן למיקומו בסרגל.

### 3. הגנה מפני הסתרת סרגל החלונות (Bottom Bar Collision Protection)
- חישוב גובה סרגל הניווט התחתון (`.nav-tabs-left`) בזמן אמת והגדרת מרווח ביטחון קפדני (`safeBottomClearance = 76px+`).
- היפוך אוטומטי של בועת הטקסט כלפי מעלה (`placement: 'top'`) כאשר יש חשש להסתרה.
- סרגל החלונות שומר על נראות ואינטראקטיביות 100% לאורך כל הסיור (`z-index: 99998`).
- תג כותרת ייעודי בבועה: `📍 חלון נוכחי: [שם החלון] ([מספר] מתוך 6)`.

### 4. פרטיות והסרת קישורים אישיים עבור אורחים (Guest Privacy Sanitization)
- ביקורת עומק וטיהור כל הקישורים והטוקנים של אדיר עבור משתמשי אורח ולא מחוברים:
  - הקישור ל-CheeseFork פותח סמסטר גנרי נקי (`?semester=202601`) ללא ה-UID האישי.
  - סנכרון לוח שנה Webcal Gist נשאר חסוי ואינו מוצג או מועתק כלל למשתמשים שאינם אדיר.
  - הסרת טוקנים וכתובות Moodle אישיות מקבצי ה-JSON ומצב המערכת.

### 5. הפעלת סיור אך ורק בסיום הרשמה או דרך הגדרות
- הסיור לעולם אינו קופץ אוטומטית בהפעלת האפליקציה למשתמשים מחוברים.
- מופעל אך ורק בסיום תהליך ההרשמה (Onboarding) או בלחיצה ידנית על כפתור הסיור בהגדרות/מרכז ההדרכה (או מקש T)."""'''

text = re.sub(r'    body_notes = f""".*?"""', new_notes, text, flags=re.DOTALL)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated create_github_release.py successfully!")
