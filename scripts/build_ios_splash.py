import os
from PIL import Image

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
icon_path = os.path.join(ROOT, "icon.png")
splash_dir = os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "Splash.imageset")

if os.path.exists(icon_path) and os.path.exists(splash_dir):
    icon = Image.open(icon_path).convert("RGBA")
    
    # 2732 x 2732 background #020617 (RGB 2, 6, 23)
    bg_size = (2732, 2732)
    splash = Image.new("RGBA", bg_size, (2, 6, 23, 255))
    
    # Center icon with width 512px
    icon_w = 512
    icon_h = int(icon.height * (icon_w / icon.width))
    resized_icon = icon.resize((icon_w, icon_h), Image.Resampling.LANCZOS)
    
    x = (2732 - icon_w) // 2
    y = (2732 - icon_h) // 2
    
    splash.paste(resized_icon, (x, y), resized_icon)
    
    # Save to all 3 splash files in Splash.imageset
    for fname in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        out_p = os.path.join(splash_dir, fname)
        splash.convert("RGB").save(out_p, "PNG")
        print(f"Generated {fname}")
        
    print("iOS Splash assets generated successfully!")
else:
    print("Paths not found:", icon_path, splash_dir)
