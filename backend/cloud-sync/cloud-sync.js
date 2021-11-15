"use strict";

const logger = require("../logwrapper");
const request = require("request");

function sync(jsonData) {
    return new Promise(resolve => {
        request.post({
            url: 'https://bytebin.lucko.me/post',
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Content-Type': 'json',
                'Content-Encoding': 'gzip'
            },
            body: JSON.stringify(jsonData)
        }, function(err, httpResponse, body) {
            if (httpResponse.statusCode === 429) {
                logger.error('Bytebin rate limit exceeded.');
                renderWindow.webContents.send(
                    "error",
                    "Bytebin rate limit exceeded."
                );
                resolve(null);
            } else if (err) {
                logger.error('Bytebin sync failed.', err);
                resolve(null);
            } else {
                body = JSON.parse(body);
                logger.debug('Bytebin key: ' + body.key);
                resolve(body.key);
            }
        });
    });
}

function getData(shareCode) {
    return new Promise(resolve => {
        request.get({
            url: `https://bytebin.lucko.me/${shareCode}`,
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app'
            },
            json: true
        }, function(err, httpResponse, body) {
            if (!err && httpResponse.statusCode === 200) {
                resolve(JSON.parse(unescape(JSON.stringify(body))));
            } else {
                resolve(null);
            }
        });
    });
}

exports.sync = sync;
exports.getData = getData;