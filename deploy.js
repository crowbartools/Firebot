"use strict";
const https = require('https');

const data = JSON.stringify({
    request: {
        message: 'Build triggered from FireBot',
        branch: 'source'
    }
});

const options = {
    hostname: 'api.travis-ci.org',
    port: 443,
    path: '/repo/crowbartools%2Ffirebot-dev-builds/requests',
    method: 'POST',
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Travis-API-Version": "3",
        "Authorization": `token ${process.env.DEVBUILD_API_KEY}`,
        "Content-length": data.length
    }
};


const req = https.request(options);
req.write(data);
req.end();
