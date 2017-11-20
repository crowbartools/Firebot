'use strict';

const Roll = require('roll');
const chat = require('../mixer-chat.js');

function diceProcessor(effect, participant) {
    let roll = new Roll();

    try {
        // Get user specific settings
        let dice = effect.dice;
        dice = dice.replace(/ /g, '');

        let chatter = effect.chatter;
        let whisper = effect.whisper;
        let username = participant.username;

        // Validate user input.
        let valid = roll.validate(dice);

        if (!valid) {
            renderWindow.webContents.send('error', "We tried to roll " + dice + " but it is not in the correct format.");
        } else {

            // Roll the dice!
            let rolledDice = roll.roll(dice);

            let diceResults = "";
            let individualRolls = rolledDice.rolled;
            let sumOfRolls = rolledDice.result;

            if (effect.resultType === 'individual') {
                diceResults = `${sumOfRolls} (${individualRolls})`;
            } else {
                diceResults = roll.roll(dice).result;
            }

            // Put together the message
            let message = `Dice Roll: ${username} rolled a ${diceResults} on ${dice}.`;

            // Send off the chat packet.
            if (whisper !== null && whisper !== undefined && whisper !== "") {
                // If there is a username variable in the whisper field, replace it.
                let whisper = whisper.replace('$(user)', username);
                // Send a whisper
                console.log('sending dice whisper', chatter, whisper, message);
                chat.whisper(chatter, whisper, message);
            } else {
                // Send a broadcast
                console.log('sending dice broadcast', chatter, message);
                chat.broadcast(chatter, message);
            }
        }

    } catch (err) {
        console.log(err);
        renderWindow.webContents.send('error', "There was an error with a dice button.");
    }
}

// Export Functions
exports.send = diceProcessor;
