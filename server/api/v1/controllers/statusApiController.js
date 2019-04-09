"use strict";

const mixerInteractive = require('../../../lib/common/mixer-interactive.js');
const chat = require('../../../lib/common/mixer-chat.js');
const constellation = require("../../../lib/live-events/mixer-constellation");

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
