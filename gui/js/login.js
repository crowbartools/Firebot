const JsonDB = require('node-json-db');
const request = require('request');
const {ipcRenderer} = require('electron');
const shell = require('electron').shell;

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
        login(streamOrBot, data.id, data.channel.id, data.username, token, data.avatarUrl);

        // Close auth window
        ipcRenderer.send('auth-close');
    });
};


// Log in
// This takes the saved login info and puts things onto the login page such as the user avatar.
function login(streamOrBot, userID, channelID, username, token, avatar){

    if (streamOrBot == "streamer"){
        dbAuth.push('/streamer', { "channelID": channelID, "userID":userID, "username": username, "token": token, "avatarUrl": avatar });
    } else if (streamOrBot == "bot") {
        dbAuth.push('/bot', { "channelID": channelID, "userID":userID, "username": username, "token": token, "avatarUrl": avatar });
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

// Alternative Login External Page 
// This opens up the external auth page for people with alternative logins.
function altLoginUrl(){

    // If these options are changed they also need to be adjusted in the lib login.js for the main login process.
    var options = {
        client_id: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9',
        scopes: ["user:details:self", "interactive:manage:self", "interactive:robot:self", "chat:connect", "chat:bypass_slowchat", "chat:bypass_links", "chat:chat", "chat:whisper"] // Scopes limit access for OAuth tokens.
    };

    // Piece together URL and send them to auth page. Then redirect to firebottle.tv to copy/paste their token.
    var url = "https://beam.pro/oauth/authorize?";
    var authUrl = url + "client_id=" + options.client_id + "&scope=" + options.scopes.join(' ') + "&redirect_uri=http://firebottle.tv/Firebot/oauth" + "&response_type=token";

    shell.openExternal(encodeURI(authUrl));
}


// Alternative Login Finished
// This take the auth code in the field and kicks off the login process.
function altLoginFinish(streamOrBot){
    if(streamOrBot == "streamer"){
        var token = $('.streamer .auth-code input').val();

        // Switch back to regular clean login.
        $('.streamer .alternative-login').fadeOut('fast', function(){
            $('.streamer .beam-login').fadeIn('fast');
        })

        // Start up login process
        requestBeamData(token, streamOrBot)

        // Clear token field.
        $('.streamer .auth-code input').val('');
    } else {
        var token = $('.bot .auth-code input').val();

        // Switch back to regular clean login.
        $('.bot .alternative-login').fadeOut('fast', function(){
            $('.bot .beam-login').fadeIn('fast');
        })

        // Start up login process
        requestBeamData(token, streamOrBot)

        // Clear token field.
        $('.bot .auth-code input').val('');
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

// Alternative Login Link
// This checks if the alternative login link has been clicked. 
// It will open up the auth page on click and swap out the fields on the login page to prepare.
$( ".streamer .alt-login-link a").click(function() {
    $('.streamer .beam-login').fadeOut('fast', function(){
        $('.streamer .alternative-login').fadeIn('fast');
    })
});
$( ".bot .alt-login-link a").click(function() {
    $('.bot .beam-login').fadeOut('fast', function(){
        $('.bot .alternative-login').fadeIn('fast');
    })
});

// Beam Login Link
// This checks if the beam login link has been clicked. 
// This just switches back to the regular login buttons.
$( ".streamer .beam-login-link a").click(function() {
    $('.streamer .alternative-login').fadeOut('fast', function(){
        $('.streamer .beam-login').fadeIn('fast');
    })
});
$( ".bot .beam-login-link a").click(function() {
    $('.bot .alternative-login').fadeOut('fast', function(){
        $('.bot .beam-login').fadeIn('fast');
    })
});

// Beam Alternative Login Button
// This checks if the beam login link has been clicked. 
// This just switches back to the regular login buttons.
$( ".streamer-alt-login").click(function() {
    var streamOrBot = $(this).attr('data');
    altLoginFinish(streamOrBot)
});
$( ".bot-alt-login").click(function() {
    var streamOrBot = $(this).attr('data');
    altLoginFinish(streamOrBot)
});

// Get Alternative Auth Code
// This checks if the get code button was clicked, and if so it opens up the external url to start that process.
$( ".get-auth-code").click(function() {
    altLoginUrl();
});

// Run on App Load
initialLogin();