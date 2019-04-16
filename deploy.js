"use strict";
const https = require('https');

const data = JSON.stringify({
    request: {
        message: `# Build triggered from Firebot\r\n\r\n--\r\n${process.env.TRAVIS_COMMIT_MESSAGE}`,
        branch: 'master'
    }
});

const req = https.request(
    {
        method: 'POST',
        hostname: 'api.travis-ci.org',
        path: '/repo/crowbartools%2Ffirebot-dev-builds/requests',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Travis-API-Version": "3",
            "Authorization": `token ${process.env.DEVBUILD_API_KEY}`,
            "Content-length": data.length
        }
    },
    res => {
        if (res.statusCode < 200 || res.statusCode > 299) {
            console.warn(`server responded with: ${res.statusCode}`);
        }

        req.on('data', data => console.log(data));
    }
);
req.on('error', err => {
    console.error(err.message);
});
req.write(data);
req.end();
