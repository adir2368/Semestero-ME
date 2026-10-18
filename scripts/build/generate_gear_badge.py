# scripts/build/generate_gear_badge.py
"""
Generates the Semestero ME Android Notification Badge:
Science Flask integrated with Mechanical Engineering Gear (Option 2 - Clean Flask Silhouette).
Prevents visual ambiguity with the Android system settings gear icon while maintaining
high contrast and sharp readability across status bar densities.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

def generate_flask_gear_badge(source_path=None):
    if not source_path:
        source_path = r'C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14/.user_uploaded/media_1792316175818_0fdfea69.jpg'
    
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source artwork not found at {source_path}")

    orig = Image.open(source_path).convert('L')
    arr_orig = np.array(orig)

    # Binarize to isolate distinct components
    bin_arr = arr_orig > 100
    labeled_white, num_white = ndimage.label(bin_arr)

    # Core components to preserve:
    # 1: Large vapor bubble
    # 2: Medium vapor bubble
    # 3: Outer gear sticker contour
    # 4: Flask lip & rim
    # 5: Main gear ring & flask neck
    # 6: Triangular flask boundary outline
    keep_mask = np.isin(labeled_white, [1, 2, 3, 4, 5, 6])

    # Dilate keep_mask by 2 pixels to capture subpixel anti-aliasing on borders
    dilated_keep = ndimage.binary_dilation(keep_mask, structure=np.ones((5, 5)))

    # Strictly exclude internal robotic arm mechanism (components 7..num_white)
    # This leaves the interior of the flask hollow, providing maximum legibility at 24-48px
    arm_mask = np.isin(labeled_white, list(range(7, num_white + 1)))
    dilated_arm = ndimage.binary_dilation(arm_mask, structure=np.ones((3, 3)))

    # Compute final alpha channel with original grayscale gradient
    final_alpha = np.where(dilated_keep & ~dilated_arm, arr_orig, 0).astype(np.uint8)

    # Construct pure white RGBA icon
    badge_rgba = Image.new('RGBA', orig.size, (255, 255, 255, 0))
    badge_rgba.putalpha(Image.fromarray(final_alpha))

    # Crop tightly to content and apply Android Material safe padding (~80% canvas)
    bbox = badge_rgba.getbbox()
    cropped = badge_rgba.crop(bbox)
    cropped.thumbnail((840, 840), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (1024, 1024), (255, 255, 255, 0))
    paste_x = (1024 - cropped.width) // 2
    paste_y = (1024 - cropped.height) // 2
    canvas.paste(cropped, (paste_x, paste_y), cropped)

    # Save to root workspace directory for web and app distribution
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    
    # Standard densities
    badge_96 = canvas.resize((96, 96), Image.Resampling.LANCZOS)
    badge_96.save(os.path.join(root_dir, 'notification-badge.png'), 'PNG')
    badge_96.save(os.path.join(root_dir, 'notification-badge-96.png'), 'PNG')
    
    badge_72 = canvas.resize((72, 72), Image.Resampling.LANCZOS)
    badge_72.save(os.path.join(root_dir, 'notification-badge-72.png'), 'PNG')
    
    badge_48 = canvas.resize((48, 48), Image.Resampling.LANCZOS)
    badge_48.save(os.path.join(root_dir, 'notification-badge-48.png'), 'PNG')

    badge_192 = canvas.resize((192, 192), Image.Resampling.LANCZOS)
    badge_192.save(os.path.join(root_dir, 'notification-badge-192.png'), 'PNG')

    print("Successfully generated Flask + Gear notification badges at 96x96, 72x72, 48x48, 192x192!")

if __name__ == '__main__':
    generate_flask_gear_badge()
