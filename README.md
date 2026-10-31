# סמסטרו ME (Semestero ME) 🎓⚙️

> **מערכת ניווט ותכנון תואר אקדמי, מחשבון ממוצע משוקלל, עץ קורסים וסנכרון Moodle + CheeseFork לסטודנטים בטכניון (ובהנדסת מכונות / מסלול ברקים)**  
> *Open-Source Technion Academic Operating System, Multi-Year Degree Planner, Prerequisite Flowchart (DAG), Weighted GPA Simulator & Live Moodle / CheeseFork Hub*

[![Version](https://img.shields.io/badge/version-2.8.8-blue.svg)](https://semestero.me/Semestero-ME/)
[![Live Web App](https://img.shields.io/badge/Semestero_ME-כניסה_לאפליקציה-brightgreen.svg)](https://semestero.me/Semestero-ME/)
[![Android APK Download](https://img.shields.io/badge/Android-APK_הורדה_ישירה-success.svg)](https://github.com/adir2368/Semestero-ME/releases/latest/download/Semestero-ME.apk)
[![iOS Safari PWA](https://img.shields.io/badge/iOS_iPhone-התקנה_מהירה-black.svg?logo=apple)](https://semestero.me/Semestero-ME/)
[![Windows Desktop](https://img.shields.io/badge/Windows_x64-Desktop_App-0078D6.svg?logo=windows)](https://github.com/adir2368/Semestero-ME/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Guide](https://img.shields.io/badge/Technion_Tools_Guide-guide.html-0ea5e9.svg)](https://semestero.me/Semestero-ME/guide.html)
[![LLMs Ready](https://img.shields.io/badge/AI_Discoverability-llms.txt-purple.svg)](https://semestero.me/llms.txt)

---

## 🌍 English Summary (For Technion Students & Open-Source Contributors)

**Semestero ME** ([https://semestero.me/Semestero-ME/](https://semestero.me/Semestero-ME/)) is a free, open-source, privacy-first **Technion Degree Planner, Weighted GPA Calculator, Prerequisite Flowchart, and Daily Study Hub** created at the Faculty of Mechanical Engineering, **Technion – Israel Institute of Technology**.

Unlike single-purpose tools that only build a weekly schedule for one semester (**CheeseFork**) or only check graduation credit totals (**Sogrim**), **Semestero ME** connects long-term degree planning with daily semester execution in one workspace:
- **8-Semester Drag-and-Drop Degree Planner**: Pre-loaded with the official Mechanical Engineering (`157.5` credits) and Barak Honors (`171.5` credits) curricula plus **2,055+ Technion courses** from the CheeseFork catalog (electives, specialization clusters, CHE/Malag humanities, and sports).
- **Interactive Prerequisite Flowchart (DAG)**: Forward/backward prerequisite chains, Physics 1/2 track variants (`114051`/`114071`/`114077` & `114052`/`114075`/`114078`), and CHE 2-course English requirement tracking.
- **Official Technion Weighted GPA & What-If Simulator**: Handles binary-pass courses (`עובר`), 2.0-credit IDF Reserve Duty (`מילואים`) academic exemptions, and target projections for Dean's List (`85.0`) and President's List (`90.0`).
- **Zero-Password Technion Moodle & CheeseFork Sync**: Passively syncs homework deadlines from Technion Moodle (`moodle25`/`moodle26.technion.ac.il`) via personal iCal feed with 1-click submission links, imports weekly class timetables directly from CheeseFork share links, and links every course directly to **Pangea**, **ASAT Scans**, and **Panopto**.
- **Cross-Platform Apps**: Instant Web App, iOS Safari PWA, Windows Desktop (`.exe`), and native Android APK with 7 home-screen widgets.

---

## 📥 הורדה וכניסה לכל המכשירים (Direct Access & Downloads)

| פלטפורמה / מכשיר | סוג התקנה | קישור ישיר | הוראות הפעלה מהירות |
| :--- | :--- | :--- | :--- |
| **🌐 דפדפן (כל מכשיר)** | **Live Web App** | [🚀 **https://semestero.me/Semestero-ME/**](https://semestero.me/Semestero-ME/) | כניסה מיידית במצב אורח נקי ופרטי ללא צורך בהתקנה או הרשמה. |
| **🤖 טלפונים - אנדרואיד (Android)** | **קובץ APK ישיר + 7 ווידג׳טים** | [📲 **הורד Semestero-ME.apk**](https://github.com/adir2368/Semestero-ME/releases/latest/download/Semestero-ME.apk) | הורידו ישירות לטלפון והתקינו (כולל ווידג׳טים למערכת שעות, ממוצע, מבחנים ומילואים). |
| **🍏 טלפונים - אייפון (iOS / iPhone)** | **Web App / PWA** | [🍏 **פתח ב-Safari להתקנה מהירה**](https://semestero.me/Semestero-ME/) | פתחו ב-Safari ➔ כפתור השיתוף ➔ **"הוסף למסך הבית" (Add to Home Screen)**. |
| **💻 מחשב (Windows x64)** | **אפליקציית שולחן עבודה** | [💻 **GitHub Releases (Windows ZIP/EXE)**](https://github.com/adir2368/Semestero-ME/releases/latest) | הורדת גרסת Windows עצמאית (Electron) או הרצה מקומית. |

---

## 📊 השוואת כלים לסטודנטים בטכניון (Technion Student Tools Comparison)

| יכולת / Feature | **Semestero ME (סמסטרו)** | **CheeseFork** | **Sogrim / PlanIt** |
| :--- | :---: | :---: | :---: |
| **מתכנן תואר רב-שנתי (8+ סמסטרים + קיץ + 2,055 קורסים)** | ✅ | ❌ | ✅ |
| **מפת קורסים וגרף דרישות קדם אינטראקטיבי (DAG)** | ✅ | ❌ | חלקי |
| **מחשבון ממוצע משוקלל וסימולטור What-If (כולל בינארי ומילואים)** | ✅ | ❌ | בסיסי |
| **סנכרון מטלות חי ממודל הטכניון (Moodle iCal ללא סיסמה)** | ✅ | ❌ | ❌ |
| **מערכת שעות שבועית + סנכרון מקישור CheeseFork** | ✅ | ✅ | ❌ |
| **קישורי קורס ישירים ל-Pangea, סריקות אס״ט ו-Panopto** | ✅ | חלקי | ❌ |
| **אפליקציית Android APK (עם ווידג׳טים) ואפליקציית Windows** | ✅ | ❌ | ❌ |

---

## 📌 כלים מרכזיים במערכת (Key Workspaces)

- 🎯 **[מחשבון ממוצע ומתכנן תואר (Degree Planner & GPA Simulator)](https://semestero.me/Semestero-ME/?tab=planner)**:  
  חישוב מדויק של ממוצע סמסטריאלי ומצטבר לפי תקנון הטכניון, סימולציית ציוני יעד (What-If) להצטיינות דיקן (85.0) ונשיא (90.0), חלוקת קורסים בגרירה (Drag & Drop), איזון עומס שבועי וטיפול בפטור מילואים (2 נק״ז).
- 🌳 **[מפת קורסים ודרישות קדם (Curriculum Prerequisite DAG)](https://semestero.me/Semestero-ME/?tab=curriculum)**:  
  גרף תלויות אינטראקטיבי מלא להנדסת מכונות ומסלול ברקים בטכניון. הדגשת שרשראות קדם קדימה ואחורה, חסימת סמסטרים עתידיים ללא קדם, ומעקב זכאות.
- 📋 **[לוח משימות וסנכרון מודל (Notion Tasks & Moodle Sync)](https://semestero.me/Semestero-ME/?tab=tasks)**:  
  מעקב מטלות ותרגילי בית בסגנון Notion, תצוגת טבלה ולוח שנה, סנכרון ישיר ממודל הטכניון וקישורי הגשה מהירים.
- 📅 **[לוח שנה אקדמי ואישי (Academic Calendar & Events)](https://semestero.me/Semestero-ME/?tab=calendar)**:  
  תצוגת חודש ושבוע, שילוב מועדי בחינות (מועד א' ו-ב'), חופשות רשמיות של הטכניון, תכנון למידה לתקופת מבחנים (Study Runway) וסנכרון ל-Google/Apple Calendar.
- 🕒 **[מערכת שעות שבועית (Weekly Timetable)](https://semestero.me/Semestero-ME/?tab=timetable)**:  
  סנכרון שעות הרצאה ותרגול ישירות מ-CheeseFork, זיהוי חפיפות וייצוא תמונה נקייה (PNG).

---

## 🛠️ הרצה ופיתוח מקומי (Local Development)

```bash
git clone https://github.com/adir2368/Semestero-ME.git
cd Semestero-ME
npm install
npm start
```

---

## 🤖 מנועי חיפוש ו-AI Discoverability (GEO)
- **מדריך השוואת כלים וחוקי תואר בטכניון**: [guide.html](https://semestero.me/Semestero-ME/guide.html)
- **קובץ הנחיות למודלי שפה (Root & App)**: [https://semestero.me/llms.txt](https://semestero.me/llms.txt)
- **מפת אתר XML מפורטת**: [https://semestero.me/sitemap.xml](https://semestero.me/sitemap.xml)
- **קובץ הרשאות סריקה**: [https://semestero.me/robots.txt](https://semestero.me/robots.txt)

---

## 👨‍💻 יוצר ומפתח המערכת
נוצר ונבנה על ידי **אדיר משה (Adir Moshe)** — הפקולטה להנדסת מכונות, הטכניון.  
לפניות, שיפורים ושאלות: [LinkedIn - Adir Moshe](https://www.linkedin.com/in/adir-moshe)
