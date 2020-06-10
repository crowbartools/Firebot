"use strict";

const chat = require("../../../../backend/chat/chat");
const mixplay = require("../../../../backend/interactive/mixplay");
const constellation = require("../../../../backend/events/constellation");

exports.getStatus = function(req, res) {
    let status = {
        connections: {
            interactive: mixplay.mixplayIsConnected(),
            chat: chat.chatIsConnected(),
            constellation: constellation.constellationIsConnected()
        }
    };
    res.json(status);
};
