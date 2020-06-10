"use strict";
const chat = require("../../../chat/chat");
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

async function spin(username, successChance, chatter) {

    let successCount = 0;

    chat.sendChatMessage(`${username} pulls back the lever...`, null, chatter);

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {

        await util.wait(1750);

        const successfulRoll = util.getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }

        chat.sendChatMessage(`${getSpinLabel(currentSpin)} reel stops, it's a ${successfulRoll ? 'HIT' : 'MISS'}`, username, chatter);
    }

    await util.wait(750);

    return successCount;
}

exports.spin = spin;