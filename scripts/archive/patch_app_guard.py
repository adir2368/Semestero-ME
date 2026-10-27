import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_path = os.path.join(root, 'app.js')

with open(app_path, 'r', encoding='utf-8') as f:
    c = f.read()

target = '            document.getElementById("btn-register-course").addEventListener("click", () => {'
replacement = '''            const btnRegister = document.getElementById("btn-register-course");
            if (btnRegister) {
                btnRegister.addEventListener("click", () => {'''

close_target = '''                openCourseDetails(code); // refresh view
            });
        }
    } else if (course.status === 'active') {'''

close_replacement = '''                openCourseDetails(code); // refresh view
                });
            }
        }
    } else if (course.status === 'active') {'''

if '\r\n' in c:
    target = target.replace('\n', '\r\n')
    replacement = replacement.replace('\n', '\r\n')
    close_target = close_target.replace('\n', '\r\n')
    close_replacement = close_replacement.replace('\n', '\r\n')

if target in c and close_target in c:
    c = c.replace(target, replacement, 1)
    c = c.replace(close_target, close_replacement, 1)
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Safely guarded btn-register-course successfully")
else:
    print("Error: targets not found in app.js")
