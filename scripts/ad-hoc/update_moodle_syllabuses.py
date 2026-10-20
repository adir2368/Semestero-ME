import os
import re

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

# 1. Update app.js
app_path = os.path.join(ROOT, "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

syllabus_data_block = '''// Authoritative Moodle 26 (תשפ״ז - Winter 2026/2027) Syllabus & Grading Policies
const OFFICIAL_MOODLE26_SYLLABUS_DATA = {
    '034053': {
        fileName: 'מוצקים 2 - דף כללים חורף תשפז.pdf',
        grading: '80%-90% בחינה סופית (מועד א׳ 18.02.2027 / ב׳ 18.03.2027) • 10% תרגילי בית (10 הטובים מתוך 12, הגשת PDF בכתב יד חובה) • 10% תרגיל מעשי בדנציגר (אופציונלי, תקף מציון 55 בבחינה)',
        staff: 'מרצים: פרופ׳ ספי גבלי (סגו 1, קבלה ג׳ 12:30 קאהן 219), פרופ׳ דן מרדכי (כימית 1, קבלה ה׳ 12:30 קאהן 225) • מתרגל אחראי: יובל בר רצון (דייויס 306) • רכז מילואים: איתם טננבאום (eitamt@campus.technion.ac.il, דייויס 342)',
        notices: 'שיעורי פתיחה מוקדמים (פרופ׳ מרדכי): ד׳ 28.10 (12:30-14:30) וה׳ 29.10 (14:30-16:30) בהנדסה כימית 0001 (מוקלט) • תרגולי יום ה׳ 29.10 מבוטלים ולא יתקיימו'
    },
    '00340053': {
        fileName: 'מוצקים 2 - דף כללים חורף תשפז.pdf',
        grading: '80%-90% בחינה סופית (מועד א׳ 18.02.2027 / ב׳ 18.03.2027) • 10% תרגילי בית (10 הטובים מתוך 12, הגשת PDF בכתב יד חובה) • 10% תרגיל מעשי בדנציגר (אופציונלי, תקף מציון 55 בבחינה)',
        staff: 'מרצים: פרופ׳ ספי גבלי (סגו 1, קבלה ג׳ 12:30 קאהן 219), פרופ׳ דן מרדכי (כימית 1, קבלה ה׳ 12:30 קאהן 225) • מתרגל אחראי: יובל בר רצון (דייויס 306) • רכז מילואים: איתם טננבאום (eitamt@campus.technion.ac.il, דייויס 342)',
        notices: 'שיעורי פתיחה מוקדמים (פרופ׳ מרדכי): ד׳ 28.10 (12:30-14:30) וה׳ 29.10 (14:30-16:30) בהנדסה כימית 0001 (מוקלט) • תרגולי יום ה׳ 29.10 מבוטלים ולא יתקיימו'
    },
    '034035': {
        fileName: 'Syllabus_Thermo_Winter 2026-2027_LT.pdf',
        grading: '75%-95% בחינה סופית (מועד א׳ 07.02.2027 / ב׳ 05.03.2027) • 20% בוחן אמצע מגן (16.12.2026) • 5% תרגילי בית (דו-שבועי, חובה בכתב יד בלבד)',
        staff: 'מרצה ואחראי: פרופ׳ לאוניד טרטקובסקי (ג׳ 08:30-11:30 הנדסה כימית 1, קבלה ג׳ 11:30 קאהן 209) • מתרגלים: בן הולצר (אולמן 201), תומר גור-אפטר, עומר גזית-אורלוב, יעקב לנצר, עידן ויסלר',
        notices: 'סדנה שבועית לפתרון מבחנים: ימי ה׳ 13:30-15:30 באולמן 201 (AI מותר ומודרך לפני הסדנה, אסור במהלכה) • מותר במבחן: 4 דפי נוסחאות בכתב יד + טבלאות קיטור'
    },
    '00340035': {
        fileName: 'Syllabus_Thermo_Winter 2026-2027_LT.pdf',
        grading: '75%-95% בחינה סופית (מועד א׳ 07.02.2027 / ב׳ 05.03.2027) • 20% בוחן אמצע מגן (16.12.2026) • 5% תרגילי בית (דו-שבועי, חובה בכתב יד בלבד)',
        staff: 'מרצה ואחראי: פרופ׳ לאוניד טרטקובסקי (ג׳ 08:30-11:30 הנדסה כימית 1, קבלה ג׳ 11:30 קאהן 209) • מתרגלים: בן הולצר (אולמן 201), תומר גור-אפטר, עומר גזית-אורלוב, יעקב לנצר, עידן ויסלר',
        notices: 'סדנה שבועית לפתרון מבחנים: ימי ה׳ 13:30-15:30 באולמן 201 (AI מותר ומודרך לפני הסדנה, אסור במהלכה) • מותר במבחן: 4 דפי נוסחאות בכתב יד + טבלאות קיטור'
    },
    '034056': {
        fileName: 'הנחיות קורס מבוא לחישוב מדעי והנדסי חורף תשפ״ז',
        grading: 'מבחן סופי (מועד א׳ 11.02.2027 / ב׳ 10.03.2027) + פרויקט קוד ומעבדות • בונוס 2 נקודות: "לומדת MATLAB" (דדליין 19.11.2026 - אדיר משה הגיש בהצלחה ב-18/10/2026 ✓)',
        staff: 'מתרגל אחראי: יותם פרי • סגל הוראה הנדסת מכונות',
        notices: 'לומדת MATLAB הוגשה ואושרה במודל 26. תרגילי בית שבועיים יפורסמו במהלך הסמסטר.'
    },
    '00340056': {
        fileName: 'הנחיות קורס מבוא לחישוב מדעי והנדסי חורף תשפ״ז',
        grading: 'מבחן סופי (מועד א׳ 11.02.2027 / ב׳ 10.03.2027) + פרויקט קוד ומעבדות • בונוס 2 נקודות: "לומדת MATLAB" (דדליין 19.11.2026 - אדיר משה הגיש בהצלחה ב-18/10/2026 ✓)',
        staff: 'מתרגל אחראי: יותם פרי • סגל הוראה הנדסת מכונות',
        notices: 'לומדת MATLAB הוגשה ואושרה במודל 26. תרגילי בית שבועיים יפורסמו במהלך הסמסטר.'
    }
};

function renderTechnionPlusQuickBar(course) {'''

if "const OFFICIAL_MOODLE26_SYLLABUS_DATA" not in app_code:
    app_code = app_code.replace("function renderTechnionPlusQuickBar(course) {", syllabus_data_block, 1)

# Now inject the Moodle 26 syllabus card into openCourseDetails
modal_snippet_target = '''        let syllabusHtml = "";
        if (hasSyllabus) {
            syllabusHtml = `
                <div style="margin-top: 10px; font-size: 0.78rem; color: #94a3b8; line-height: 1.45; max-height: 85px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                    <strong style="color: #cbd5e1; display: block; margin-bottom: 2px;">📖 תקציר סילבוס (ספר הקורסים):</strong>
                    ${course.syllabus}
                </div>
            `;
        }'''

modal_snippet_replacement = '''        const moodleSyllabus = (typeof OFFICIAL_MOODLE26_SYLLABUS_DATA !== 'undefined') ? (OFFICIAL_MOODLE26_SYLLABUS_DATA[cleanCode] || OFFICIAL_MOODLE26_SYLLABUS_DATA[fullCode]) : null;
        let moodleSyllabusHtml = "";
        if (moodleSyllabus) {
            moodleSyllabusHtml = `
                <div class="modal-moodle26-syllabus-card" style="margin-top: 10px; background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; padding: 12px 14px; text-align: right; direction: rtl;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                        <div style="font-weight: 800; color: #38bdf8; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                            <span>🎓</span> סילבוס והרכב ציון רשמי (Moodle תשפ״ז 2026/27)
                        </div>
                        <span style="background: rgba(16, 185, 129, 0.18); color: #34d399; font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.35);">
                            ✓ מאומת מודל 26
                        </span>
                    </div>
                    <div style="font-size: 0.82rem; color: #f1f5f9; margin-bottom: 6px; line-height: 1.55;">
                        <strong style="color: #38bdf8;">⚖️ הרכב הציון:</strong> ${moodleSyllabus.grading}
                    </div>
                    <div style="font-size: 0.80rem; color: #cbd5e1; margin-bottom: 6px; line-height: 1.5;">
                        <strong style="color: #94a3b8;">👨‍🏫 סגל ושעות קבלה:</strong> ${moodleSyllabus.staff}
                    </div>
                    ${moodleSyllabus.notices ? `
                        <div style="font-size: 0.79rem; color: #fbbf24; background: rgba(245, 158, 11, 0.09); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 6px; padding: 8px 10px; margin-top: 6px; line-height: 1.5;">
                            <strong style="color: #f59e0b;">📢 הודעות פתיחה והנחיות:</strong> ${moodleSyllabus.notices}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        let syllabusHtml = "";
        if (hasSyllabus) {
            syllabusHtml = `
                <div style="margin-top: 10px; font-size: 0.78rem; color: #94a3b8; line-height: 1.45; max-height: 85px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                    <strong style="color: #cbd5e1; display: block; margin-bottom: 2px;">📖 תקציר סילבוס (ספר הקורסים):</strong>
                    ${course.syllabus}
                </div>
            `;
        }'''

if "const moodleSyllabus =" not in app_code:
    # Normalize line breaks for matching
    app_code = app_code.replace(modal_snippet_target, modal_snippet_replacement)
    app_code = app_code.replace("${examsHtml}\n                ${syllabusHtml}", "${examsHtml}\n                ${moodleSyllabusHtml}\n                ${syllabusHtml}")
    app_code = app_code.replace("${examsHtml}\r\n                ${syllabusHtml}", "${examsHtml}\r\n                ${moodleSyllabusHtml}\r\n                ${syllabusHtml}")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_code)

print("app.js updated successfully.")
