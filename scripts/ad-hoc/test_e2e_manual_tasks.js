const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 8089;
const CHROME_PORT = 9749;

// 1. Static file server
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '../../', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not Found");
        return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
    console.log(`Server started on http://localhost:${PORT}`);
    
    // Launch headless Chrome
    const chrome = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${CHROME_PORT}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--disable-extensions',
        `http://localhost:${PORT}`
    ]);

    let ws = null;

    try {
        await new Promise(r => setTimeout(r, 2000));
        
        // Fetch CDP endpoint
        const endpoints = await new Promise((resolve, reject) => {
            http.get(`http://localhost:${CHROME_PORT}/json`, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const target = endpoints.find(e => e.type === 'page');
        if (!target) throw new Error("No page target found");

        ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });

        let msgId = 1;
        const callbacks = new Map();
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id && callbacks.has(msg.id)) {
                const cb = callbacks.get(msg.id);
                callbacks.delete(msg.id);
                if (msg.error) cb.reject(msg.error);
                else cb.resolve(msg.result);
            }
        };

        function send(method, params = {}) {
            return new Promise((resolve, reject) => {
                const id = msgId++;
                callbacks.set(id, { resolve, reject });
                ws.send(JSON.stringify({ id, method, params }));
            });
        }

        // Wait for page ready
        await send('Runtime.enable');
        await new Promise(r => setTimeout(r, 2500));

        // Evaluate manual task addition and verify visibility in Notion tasks table
        const testResult = await send('Runtime.evaluate', {
            expression: `(function() {
                try {
                    // Navigate to Tasks tab
                    if (typeof switchTab === 'function') switchTab('tasks');
                    else if (typeof window.switchWorkspaceTab === 'function') window.switchWorkspaceTab('tasks');

                    // Select a course (first available active course)
                    const courseCodes = Object.keys(window.gameState.courses);
                    const courseCode = courseCodes.find(c => window.gameState.courses[c].status === 'active') || courseCodes[0];
                    const course = window.gameState.courses[courseCode];
                    if (!course) return { success: false, reason: "No courses found in gameState" };

                    // Open course modal
                    openCourseDetails(course.code);

                    const titleInput = document.getElementById("input-quest-title");
                    const typeInput = document.getElementById("input-quest-type");
                    const dateInput = document.getElementById("input-quest-date");

                    if (!titleInput || !typeInput || !dateInput) {
                        return { success: false, reason: "Form elements missing: " + JSON.stringify({ hasTitle: !!titleInput, hasType: !!typeInput, hasDate: !!dateInput }) };
                    }

                    titleInput.value = "מטלת בונוס עצמאית";
                    typeInput.value = "hw";
                    dateInput.value = "2026-11-28";
                    
                    // Call saveQuest()
                    saveQuest();

                    const taskInCourse = course.tasks.find(t => t.title === "מטלת בונוס עצמאית");
                    if (!taskInCourse) {
                        return { success: false, reason: "Task was not added to course.tasks!", tasks: course.tasks };
                    }

                    // Re-render Notion tasks table
                    renderNotionTasksTable();

                    const tableBody = document.getElementById("notion-tasks-table-body");
                    const hasTaskRow = tableBody && tableBody.innerText.includes("מטלת בונוס עצמאית");

                    // Test Moodle deduplication preservation
                    window.MoodleSync.deduplicateCourseTasks(course);
                    const hasTaskAfterMoodleSync = course.tasks.some(t => t.title === "מטלת בונוס עצמאית" && t.source === "manual");

                    // Test with Focus Mode turned ON
                    const focusBtn = document.getElementById("notion-focus-toggle-btn");
                    if (focusBtn && !focusBtn.classList.contains("active")) {
                        focusBtn.click();
                    }
                    renderNotionTasksTable();
                    const hasTaskInFocusMode = tableBody && tableBody.innerText.includes("מטלת בונוס עצמאית");

                    return {
                        success: Boolean(hasTaskRow && hasTaskAfterMoodleSync && hasTaskInFocusMode),
                        hasTaskRow,
                        hasTaskAfterMoodleSync,
                        hasTaskInFocusMode
                    };
                } catch (e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            })()`,
            returnByValue: true
        });

        console.log("E2E Test Evaluation Result:", JSON.stringify(testResult.result.value, null, 2));
        if (testResult.result.value && testResult.result.value.success) {
            console.log("✅ E2E Manual Task Visibility Verification PASSED!");
        } else {
            console.error("❌ E2E Verification FAILED!", testResult.result.value);
            process.exitCode = 1;
        }

    } catch (err) {
        console.error("E2E Test Error:", err);
        process.exitCode = 1;
    } finally {
        if (ws) ws.close();
        chrome.kill();
        server.close();
    }
});
