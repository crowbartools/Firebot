"use strict";

const Roll = require("roll");
const { TwitchApi } = require("../../streaming-platforms/twitch/api");

const diceRoller = new Roll();

function processDice(diceConfig, showEach) {

    diceConfig = diceConfig?.replace(/ /g, "");

    if (!diceRoller.validate(diceConfig)) {
        return null;
    }

    const { result, rolled } = diceRoller.roll(diceConfig);

    if (!showEach) {
        return result;
    }

    return `${result} (${rolled.join(", ")})`;
}

async function handleDiceEffect(effect, trigger) {

    const { dice, chatter, whisper, resultType } = effect;

    const showEach = resultType === "individual";

    const output = processDice(dice, showEach);

    const username = trigger.metadata.username;

    const message = output != null ?
        `Dice Roll: ${username} rolled a ${output} on ${dice}.` :
        `Unable to roll "${dice}" as it's not in the correct format.`;

    if (whisper) {
        const user = await TwitchApi.users.getUserByName(whisper);
        await TwitchApi.whispers.sendWhisper(user.id, message, chatter.toLowerCase() === "bot");
    } else {
        await TwitchApi.chat.sendChatMessage(message, null, chatter.toLowerCase() === "bot");
    }
}

exports.handleDiceEffect = handleDiceEffect;
exports.processDice = processDice;
