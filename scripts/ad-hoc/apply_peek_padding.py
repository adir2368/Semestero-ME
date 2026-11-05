with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    .peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 24px), 36px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 20px), 32px) !important;
    }"""

replacement = """    .peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 44px), 58px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 40px), 54px) !important;
    }"""

assert target in text, "Target not found in styles.css"
text = text.replace(target, replacement)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(text)

print("styles.css mobile padding successfully updated!")
