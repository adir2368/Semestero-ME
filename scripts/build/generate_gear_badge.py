# scripts/build/generate_gear_badge.py
import math
from PIL import Image, ImageDraw

def create_gear_badge():
    size = 1024  # Render at high resolution (1024x1024) for supreme anti-aliasing
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size / 2.0, size / 2.0
    r_outer = size * 0.40      # ~410 px (80% diameter -> generous status bar safe zone)
    r_root = size * 0.27       # ~276 px (deep, distinct tooth cutouts)
    r_bore = size * 0.12       # ~123 px (clear central bore)
    num_teeth = 8
    
    points = []
    step = 360.0 / num_teeth
    
    for k in range(num_teeth):
        mid = k * step
        a1 = math.radians(mid - step * 0.5)
        a2 = math.radians(mid - step * 0.26)
        a3 = math.radians(mid - step * 0.14)
        a4 = math.radians(mid + step * 0.14)
        a5 = math.radians(mid + step * 0.26)
        
        points.append((cx + r_root * math.cos(a1), cy + r_root * math.sin(a1)))
        points.append((cx + r_root * math.cos(a2), cy + r_root * math.sin(a2)))
        points.append((cx + r_outer * math.cos(a3), cy + r_outer * math.sin(a3)))
        points.append((cx + r_outer * math.cos(a4), cy + r_outer * math.sin(a4)))
        points.append((cx + r_root * math.cos(a5), cy + r_root * math.sin(a5)))
        
    # Draw gear solid body in pure white (255, 255, 255, 255)
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    # Center bore hole (transparent)
    draw.ellipse([cx - r_bore, cy - r_bore, cx + r_bore, cy + r_bore], fill=(0, 0, 0, 0))
    
    # Save master sizes with Lanczos resampling
    img_96 = img.resize((96, 96), Image.Resampling.LANCZOS)
    img_96.save('notification-badge.png', 'PNG')
    img_96.save('notification-badge-96.png', 'PNG')
    
    img_72 = img.resize((72, 72), Image.Resampling.LANCZOS)
    img_72.save('notification-badge-72.png', 'PNG')
    
    img_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    img_48.save('notification-badge-48.png', 'PNG')

    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save('notification-badge-192.png', 'PNG')

    print("Generated notification badges (96x96, 72x72, 48x48, 192x192) successfully!")

if __name__ == '__main__':
    create_gear_badge()
