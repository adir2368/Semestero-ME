import json, sys

sys.stdout.reconfigure(encoding='utf-8')

user_inputs = []
with open(r'C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        if d.get('type') == 'USER_INPUT':
            user_inputs.append((d.get('step_index'), d.get('content')))

for step, content in user_inputs[-10:]:
    print(f"--- Step {step} ---")
    print(content)
