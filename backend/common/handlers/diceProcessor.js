"use strict";

const Roll = require("roll");

const twitchChat = require("../../chat/twitch-chat");

const logger = require("../../logwrapper");

function diceProcessor(effect, trigger) {
    const roll = new Roll();

    try {
        // Get user specific settings
        let dice = effect.dice;
        dice = dice.replace(/ /g, "");

        const chatter = effect.chatter;
        const whisperTarget = effect.whisper;
        const username = trigger.metadata.username;

        // Validate user input.
        const valid = roll.validate(dice);

        if (!valid) {
            renderWindow.webContents.send(
                "error",
                `We tried to roll ${dice} but it is not in the correct format.`
            );
        } else {
            // Roll the dice!
            let rolledDice = roll.roll(dice);

            let diceResults = "";
            const individualRolls = rolledDice.rolled;
            const sumOfRolls = rolledDice.result;

            if (effect.resultType === "individual") {
                diceResults = `${sumOfRolls} (${individualRolls})`;
            } else {
                diceResults = roll.roll(dice).result;
            }

            // Put together the message
            const message = `Dice Roll: ${username} rolled a ${diceResults} on ${dice}.`;

            twitchChat.sendChatMessage(message, whisperTarget, chatter);
        }
    } catch (err) {
        logger.error(err);
        renderWindow.webContents.send(
            "error",
            "There was an error with a dice button."
        );
    }
}

// Export Functions
exports.send = diceProcessor;
