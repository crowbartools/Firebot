"use strict";

const mixerInteractive = require('../../../../backend/common/mixer-interactive.js');
const chat = require('../../../../backend/common/mixer-chat.js');
const constellation = require("../../../../backend/live-events/mixer-constellation");

exports.getStatus = function(req, res) {
    let status = {
        connections: {
            interactive: mixerInteractive.getInteractiveStatus(),
            chat: chat.getChatStatus(),
            constellation: constellation.getConstellationStatus()
        }
    };
    res.json(status);
};
