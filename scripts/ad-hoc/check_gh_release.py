import urllib.request, json

try:
    req = urllib.request.Request(
        'https://api.github.com/repos/adir2368/Semestero-ME/releases/latest',
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print("Latest Release tag_name:", data.get('tag_name'))
        print("Release Name:", data.get('name'))
        for asset in data.get('assets', []):
            print("Asset:", asset.get('name'), asset.get('browser_download_url'))
except Exception as e:
    print("Error fetching latest release:", e)
