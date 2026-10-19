# scripts/build/generate_gear_badge.py
"""
Generates the Semestero ME Android Notification Badge:
Full Emblem with Filled Science Flask & Robotic Arm Cutout.
Guarantees bold, crisp, non-hollow visibility on the Android status bar
across all screen densities (24px to 96px).
"""
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

def generate_flask_gear_badge(source_path=None):
    if not source_path:
        source_path = r'C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14/.user_uploaded/media_1792316175818_0fdfea69.jpg'
    
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source artwork not found at {source_path}")

    orig = Image.open(source_path).convert('L')
    arr = np.array(orig)
    bin_orig = arr > 90

    # Draw filled flask polygon covering neck and triangular base
    mask_img = Image.new('L', orig.size, 0)
    draw = ImageDraw.Draw(mask_img)
    flask_poly = [(225, 215), (370, 115), (460, 240), (740, 540), (350, 760), (280, 340)]
    draw.polygon(flask_poly, fill=255)
    flask_mask = np.array(mask_img) > 0

    labeled, num = ndimage.label(bin_orig)
    gear_mask = np.isin(labeled, [3, 5])
    bubbles_mask = np.isin(labeled, [1, 2, 4])
    arm_mask = np.isin(labeled, list(range(7, num + 1)))

    # Dilate robotic arm to ensure high-contrast bold negative cutout inside the filled flask
    dil_arm = ndimage.binary_dilation(arm_mask, structure=np.ones((9, 9)))
    solid_flask_with_arm_cutout = (flask_mask & ~dil_arm) | gear_mask | bubbles_mask

    badge_rgba = Image.new('RGBA', orig.size, (255, 255, 255, 0))
    badge_rgba.putalpha(Image.fromarray(np.where(solid_flask_with_arm_cutout, 255, 0).astype(np.uint8)))

    bbox = badge_rgba.getbbox()
    cropped = badge_rgba.crop(bbox)
    cropped.thumbnail((840, 840), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (1024, 1024), (255, 255, 255, 0))
    paste_x = (1024 - cropped.width) // 2
    paste_y = (1024 - cropped.height) // 2
    canvas.paste(cropped, (paste_x, paste_y), cropped)

    # Save to root workspace directory for web and app distribution
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    
    # Standard densities for Web PWA
    badge_96 = canvas.resize((96, 96), Image.Resampling.LANCZOS)
    badge_96.save(os.path.join(root_dir, 'notification-badge.png'), 'PNG')
    badge_96.save(os.path.join(root_dir, 'notification-badge-96.png'), 'PNG')
    
    badge_72 = canvas.resize((72, 72), Image.Resampling.LANCZOS)
    badge_72.save(os.path.join(root_dir, 'notification-badge-72.png'), 'PNG')
    
    badge_48 = canvas.resize((48, 48), Image.Resampling.LANCZOS)
    badge_48.save(os.path.join(root_dir, 'notification-badge-48.png'), 'PNG')

    badge_192 = canvas.resize((192, 192), Image.Resampling.LANCZOS)
    badge_192.save(os.path.join(root_dir, 'notification-badge-192.png'), 'PNG')

    # Save Android drawables across densities
    android_res = os.path.join(root_dir, 'android', 'app', 'src', 'main', 'res')
    density_map = {
        'drawable': (96, 96),
        'drawable-mdpi': (24, 24),
        'drawable-hdpi': (36, 36),
        'drawable-xhdpi': (48, 48),
        'drawable-xxhdpi': (72, 72),
        'drawable-xxxhdpi': (96, 96)
    }

    for folder, size in density_map.items():
        folder_path = os.path.join(android_res, folder)
        os.makedirs(folder_path, exist_ok=True)
        target_path = os.path.join(folder_path, 'ic_stat_notification.png')
        canvas.resize(size, Image.Resampling.LANCZOS).save(target_path, 'PNG')
        print(f"Saved {target_path} ({size[0]}x{size[1]})")

    print("Successfully generated all Semestero ME filled flask notification icons!")

if __name__ == '__main__':
    generate_flask_gear_badge()
