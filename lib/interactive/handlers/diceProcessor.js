const Roll = require('roll');
const chat = require('../mixer-chat.js');

function diceProcessor(effect, participant){
    roll = new Roll();

    try{
        // Get user specific settings
        var dice = effect.dice;
        dice = dice.replace(/ /g,'');
        
        var chatter = effect.chatter;
        var whisper = effect.whisper;
        var username = participant.username;

        // Validate user input.
        var valid = roll.validate(dice);
        
        if (!valid) {
            renderWindow.webContents.send('error', "We tried to roll "+dice+" but it is not in the correct format.");
        } else {

            // Roll the dice!
            var rolledDice = roll.roll(dice);
            
            var diceResults = "";
            var individualRolls = rolledDice.rolled;
            var sumOfRolls = rolledDice.result;     
              
            if(effect.resultType === 'individual') {
              diceResults = `${sumOfRolls} (${individualRolls})`;
            } else {
              diceResults = roll.roll(dice).result;
            }

            // Put together the message
            var message = `Dice Roll: ${username} rolled a ${diceResults} on ${dice}.`;

            // Send off the chat packet.
            if(whisper != null && whisper !== ""){
                // If there is a username variable in the whisper field, replace it.
                var whisper = whisper.replace('$(user)', username);
                // Send a whisper
                console.log('sending dice whisper', chatter, whisper, message);
                chat.whisper(chatter, whisper, message);
            } else {
                // Send a broadcast
                console.log('sending dice broadcast', chatter, message);
                chat.broadcast(chatter, message);
            }
        }

    }catch(err){
        console.log(err);
        renderWindow.webContents.send('error', "There was an error with a dice button.");
    }
}

// Export Functions
exports.send = diceProcessor;