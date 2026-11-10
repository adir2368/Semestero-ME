import json
import urllib.request
import urllib.error
import sys

def ping_indexnow():
    host = "semestero.me"
    key = "c8e4a92f1d7b460395a1e2f4b8c7d6e5"
    key_location = "https://semestero.me/Semestero-ME/c8e4a92f1d7b460395a1e2f4b8c7d6e5.txt"
    urls = [
        "https://semestero.me/Semestero-ME/",
        "https://semestero.me/Semestero-ME/guide.html",
        "https://semestero.me/Semestero-ME/?tab=curriculum",
        "https://semestero.me/Semestero-ME/?tab=planner",
        "https://semestero.me/Semestero-ME/?tab=tasks",
        "https://semestero.me/Semestero-ME/?tab=calendar",
        "https://semestero.me/Semestero-ME/?tab=timetable",
        "https://semestero.me/Semestero-ME/?tab=settings",
        "https://semestero.me/Semestero-ME/llms.txt",
        "https://semestero.me/Semestero-ME/sitemap.xml"
    ]

    payload = {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls
    }

    endpoints = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow"
    ]

    data = json.dumps(payload).encode('utf-8')
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Semestero-ME-IndexNow-Client/2.10"
    }

    results = {}
    for endpoint in endpoints:
        req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                print(f"[IndexNow] {endpoint} -> Status {resp.status} ({resp.reason})")
                results[endpoint] = resp.status
        except urllib.error.HTTPError as e:
            print(f"[IndexNow] {endpoint} -> HTTPError {e.code}: {e.read().decode('utf-8', errors='ignore')}")
            results[endpoint] = e.code
        except Exception as e:
            print(f"[IndexNow] {endpoint} -> Error: {e}")
            results[endpoint] = str(e)

    return results

if __name__ == "__main__":
    res = ping_indexnow()
    print("Results:", res)
