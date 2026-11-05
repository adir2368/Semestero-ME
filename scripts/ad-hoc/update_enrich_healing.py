with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = """            if (cleanCode === '3940805' || cleanCode === '03940805' || cleanCode === '394800') {
                if (day.dayIndex === 4 && c.startTime === '07:30' && c.endTime === '08:30') {
                    c.endTime = '09:00';
                    enrichedCount++;
                }
            }"""

replacement = """            if (cleanCode === '3940805' || cleanCode === '03940805' || cleanCode === '394800') {
                if (day.dayIndex === 4 && c.startTime === '07:30' && c.endTime === '09:00') {
                    c.endTime = '08:30';
                    enrichedCount++;
                }
            }
            // Auto-heal Tuesday Thermo 1 lecture to 08:30 - 10:30 (2 hours)
            if (cleanCode === '34035' || cleanCode === '034035') {
                if (day.dayIndex === 2 && c.startTime === '08:30' && c.endTime === '11:30') {
                    c.endTime = '10:30';
                    enrichedCount++;
                }
            }"""

assert target in text, "Target in enrichTimetableWithAuthenticRooms not found"
text = text.replace(target, replacement)

# Also in enrichTimetableWithAuthenticRooms, remove Tuesday 14:30 tutorial of 34053 if present
tue_filter_target = """    timetable.days.forEach(day => {
        if (!Array.isArray(day.classes)) return;"""

tue_filter_rep = """    timetable.days.forEach(day => {
        if (!Array.isArray(day.classes)) return;
        // Strict guard: Tuesday must NEVER have candidate Solids 2 tutorial 11 when Monday tutorial 20 is active
        if (day.dayIndex === 2) {
            day.classes = day.classes.filter(c => {
                const cId = (c.courseId || '').replace(/^0+/, '');
                return !(cId === '34053' && c.startTime === '14:30');
            });
        }"""

assert tue_filter_target in text, "tue_filter_target not found"
text = text.replace(tue_filter_target, tue_filter_rep)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("enrichTimetableWithAuthenticRooms in app.js updated successfully!")
