"use strict";

let pollActivelyRunning = false;

function setPollActivelyRunning(duration = 0) {
    pollActivelyRunning = true;
    setTimeout(() => {
        pollActivelyRunning = false;
    }, duration);
}

exports.pollStart = {
    accountType: "streamer",
    event: "PollStart",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        data.fbEvent = "PollStart";
        renderWindow.webContents.send("chatUpdate", data);

        if (!pollActivelyRunning) {
            setPollActivelyRunning(data.duration);
            eventManager.triggerEvent("mixer", "poll-started", {
                username: data.author.user_name,
                data: data
            });
        } else {
            eventManager.triggerEvent("mixer", "poll-update", {
                username: data.author.user_name,
                data: data
            });
        }
    }
};

exports.pollEnd = {
    accountType: "streamer",
    event: "PollEnd",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        data.fbEvent = "PollEnd";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "poll-ended", {
            username: data.author.user_name,
            data: data
        });
    }
};