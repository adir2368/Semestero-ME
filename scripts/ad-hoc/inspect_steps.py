import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        step = d.get('step_index', 0)
        if step in range(73040, 73051):
            print(f"Step {step}: {d.get('type')}")
            if d.get('tool_calls'):
                print(f"  Tool calls: {d.get('tool_calls')}")
            if d.get('content'):
                print(f"  Content: {d.get('content')[:300]}")
