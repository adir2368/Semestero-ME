import json

transcript_path = r'C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index', 0) >= 56740:
            if data.get('type') == 'USER_INPUT':
                print(f"Step {data.get('step_index')}: {data.get('content')}")
                if 'media' in data:
                    print(f"Media: {data['media']}")
