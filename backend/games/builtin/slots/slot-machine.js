"use strict";
const twitchChat = require("../../../chat/twitch-chat");
const util = require("../../../utility");

const SPIN_COUNT = 3;

function getSpinLabel(spinCount) {
    switch (spinCount) {
    case 1:
        return "First";
    case 2:
        return "Second";
    default:
        return "Third";
    }
}

async function spin(showSpinInActionMsg, spinInActionMsg, successChance, chatter) {

    let successCount = 0;

    if (showSpinInActionMsg) {
        twitchChat.sendChatMessage(spinInActionMsg, null, chatter);
    }

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {

        await util.wait(750);

        const successfulRoll = util.getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }

        //twitchChat.sendChatMessage(`${getSpinLabel(currentSpin)} reel stops, it's a ${successfulRoll ? 'HIT' : 'MISS'}`, username, chatter);
    }

    return successCount;
}

exports.spin = spin;