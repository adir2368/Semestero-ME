with open('tests/cheesefork_precision_sync.test.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("startTime: '11:30',\n                        endTime: '14:30',",
                    "startTime: '10:30',\n                        endTime: '13:30',")

text = text.replace("assert.strictEqual(enrichedClass.startTime, '11:30', 'enrichTimetableWithAuthenticRooms must not mutate startTime');",
                    "assert.strictEqual(enrichedClass.startTime, '10:30', 'enrichTimetableWithAuthenticRooms must heal startTime to 10:30');")

text = text.replace("assert.strictEqual(enrichedClass.endTime, '14:30', 'enrichTimetableWithAuthenticRooms must not mutate endTime');",
                    "assert.strictEqual(enrichedClass.endTime, '13:30', 'enrichTimetableWithAuthenticRooms must heal endTime to 13:30');")

with open('tests/cheesefork_precision_sync.test.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Test 2 updated!")
