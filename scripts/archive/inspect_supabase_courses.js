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
        const json = JSON.parse(data);
        const s = json[0].state_json;
        console.log("03940800 in Supabase:", JSON.stringify(s.courses['03940800'], null, 2));
        console.log("03940808 in Supabase:", JSON.stringify(s.courses['03940808'], null, 2));
    });
});
