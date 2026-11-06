import os
import sys
import subprocess

# Standalone script to send token renewal reminder via NTFY
script_dir = os.path.dirname(os.path.abspath(__file__))
send_script = os.path.join(script_dir, "send_ntfy.py")

msg = "Tokens have renewed! Your Gemini quota is refreshed and ready to build Semestero ME v2.10.4."
title = "🚀 Tokens Renewed: Ready for v2.10.4!"

# Dispatch to adir-antigravity-done
cmd1 = [sys.executable, send_script, "--topic", "adir-antigravity-done", "--title", title, "--message", msg, "--priority", "high", "--tags", "tada,sparkles,bell"]
subprocess.run(cmd1)

# Dispatch to adir-semestero-me-updates
cmd2 = [sys.executable, send_script, "--topic", "adir-semestero-me-updates", "--title", title, "--message", msg, "--priority", "high", "--tags", "tada,sparkles"]
subprocess.run(cmd2)

print("Reminder sent to NTFY topics successfully.")
