const https = require('https');

const getUrl = 'https://asxpbepuvhbafsjlogag.supabase.co/rest/v1/user_states?user_id=eq.adir_moshe';
const apiKey = 'sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy';
const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

https.get(getUrl, { headers }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const rows = JSON.parse(data);
            if (!rows || rows.length === 0) {
                console.log("No row found.");
                return;
            }
            const record = rows[0];
            const state = record.state_json;
            console.log("Found record, courses count before:", Object.keys(state.courses || {}).length);

            // Infiltrators to delete
            const targets = ['03940800', '3940800', '0394800', '394800', '03940808', '3940808', '0394808', '394808', '03240269', '3240269'];
            let deletedCount = 0;
            targets.forEach(t => {
                if (state.courses && state.courses[t]) {
                    delete state.courses[t];
                    deletedCount++;
                }
            });
            console.log(`Deleted ${deletedCount} infiltrators from state.courses`);

            // Also check degreePlan
            if (Array.isArray(state.degreePlan)) {
                state.degreePlan.forEach(s => {
                    if (s.semester === 4 && Array.isArray(s.courses)) {
                        s.courses = s.courses.filter(c => {
                            const code = c.code || '';
                            const alt = c.altCode || '';
                            return !targets.includes(code) && !targets.includes(alt);
                        });
                    }
                });
            }

            state.lastModified = Date.now();
            const patchBody = JSON.stringify({
                state_json: state,
                updated_at: new Date().toISOString()
            });

            const patchReq = https.request('https://asxpbepuvhbafsjlogag.supabase.co/rest/v1/user_states?user_id=eq.adir_moshe', {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(patchBody)
                }
            }, (patchRes) => {
                let pData = '';
                patchRes.on('data', chunk => pData += chunk);
                patchRes.on('end', () => {
                    console.log("PATCH status:", patchRes.statusCode);
                    console.log("PATCH response:", pData.slice(0, 300));
                });
            });

            patchReq.on('error', e => console.error("PATCH error:", e));
            patchReq.write(patchBody);
            patchReq.end();

        } catch (e) {
            console.error("Error in update:", e);
        }
    });
});
