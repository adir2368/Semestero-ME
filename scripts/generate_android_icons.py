import os
from PIL import Image, ImageDraw

ROOT_DIR = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
SOURCE_ICON = os.path.join(ROOT_DIR, "icon-512.png")
RES_DIR = os.path.join(ROOT_DIR, "android", "app", "src", "main", "res")

BG_COLOR = (2, 6, 23, 255) # #020617

src_img = Image.open(SOURCE_ICON).convert("RGBA")

# 1. Launcher Mipmaps
densities = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

for folder, (std_size, fg_size) in densities.items():
    target_folder = os.path.join(RES_DIR, folder)
    os.makedirs(target_folder, exist_ok=True)
    
    # Standard ic_launcher.png
    std_bg = Image.new("RGBA", (std_size, std_size), BG_COLOR)
    inner_size = int(std_size * 0.82)
    resized_inner = src_img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    offset = (std_size - inner_size) // 2
    std_bg.paste(resized_inner, (offset, offset), resized_inner)
    std_bg.save(os.path.join(target_folder, "ic_launcher.png"), "PNG")
    
    # Round ic_launcher_round.png
    mask = Image.new("L", (std_size, std_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, std_size, std_size), fill=255)
    round_img = std_bg.copy()
    round_img.putalpha(mask)
    round_img.save(os.path.join(target_folder, "ic_launcher_round.png"), "PNG")
    
    # Adaptive Foreground ic_launcher_foreground.png
    fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    fg_inner_size = int(fg_size * 0.60)
    fg_resized = src_img.resize((fg_inner_size, fg_inner_size), Image.Resampling.LANCZOS)
    fg_offset = (fg_size - fg_inner_size) // 2
    fg_canvas.paste(fg_resized, (fg_offset, fg_offset), fg_resized)
    fg_canvas.save(os.path.join(target_folder, "ic_launcher_foreground.png"), "PNG")

print("[OK] Generated all launcher icons.")

# 2. Splash Screens
splash_targets = {
    "drawable": (480, 800),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

for folder, (w, h) in splash_targets.items():
    target_folder = os.path.join(RES_DIR, folder)
    os.makedirs(target_folder, exist_ok=True)
    canvas = Image.new("RGBA", (w, h), BG_COLOR)
    
    logo_size = min(int(min(w, h) * 0.42), 300)
    logo_resized = src_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    x = (w - logo_size) // 2
    y = (h - logo_size) // 2
    canvas.paste(logo_resized, (x, y), logo_resized)
    canvas.save(os.path.join(target_folder, "splash.png"), "PNG")

print("[OK] Generated all splash screens.")

# 3. Update ic_launcher_background.xml
bg_xml_path = os.path.join(RES_DIR, "values", "ic_launcher_background.xml")
with open(bg_xml_path, "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#020617</color>\n</resources>\n')

print("[OK] Updated ic_launcher_background.xml to #020617.")
