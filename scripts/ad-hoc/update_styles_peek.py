with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

target = """.peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 24px), 36px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 20px), 32px) !important;
    }
    .peek-header {
        padding-left: 44px !important; /* Leave room for close button on the left */
        margin-top: 4px !important;
    }"""

replacement = """.peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 44px), 58px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 40px), 54px) !important;
    }
    .peek-header {
        padding-left: 44px !important; /* Leave room for close button on the left */
        margin-top: 8px !important;
    }"""

assert target in text, "Target block in styles.css not found"
text = text.replace(target, replacement)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(text)

print("styles.css updated successfully!")
