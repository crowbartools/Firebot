"use strict";
const twitchChat = require("../../../chat/twitch-chat");
const util = require("../../../utility");

const SPIN_COUNT = 3;

async function spin(showSpinInActionMsg, spinInActionMsg, successChance, chatter) {

    let successCount = 0;

    if (showSpinInActionMsg) {
        await twitchChat.sendChatMessage(spinInActionMsg, null, chatter);
    }

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {

        await util.wait(750);

        const successfulRoll = util.getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }
    }

    return successCount;
}

exports.spin = spin;