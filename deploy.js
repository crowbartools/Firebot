"use strict";
const https = require('https');

const data = JSON.stringify({
    request: {
        message: 'Build triggered from FireBot',
        branch: 'source'
    }
});

const req = https.request(
    'https://api.travis-ci.org/repo/crowbartools%2Ffirebot-dev-builds/requests',
    {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Travis-API-Version": "3",
            "Authorization": `token ${process.env.DEVBUILD_API_KEY}`,
            "Content-length": data.length
        }
    },
    res => {
        if (res.statusCode !== 200) {
            throw new Error(`server responded with: ${res.statusCode}`);
        }

        req.on('data', data => console.log(data));
    }
).on('error', err => {
    console.error(err.message);
});
req.write(data);
req.end();
