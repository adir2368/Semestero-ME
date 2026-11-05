import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        step = d.get('step_index', 0)
        if step >= 72923:
            t = d.get('type')
            tc = d.get('tool_calls')
            if tc:
                calls = [c.get('name') for c in tc]
                print(f"Step {step} [{t}]: calls={calls}")
            else:
                c = d.get('content') or ''
                print(f"Step {step} [{t}]: {c[:100]}...")
