const JsonDB = require('node-json-db');
const request = require('request');
const {ipcRenderer} = require('electron')

// JSON DBs
var dbAuth = new JsonDB("./json/auth", true, false);

// Beam OAuth
// Takes info recieved from main process and processes it to save oauth info and such.
ipcRenderer.on('oauth-complete', function (event, token, streamOrBot){
    requestBeamData(token, streamOrBot);
})

// Beam User Info
// After OAuth is successful, this will grab info and save it. Then kick off putting info on the page.
function requestBeamData(token, streamOrBot) {
    request({
        url: 'https://beam.pro/api/v1/users/current',
        auth: {
            'bearer': token
        }
    }, function(err, res) {
        var data = JSON.parse(res.body);
        //Save Login Info
        if (streamOrBot == "streamer"){
            dbAuth.push('/streamer', { "channelID": data.channel.id, "username": data.username, "token": token, "avatarUrl": data.avatarUrl });
        } else {
            dbAuth.push('/bot', { "botChannelID": data.channel.id, "botUsername": data.username, "botToken": token, "botAvatarUrl": data.avatarUrl });
        }
        
        //Load up avatar and such on login page. 
        savedLogin(streamOrBot, data.channel.id, data.username, data.avatarUrl);

    });
};

// Saved Login Post
// This takes the saved login info and puts things onto the login page such as the user avatar.
function savedLogin(streamOrBot, channelID, username, avatarUrl){
    if(streamOrBot == "streamer"){
        // Put streamer info on page.
        console.log(streamOrBot, channelID, username, avatarUrl);
    } else {
        // Put bot info on page.

    }
}

// Login Pressed
// This sends an alert to the main process that the login button was pressed and we need the oauth info to be sent back.
$( ".streamer-login, .bot-login" ).click(function() {
    var streamOrBot = $(this).attr('data');
    ipcRenderer.send('oauth-login', streamOrBot);
});