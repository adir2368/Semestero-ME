with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. In Semester 4 of degreePlan, remove 01250013
s4_chem_lab = """        {
          "code": "01250013",
          "name": "מעבדה בכימיה",
          "type": "mandatory",
          "altCode": "125013",
          "credits": 0.5,
          "prereqs": [
            "01250001"
          ]
        }"""

assert s4_chem_lab in text, "s4_chem_lab not found"

# In Semester 4:
s4_full = """,
        {
          "code": "01250013",
          "name": "מעבדה בכימיה",
          "type": "mandatory",
          "altCode": "125013",
          "credits": 0.5,
          "prereqs": [
            "01250001"
          ]
        }
      ],
      "semester": 4,
      "targetCredits": 18"""

s4_replacement = """
      ],
      "semester": 4,
      "targetCredits": 17.5"""

assert s4_full in text, "s4_full not found"
text = text.replace(s4_full, s4_replacement)

# In Semester 2:
s2_target = """        {
          "code": "03140533",
          "name": "מבוא למדעי החומרים'",
          "type": "mandatory",
          "altCode": "314533",
          "credits": 3.5,
          "prereqs": [
            "01250001"
          ]
        }
      ],
      "semester": 2,"""

s2_replacement = """        {
          "code": "03140533",
          "name": "מבוא למדעי החומרים'",
          "type": "mandatory",
          "altCode": "314533",
          "credits": 3.5,
          "prereqs": [
            "01250001"
          ]
        },
        {
          "code": "01250013",
          "name": "מעבדה בכימיה",
          "type": "mandatory",
          "altCode": "125013",
          "credits": 0.5,
          "prereqs": [
            "01250001"
          ]
        }
      ],
      "semester": 2,"""

assert s2_target in text, "s2_target not found"
text = text.replace(s2_target, s2_replacement)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Moved 01250013 to Semester 2 in app.js degreePlan successfully!")
