import json
import random
import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SWARM_EXPANDED_PERSONAS = [
    # --- Top Academic Performers ("Geeks", High GPA, Perfectionists) ---
    {
        "id": "top_gpa_neurotic",
        "name": "איתי (סמסטר 4, ממוצע 94, מצטיין נשיא)",
        "archetype": "Super High GPA, Perfectionist",
        "verdict": "9.5/10",
        "critique": "חישוב הממוצע המשוקלל מדויק על המאית, וגרף הרדאר בסמסטרים נותן תמונה ויזואלית קטלנית של חלוקת הקרדיטים. אהבתי שאין סמסטרים ריקים בחישוב.",
        "harsh_feedback": "חסר לי חישוב של 'חציון' פקולטטי או השוואה לפילוג ציונים רשמי של הקורס בשנים קודמות (כמו בצ'יזפורק) כדי לדעת איפה אני עומד ביחס למחזור."
    },
    {
        "id": "algo_double_degree",
        "name": "רועי (מסלול משולב מכונות-מדמ״ח)",
        "archetype": "Tech Savvy, Power User",
        "verdict": "9/10",
        "critique": "הארכיטקטורה של ה-PWA וסנכרון ה-Supabase בזמן אמת עובדים חלק. הממשק מהיר מאוד ולא נתקע.",
        "harsh_feedback": "בגלל שאני במסלול משולב, העץ כרגע בנוי בעיקר על סילבוס מכונות. אני צריך אפשרות לקסטם בקלות קורסי בחירה פקולטטיים ממדעי המחשב בלי שזה ידרוש עריכה ידנית של כל שרשרת קדם."
    },
    {
        "id": "planner_maniac",
        "name": "נועה (סמסטר 2, מסודרת בקטע מפחיד)",
        "archetype": "Obsessive Planner, Notion Power User",
        "verdict": "9/10",
        "critique": "הסייד-פיק של המשימות בסגנון Notion פשוט מושלם, והעובדה שהעפתם את תמונת הרקע גרמה לו לעבוד נקי בלי הסחות דעת. גם הלוח שנה עם המועדי א' וב' נהדר.",
        "harsh_feedback": "הייתי רוצה תגיות צבע מותאמות אישית למשימות (למשל: תרגיל בית, דו״ח מעבדה, בוחן אמצע) במקום רק עדיפויות."
    },

    # --- Struggling Students, Crammers, & "Lazy" / Non-Tech-Savvy ("טיפשים" / עצלנים) ---
    {
        "id": "barely_passing_dude",
        "name": "מתן (סמסטר 6, ממוצע 66, בוגר 4 מועדי ג')",
        "archetype": "Barely Passing, High Stress, Wants Zero Friction",
        "verdict": "8.5/10",
        "critique": "אחי, המחשבון של 'כמה אני צריך לקבל במועד ב׳ כדי לעבור את הקורס' מציל חיים. אני לא מבין באקסלים ועץ הקורסים מראה לי ישר איזה קורס יתקע אותי לעוד שנה אם אני נכשל בו עכשיו.",
        "harsh_feedback": "לפעמים הטקסט של השמות קורסים קצת ארוך לי בעיניים, תוסיפו כפתור ענק באדום: 'איזה קורסים יתקעו לי את התואר אם אכשל?'. אל תגרמו לי לחשוב."
    },
    {
        "id": "confused_freshman",
        "name": "בן (סמסטר 1, לא מבין איך הטכניון עובד)",
        "archetype": "Lost & Clueless Beginner",
        "verdict": "7.5/10",
        "critique": "נכנסתי כי חבר שלח לי בוואטסאפ. המפה של הקורסים ממש מגניבה כי חשבתי שחדווא זה קורס אחד ולא ידעתי שיש חדווא 1ת וחדווא 2ת.",
        "harsh_feedback": "בהתחלה לא הבנתי איפה לוחצים כדי לשמור. חשבתי שזה אתר לקריאה בלבד עד שהבנתי שלוחצים על הקורס כדי לעדכן ציון. כדאי שיהיה חץ גדול שמסביר בדקה הראשונה."
    },
    {
        "id": "mobile_only_procrastinator",
        "name": "ליאור (סמסטר 3, גולש רק מהטלפון במיטה)",
        "archetype": "Mobile Addict, Hates Complicated Forms",
        "verdict": "9/10",
        "critique": "התיקון שעשיתם לטלפון בגרסה 2.0.2 עובד פצצה! הכל נפתח במסך מלא וקל ללחוץ עם האגודל. כפתור הנגישות בפינה גם נוח כשאני עייף בלילה.",
        "harsh_feedback": "כשאני מוסיף משימה ידנית, המקלדת של האייפון לפעמים מסתירה קצת את כפתור השמירה בתחתית אם יש לי ספארי עם שורת כתובת תחתונה."
    },
    {
        "id": "crammer_last_minute",
        "name": "גילי (סמסטר 5, לומד רק יומיים לפני המבחן)",
        "archetype": "Last-Minute Crammer, Exam Schedule Focused",
        "verdict": "8.8/10",
        "critique": "הסנכרון של מועדי המבחנים והחופשות של הטכניון ישר ללוח שנה חוסך לי לחפש את ה-PDF המעצבן של לימודי הסמכה.",
        "harsh_feedback": "תוסיפו ספירה לאחור בימים: 'נשארו עוד 3 ימים לתרמו 1'. כשזה רק תאריך בלוח שנה אני דוחה את זה."
    },

    # --- Realistic Average Students ("Solid 75-80", Pragmatic) ---
    {
        "id": "reservist_student",
        "name": "טל (סמסטר 4, מילואימניק שחזר אחרי 100 ימי צו 8)",
        "archetype": "Reservist Returning to Studies, Needs Quick Catch-up",
        "verdict": "10/10",
        "critique": "חזרתי מהמילואים ולא ידעתי איזה קורסים לקחת כדי לא להתאבד בסמסטר הנוכחי. היכולת לסמן מה כבר עברתי ולראות מה פתוח לי בצורה ויזואלית חסכה לי שיחה של שעה עם יועץ לימודים.",
        "harsh_feedback": "חסר לי סימון של הקלות מילואים (למשל: נק״ז זכות למילואים או פטור מנקודות בחירה חופשית)."
    },
    {
        "id": "working_student",
        "name": "מיכל (סמסטר 6, עובדת בחצי משרה ברפאל)",
        "archetype": "Working Student, Time Management Focused",
        "verdict": "9.2/10",
        "critique": "מערכת השעות האינטראקטיבית עם החלוקה לימים יחד עם המשימות של המודל נותנת לי לנהל את השבוע מול שעות העבודה בלי לפתוח חמישה טאבים שונים.",
        "harsh_feedback": "הייתי שמחה אם סנכרון המודל ידע למשוך גם את הציונים של שיעורי הבית השבועיים ולא רק את מועדי ההגשה."
    },
    {
        "id": "skeptical_veteran",
        "name": "דן (סמסטר 8, סוגר תואר, ראה כבר הכל בטכניון)",
        "archetype": "Old-School Cynic, Prefers CheeseFork / Google Sheets",
        "verdict": "9/10",
        "critique": "הייתי בטוח שעוד מישהו עשה פרויקט סמסטר חובבני שיישבר אחרי שבוע. אבל הממשק פה באמת ברמה של מוצר מלוטש. ה-Offline Support והעובדה שזה לא דורש שרת מורכב הופכים את זה לאמין.",
        "harsh_feedback": "תוודאו שגיבוי ה-JSON המקומי והענן תמיד שומרים גרסאות לאחור, כדי שאף סטודנט לא יאבד נתונים אם הוא מנקה קוקיז בטעות."
    }
]

def run_extended_swarm_simulation():
    print("=" * 70)
    print("🧠 EXPANDED MIROFISH SWARM: 10 DISTINCT TECHNION STUDENT PERSONAS")
    print("=" * 70)
    print("[*] Testing Semestero ME across intelligence extremes:")
    print("    - Top Honors Geeks (90+ GPA, Algorithm Track, Notion Power Users)")
    print("    - Struggling & Clueless Students (60-70 GPA, Mobile Crammers, Lazy)")
    print("    - Pragmatic Real-World Students (Reservists, Working Engineers, Seniors)\n")

    total_score = 0
    for p in SWARM_EXPANDED_PERSONAS:
        num_score = float(p['verdict'].split('/')[0])
        total_score += num_score
        print(f"👤 {p['name']} [{p['archetype']}]")
        print(f"   ⭐ ציון: {p['verdict']}")
        print(f"   👍 מה אהב: {p['critique']}")
        print(f"   ⚠️ מה הפריע לו / ביקש לשפר: {p['harsh_feedback']}\n")

    avg_score = total_score / len(SWARM_EXPANDED_PERSONAS)
    print("-" * 70)
    print(f"📊 Overall Swarm Rating Across All 10 Archetypes: {avg_score:.2f} / 10.0")
    print("=" * 70)

if __name__ == '__main__':
    run_extended_swarm_simulation()
