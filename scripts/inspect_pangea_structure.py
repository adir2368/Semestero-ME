import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = [
    'https://idofangbentov.uk/',
    'https://idofangbentov.uk/Technion/',
    'https://idofangbentov.uk/Technion/THE1/',
    'https://idofangbentov.uk/Technion/SLD2/'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            print(f"URL: {url} -> {resp.status}, length: {len(content)}")
            # Find title
            title = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
            print(f"  Title: {title.group(1) if title else 'No title'}")
            # Find links
            links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', content)
            sub_links = [l for l in links if not l.startswith('http') or 'idofangbentov' in l]
            print(f"  Internal/Sub Links count: {len(sub_links)}")
            print(f"  Sample sub links: {sub_links[:8]}")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
