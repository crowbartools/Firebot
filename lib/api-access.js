
"use strict";

const request = require("request");
const accountAccess = require("./common/account-access");
const CLIENT_ID = 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9';

exports.requestAsStreamer = function(method, route, body, apiVersion = "v1") {
    return new Promise((resolve, reject) => {
        let streamerData = accountAccess.getAccounts().streamer;

        if (apiVersion !== "v1") {
            apiVersion = "v2";
        }

        let options = {
            url: `https://mixer.com/api/${apiVersion}/${route}`,
            method: method,
            headers: {
                'User-Agent': 'Firebot',
                'Authorization': `Bearer ${streamerData.accessToken}`,
                'Client-ID': CLIENT_ID
            },
            json: true,
            body: body
        };

        request(options, function(err, res) {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject(err);
            }
        });
    });
};

exports.get = function(route, apiVersion) {
    return exports.requestAsStreamer("GET", route, null, apiVersion);
};

exports.post = function(route, body, apiVersion) {
    return exports.requestAsStreamer("POST", route, body, apiVersion);
};