import os, json, glob, re

logs = glob.glob(r'C:\Users\user\.gemini\antigravity\brain\*\.system_generated\logs\transcript.jsonl')
print(f"Found {len(logs)} transcripts")

for log_path in logs:
    conv_id = log_path.split('\\')[7] if '\\' in log_path else log_path.split('/')[7]
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if any(term in line for term in ['0394', '0324', 'add-to-plan', 'addToPlan', 'customPlan', 'elective', 'infiltrat']):
                # Find course codes
                codes = re.findall(r'(0394\d{4}|0324\d{4})', line)
                if codes:
                    print(f"Conv {conv_id}: codes {set(codes)}")
