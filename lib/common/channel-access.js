"use strict";

const accountAccess = require("../common/account-access");
const request = require("request");

function requestAsStreamer(method, route, body) {
    return new Promise(resolve => {
    //updating account cache
        accountAccess.updateAccountCache();

        let streamerData = accountAccess.getAccounts().streamer;

        let options = {
            url: `https://mixer.com/api/v1/${route}`,
            method: method,
            headers: {
                "User-Agent": "MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)",
                Authorization: `Bearer ${streamerData.accessToken}`
            },
            json: true,
            body: body
        };

        request(options, function(err, res) {
            resolve(res);
        });
    });
}

function requestWithoutAuth(method, route, body) {
    return new Promise(resolve => {
        let options = {
            url: `https://mixer.com/api/v1/${route}`,
            method: method,
            headers: {
                "User-Agent": "MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)"
            },
            json: true,
            body: body
        };

        request(options, function(err, res, body) {
            resolve({
                error: err,
                response: res,
                body: body
            });
        });
    });
}

exports.getFollowDateForUser = function(username) {
    return new Promise(async resolve => {
        let streamerData = accountAccess.getAccounts().streamer;

        let followerData = await requestWithoutAuth(
            "GET",
            `channels/${streamerData.channelId}/follow?where=username:eq:${username}`
        );

        console.log(followerData.body);

        if (followerData.body == null || followerData.body.length < 1) {
            return resolve(null);
        }

        resolve(new Date(followerData.body[0].followed.createdAt));
    });
};

exports.getMixerAccountDetailsByUsername = function(username) {
    return new Promise(async resolve => {
        let response = await requestWithoutAuth("GET", `channels/${username}`);

        let userData = response.body;

        if (userData == null) {
            return resolve(null);
        }

        resolve(userData);
    });
};
