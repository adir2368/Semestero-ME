with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Tuesday 034035 endTime
old_tue = """                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "הרצאה 10",
                    lecturer: "פרופ' לאוניד טרטקובסקי",
                    room: "הנדסה כימית 1",
                    startTime: "08:30",
                    endTime: "11:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "תרגול 11",
                    lecturer: "גב' עומר גזית אורלוב",
                    room: "אולמן 101",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ'",
                    type: "תרגול 11",
                    lecturer: "מר איתם טננבאום",
                    room: "אולמן 103",
                    startTime: "14:30",
                    endTime: "16:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-solids"
                }"""

new_tue = """                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "הרצאה 10",
                    lecturer: "פרופ' לאוניד טרטקובסקי",
                    room: "הנדסה כימית 1",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "תרגול 11",
                    lecturer: "גב' עומר גזית אורלוב",
                    room: "אולמן 101",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                }"""

# 2. Thursday Yoga endTime
old_yoga = """                {
                    courseId: "03940805",
                    courseName: "חינוך גופני - אתלטיקה קלה",
                    type: "יוגה 24",
                    lecturer: "שלומית בן-איש",
                    room: "חינוך גופני - אתלטיקה קלה",
                    startTime: "07:30",
                    endTime: "09:00",
                    duration: "שעה וחצי",
                    cardClass: "timetable-card-yoga",
                    isAnchor: true
                },"""

new_yoga = """                {
                    courseId: "03940805",
                    courseName: "חינוך גופני - אתלטיקה קלה",
                    type: "יוגה 24",
                    lecturer: "שלומית בן-איש",
                    room: "חינוך גופני - אתלטיקה קלה",
                    startTime: "07:30",
                    endTime: "08:30",
                    duration: "שעה",
                    cardClass: "timetable-card-yoga",
                    isAnchor: true
                },"""

assert old_tue in text, "old_tue not found"
text = text.replace(old_tue, new_tue)

assert old_yoga in text, "old_yoga not found"
text = text.replace(old_yoga, new_yoga)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("CHEESEFORK_SEMESTER_SCHEDULE in app.js updated successfully!")
