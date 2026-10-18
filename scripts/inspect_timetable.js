const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9339;
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_inspect_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?inspect=${Date.now()}`;

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.id = 1;
        this.callbacks = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    cb(msg);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve) => {
            const reqId = this.id++;
            this.callbacks.set(reqId, (msg) => resolve(msg.result));
            this.ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        return res && res.result ? res.result.value : null;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function run() {
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--window-size=1200,800',
        TARGET_URL
    ]);

    await delay(1500);

    try {
        const tabs = await getJson(`http://127.0.0.1:${PORT}/json`);
        const page = tabs.find(t => t.type === 'page');
        const cdp = new CDPClient(page.webSocketDebuggerUrl);
        await cdp.connect();
        await delay(1500);

        // Set user to adir_moshe
        await cdp.evaluate(`
            localStorage.setItem('ast_is_developer_device', 'true');
            localStorage.setItem('ast_profile_adir_moshe', JSON.stringify({ id: 'adir_moshe', name: 'אדיר משה' }));
            localStorage.setItem('ast_logged_in_user', 'adir_moshe');
            if (window.AuthSync) {
                window.AuthSync.currentUser = 'adir_moshe';
            }
        `);
        await cdp.evaluate("location.reload()");
        await delay(2000);

        // Click timetable tab
        await cdp.evaluate("document.getElementById('tab-timetable').click()");
        await delay(500);

        const data = await cdp.evaluate(`
            (() => {
                const cards = Array.from(document.querySelectorAll('.timetable-card')).map(c => {
                    const roomEl = c.querySelector('.timetable-card-room-bar');
                    const timeEl = c.querySelector('.timetable-card-time');
                    const lecturerEl = c.querySelector('.timetable-lecturer') || c.querySelector('.ttg-card-instructor');
                    const titleEl = c.querySelector('.timetable-card-title') || c.querySelector('.timetable-card-name');
                    const tagEl = c.querySelector('.timetable-tag');
                    return {
                        tag: tagEl ? tagEl.innerText : '',
                        time: timeEl ? timeEl.innerText : '',
                        room: roomEl ? roomEl.innerText : '(NO ROOM EL)',
                        lecturer: lecturerEl ? lecturerEl.innerText : '(NO LECTURER)',
                        title: titleEl ? titleEl.innerText : '',
                        allText: c.innerText.replace(/\\n/g, ' -- ')
                    };
                });

                const rawSchedule = typeof getActiveTimetableSchedule === 'function' ? getActiveTimetableSchedule() : null;
                const stateTimetable = window.gameState && window.gameState.timetable ? window.gameState.timetable : null;
                const cheeseforkSchedule = typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' ? CHEESEFORK_SEMESTER_SCHEDULE : null;
                const legacySave = localStorage.getItem('academic_skill_tree_save');
                let parsedLegacy = null;
                try { if (legacySave) parsedLegacy = JSON.parse(legacySave); } catch(e){}

                return {
                    cardsCount: cards.length,
                    cards: cards,
                    hasStateTimetable: !!stateTimetable,
                    stateClassesCount: stateTimetable ? stateTimetable.days.flatMap(d => d.classes).length : 0,
                    stateTimetableSource: stateTimetable ? stateTimetable.source : null,
                    stateTimetableSampleClass: stateTimetable ? stateTimetable.days[0].classes[0] : null,
                    legacyHasTimetable: !!(parsedLegacy && parsedLegacy.timetable),
                    legacySampleClass: (parsedLegacy && parsedLegacy.timetable && parsedLegacy.timetable.days[0]) ? parsedLegacy.timetable.days[0].classes[0] : null,
                    cfClassesCount: cheeseforkSchedule ? cheeseforkSchedule.days.flatMap(d => d.classes).length : 0,
                    cfSampleClass: cheeseforkSchedule ? cheeseforkSchedule.days[0].classes[0] : null,
                    isAdir: window.AuthSync ? window.AuthSync.isAdirActive() : null
                };
            })()
        `);

        console.log('TIMETABLE CARDS AUDIT:');
        console.log(JSON.stringify(data, null, 2));

        const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
        if (screenshotRes && screenshotRes.data) {
            const outPath = "C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\\browser_audit_authentic_rooms_verified.png";
            fs.writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
            console.log('Saved screenshot to:', outPath);
        }

        cdp.close();
        chrome.kill();
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        chrome.kill();
        process.exit(1);
    }
}

run();
