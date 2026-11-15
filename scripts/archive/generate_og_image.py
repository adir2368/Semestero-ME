from PIL import Image, ImageDraw, ImageFont
import os

width = 1200
height = 630

# Base dark sci-fi background (#0b1120 -> #020617)
img = Image.new('RGB', (width, height), color=(11, 17, 32))
draw = ImageDraw.Draw(img)

# Gradient background
for y in range(height):
    ratio = y / height
    r = int(15 * (1 - ratio) + 2 * ratio)
    g = int(23 * (1 - ratio) + 6 * ratio)
    b = int(42 * (1 - ratio) + 23 * ratio)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Subtle grid lines for high-tech aesthetic
for x in range(0, width, 40):
    draw.line([(x, 0), (x, height)], fill=(30, 41, 59, 20))
for y in range(0, height, 40):
    draw.line([(0, y), (width, y)], fill=(30, 41, 59, 20))

# Cyan accent glow on top / bottom borders
draw.rectangle([(0, 0), (width, 5)], fill=(56, 189, 248))
draw.rectangle([(0, height - 5), (width, height)], fill=(14, 165, 233))

# Paste icon if available
icon_path = 'icon-512.png'
if os.path.exists(icon_path):
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((260, 260), Image.Resampling.LANCZOS)
    img.paste(icon, (80, (height - 260) // 2), mask=icon)

# Load fonts
try:
    font_title = ImageFont.truetype("arialbd.ttf", 64)
    font_subtitle = ImageFont.truetype("arial.ttf", 32)
    font_tag = ImageFont.truetype("arialbd.ttf", 24)
    font_badge = ImageFont.truetype("arialbd.ttf", 20)
except Exception:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_tag = ImageFont.load_default()
    font_badge = ImageFont.load_default()

text_x = 380

# Badge pill
bbox_badge = draw.textbbox((0, 0), "SEMESTERO ME v2.0", font=font_badge)
badge_w = bbox_badge[2] - bbox_badge[0]
badge_h = bbox_badge[3] - bbox_badge[1]
pill_x1, pill_y1 = text_x, 115
pill_x2, pill_y2 = text_x + badge_w + 36, 115 + badge_h + 20
draw.rounded_rectangle([(pill_x1, pill_y1), (pill_x2, pill_y2)], radius=15, fill=(30, 58, 138), outline=(56, 189, 248), width=1)
draw.text((pill_x1 + 18, pill_y1 + 10), "SEMESTERO ME v2.0", font=font_badge, fill=(56, 189, 248))

# Main Title
draw.text((text_x, 175), "Semestero ME", font=font_title, fill=(248, 250, 252))

# Subtitle
draw.text((text_x, 260), "Personal Degree Operating System", font=font_subtitle, fill=(148, 163, 184))

# Features bullet list
features = [
    "•  Interactive Curriculum Tree & Prerequisite Visualizer",
    "•  GPA Analytics Radar, Grade Distribution & Target Simulator",
    "•  Notion-Style Task Board, Calendar & Technion Moodle Sync"
]
y_offset = 330
for feat in features:
    draw.text((text_x, y_offset), feat, font=font_tag, fill=(226, 232, 240))
    y_offset += 46

# Technion badge pill
bbox_tech = draw.textbbox((0, 0), "Technion Mechanical Engineering", font=font_badge)
tech_w = bbox_tech[2] - bbox_tech[0]
tech_h = bbox_tech[3] - bbox_tech[1]
tpill_x1, tpill_y1 = text_x, 485
tpill_x2, tpill_y2 = text_x + tech_w + 32, 485 + tech_h + 18
draw.rounded_rectangle([(tpill_x1, tpill_y1), (tpill_x2, tpill_y2)], radius=10, fill=(15, 23, 42), outline=(100, 116, 139), width=1)
draw.text((tpill_x1 + 16, tpill_y1 + 9), "Technion Mechanical Engineering", font=font_badge, fill=(148, 163, 184))

img.save('og-preview.png', 'PNG', optimize=True)
print("og-preview.png regenerated!")
