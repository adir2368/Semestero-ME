import urllib.request
import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://idofangbentov.uk/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Fetched homepage ({len(html)} bytes)")

        # Find all links
        links = re.findall(r'href=["\']([^"\']+)["\']', html)
        technion_links = [l for l in links if 'technion' in l.lower() or '/technion/' in l.lower()]
        
        # Also find all text containing course codes or names
        print("\n=== Technion Links Found on Pangea ===")
        for l in sorted(set(technion_links)):
            print("  ", l)

        # Check if there are internal pages or sitemaps
        sitemap_req = urllib.request.Request('https://idofangbentov.uk/sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(sitemap_req) as s_resp:
                s_xml = s_resp.read().decode('utf-8', errors='ignore')
                s_urls = re.findall(r'<loc>([^<]+)</loc>', s_xml)
                print(f"\n=== Sitemap URLs ({len(s_urls)}) ===")
                for u in s_urls:
                    if 'technion' in u.lower():
                        print("  ", u)
        except Exception as se:
            print("No sitemap or error:", se)

except Exception as e:
    print("Error fetching Pangea:", e)
