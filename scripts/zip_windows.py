import os
import json
import zipfile
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as pkg_f:
    PKG_VERSION = json.load(pkg_f).get("version", "3.2.0")
SRC_DIR = os.path.join(ROOT, "dist", "Semestero ME-win32-x64")
if not os.path.exists(os.path.join(SRC_DIR, "Semestero ME.exe")):
    SRC_DIR = os.path.join(ROOT, "dist_build", "Semestero ME-win32-x64")

OUT_ZIP = os.path.join(ROOT, "Semestero-ME-Windows-x64.zip")
EXE_SRC = os.path.join(SRC_DIR, "Semestero ME.exe")
EXE_DST = os.path.join(ROOT, "Semestero-ME.exe")

print(f"Creating zip from: {SRC_DIR}")
print(f"Destination: {OUT_ZIP}")

SKIP_DIRS = {'android', 'ios', '.git', 'backups', '_backup_widgets', 'graphify-out', 'tests', 'scripts', 'scratch', 'dist'}
SKIP_EXTS = {'.zip', '.apk'}

with zipfile.ZipFile(OUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(SRC_DIR):
        # Prune excluded directories in-place so os.walk doesn't even descend into them
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in SKIP_EXTS and "resources" in root:
                continue
            full_path = os.path.join(root, file)
            # Use \\?\ for long paths if needed
            try:
                rel_path = os.path.relpath(full_path, SRC_DIR)
                arcname = os.path.join("Semestero ME-win32-x64", rel_path)
                zipf.write(full_path, arcname)
            except Exception as e:
                print(f"Skipping {file}: {e}")

print(f"Zip created successfully! Size: {os.path.getsize(OUT_ZIP) / (1024*1024):.2f} MB")

# Close running instances on local computer if open, so file locks do not block updates
try:
    import subprocess
    subprocess.run(["powershell", "-Command", "Stop-Process -Name 'Semestero ME', 'electron' -Force -ErrorAction SilentlyContinue"], capture_output=True)
except Exception:
    pass

try:
    shutil.copy2(EXE_SRC, EXE_DST)
    print(f"Updated root Semestero-ME.exe successfully ({os.path.getsize(EXE_DST)} bytes)")
except Exception as e:
    ver_clean = PKG_VERSION.replace(".", "")
    alt_name = f"Semestero-ME-v{ver_clean}.exe"
    print(f"Note: Could not overwrite root Semestero-ME.exe directly ({e}). Copying to {alt_name}...")
    alt_dst = os.path.join(ROOT, alt_name)
    shutil.copy2(EXE_SRC, alt_dst)
    print(f"Created {alt_dst} successfully!")
