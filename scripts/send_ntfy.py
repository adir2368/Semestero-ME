import sys
import argparse
import base64
import urllib.request
import urllib.error

DONE_TOPIC = "adir-antigravity-done"

def send_ntfy(title: str, message: str, priority: str = "default", tags: str = "tada,smartphone"):
    url = f"https://ntfy.sh/{DONE_TOPIC}"
    encoded_title = "=?UTF-8?B?" + base64.b64encode(title.encode("utf-8")).decode("ascii") + "?="
    headers = {
        "Title": encoded_title,
        "Priority": priority,
        "Content-Type": "text/plain; charset=utf-8"
    }
    if tags:
        headers["Tags"] = tags

    try:
        req = urllib.request.Request(url, data=message.encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[NTFY] Notification sent successfully: HTTP {resp.status}")
            return True
    except Exception as e:
        print(f"[NTFY] Failed to send notification: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send NTFY push notification to user's phone")
    parser.add_argument("--title", required=True, help="Notification title")
    parser.add_argument("--message", required=True, help="Notification message body")
    parser.add_argument("--priority", default="default", help="Priority (min, low, default, high, urgent)")
    parser.add_argument("--tags", default="tada,smartphone", help="Comma-separated emoji tags")
    args = parser.parse_args()

    send_ntfy(args.title, args.message, args.priority, args.tags)
