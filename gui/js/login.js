const JsonDB = require('node-json-db');
const request = require('request');
const {ipcRenderer} = require('electron')

// JSON DBs
var dbAuth = new JsonDB("./user-settings/auth", true, false);

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

        //Load up avatar and such on login page. 
        login(streamOrBot, data.channel.id, data.username, token, data.avatarUrl);

        // Close auth window
        ipcRenderer.send('auth-close');
    });
};


// Log in
// This takes the saved login info and puts things onto the login page such as the user avatar.
function login(streamOrBot, channelID, username, token, avatar){

    if (streamOrBot == "streamer"){
        dbAuth.push('/streamer', { "channelID": channelID, "username": username, "token": token, "avatarUrl": avatar });
    } else if (streamOrBot == "bot") {
        dbAuth.push('/bot', { "channelID": channelID, "username": username, "token": token, "avatarUrl": avatar });
    }

    if(streamOrBot == "streamer"){
        $('.streamer .username h2').text(username);
        $('.streamer .avatar img').attr('src', avatar);
        $('.streamer .loginOrOut button').text('Logout').attr('status', 'logout');
    } else if (streamOrBot == "bot"){
        $('.bot .username h2').text(username);
        $('.bot .avatar img').attr('src', avatar);
        $('.bot .loginOrOut button').text('Logout').attr('status', 'logout');
    }
}

// Log out
// This sets everything back to default and deletes relevant user info.
function logout(streamOrBot){
    var defaultAvatar = "./images/placeholders/default.jpg";

    if (streamOrBot == "streamer"){
        dbAuth.delete('/streamer');
    } else if (streamOrBot == "bot") {
        dbAuth.delete('/bot');
    }

    if(streamOrBot == "streamer"){
        $('.streamer .username h2').text('Streamer');
        $('.streamer .avatar img').attr('src', defaultAvatar);
        $('.streamer .loginOrOut button').text('Login').attr('status', 'login');
    } else if (streamOrBot == "bot") {
        $('.bot .username h2').text('Bot');
        $('.bot .avatar img').attr('src', defaultAvatar);
        $('.bot .loginOrOut button').text('Login').attr('status', 'login');
    }
}

// Initial Load
// Checks to see if there is any login info saved, and if so then load up related ui elements.
function initialLogin(){
    try {
        var streamer = dbAuth.getData("/streamer");
        var username = streamer.username;
        var avatar = streamer.avatarUrl;
        $('.streamer .username h2').text(username);
        $('.streamer .avatar img').attr('src', avatar);
        $('.streamer .loginOrOut button').text('Logout').attr('status', 'logout');
    } catch(error) {

    }

    try {
        var bot = dbAuth.getData("/bot");
        var username = bot.username;
        var avatar = bot.avatarUrl;
        $('.bot .username h2').text(username);
        $('.bot .avatar img').attr('src', avatar);
        $('.bot .loginOrOut button').text('Logout').attr('status', 'logout');
    } catch(error) {

    }
}

// Login or out button pressed
// This checks if button is logging in or out a person or bot. If logging in then it sends message to main process.
$( ".streamer-login, .bot-login" ).click(function() {
    var streamOrBot = $(this).attr('data');
    var status = $(this).attr('status');

    if(status == "login"){
        ipcRenderer.send('oauth-login', streamOrBot);
    } else if (status == "logout"){
        logout(streamOrBot);
    }
});


// Run on App Load
initialLogin();