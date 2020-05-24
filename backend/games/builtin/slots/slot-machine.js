"use strict";
const chat = require("../../../common/mixer-chat");
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

async function spin(username, successChance) {

    let successCount = 0;

    chat.smartSend(`${username} pulls back the lever...`);

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {

        await util.wait(2000);

        const successfulRoll = util.getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }

        chat.smartSend(`${getSpinLabel(currentSpin)} reel stops, it's a ${successfulRoll ? 'HIT' : 'MISS'}`, username);
    }

    return successCount;
}

exports.spin = spin;