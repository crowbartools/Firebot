
"use strict";

const request = require("request");
const accountAccess = require("./common/account-access");
const CLIENT_ID = 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9';


function buildRequestOptions(method, route, body, apiVersion = "v1", authAsStreamer = true) {
    if (apiVersion !== "v1") {
        apiVersion = "v2";
    }

    let options = {
        url: `https://mixer.com/api/${apiVersion}/${route}`,
        method: method,
        headers: {
            'User-Agent': 'Firebot v5',
            'Client-ID': CLIENT_ID
        },
        json: true,
        body: body
    };

    if (authAsStreamer) {
        let streamerData = accountAccess.getAccounts().streamer;
        options.headers.Authorization = `Bearer ${streamerData.accessToken}`;
    }

    return options;
}

function promisifiedRequest(options, resolveResponse = false) {
    return new Promise((resolve, reject) => {

        request(options, function(err, res) {
            if (res.statusCode === 200) {
                if (resolveResponse) {
                    resolve(res);
                } else {
                    resolve(res.body);
                }
            } else {
                reject(err);
            }
        });
    });
}

exports.requestWithoutAuth = function(method, route, body, apiVersion, resolveResponse) {

    let options = buildRequestOptions(method, route, body, apiVersion, false);

    return promisifiedRequest(options, resolveResponse);
};

exports.requestAsStreamer = function(method, route, body, apiVersion, resolveResponse) {

    let options = buildRequestOptions(method, route, body, apiVersion, true);

    return promisifiedRequest(options, resolveResponse);
};

exports.get = function(route, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("GET", route, null, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};

exports.post = function(route, body, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("POST", route, body, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};

exports.patch = function(route, body, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("PATCH", route, body, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};