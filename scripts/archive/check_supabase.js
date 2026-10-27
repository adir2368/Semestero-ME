const https = require('https');

const url = 'https://asxpbepuvhbafsjlogag.supabase.co/rest/v1/user_states?user_id=eq.adir_moshe';
const options = {
    headers: {
        'apikey': 'sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy',
        'Authorization': 'Bearer sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Supabase response status:", res.statusCode);
            if (json && json[0] && json[0].state_json) {
                const s = json[0].state_json;
                console.log("Courses in Supabase:", Object.keys(s.courses || {}).length);
                const infiltrators = ['03940800', '03940808', '3940800', '3940808', '03240269'];
                for (const inf of infiltrators) {
                    if (s.courses && s.courses[inf]) {
                        console.log(`FOUND ${inf} in Supabase courses!`);
                    }
                }
                if (s.degreePlan) {
                    const sem4 = s.degreePlan.find(x => x.semester === 4);
                    if (sem4) {
                        console.log("Semester 4 in Supabase degreePlan courses:", (sem4.courses || []).map(c => c.code));
                    }
                }
            } else {
                console.log("No data or different format:", data.slice(0, 300));
            }
        } catch(e) {
            console.error("Parse error:", e, data);
        }
    });
}).on('error', err => {
    console.error("Request error:", err);
});
