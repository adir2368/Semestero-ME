import urllib.request, json

try:
    res = urllib.request.urlopen('http://127.0.0.1:9222/json')
    data = json.loads(res.read())
    print('Open Chrome Tabs:')
    for tab in data:
        print(f"{tab.get('id')}: {tab.get('title')} ({tab.get('url')})")
except Exception as e:
    print('Error:', e)
