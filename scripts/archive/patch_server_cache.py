fp = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\server.js"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

old_res = """        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*'
        });"""

new_res = """        const headers = {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*'
        };

        if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' || reqPath === '/sw.js') {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = '0';
        }

        res.writeHead(200, headers);"""

assert old_res in content, "old_res not found in server.js"
content = content.replace(old_res, new_res, 1)

with open(fp, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched server.js with Cache-Control headers!")
