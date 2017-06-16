const electronOauth2 = require('electron-oauth2');

var dbSettings = new JsonDB("./user-settings/settings", true, false);
var dbAuth = new JsonDB("./user-settings/auth", true, false);

// Options
var streamerScopes = "user:details:self interactive:manage:self interactive:robot:self chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"
var botScopes = "chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"


var authInfo = {
    clientId: "",
    authorizationUrl: "https://mixer.com/oauth/authorize",
    tokenUrl: "https://mixer.com/api/v1/oauth/token",
    useBasicAuthorizationHeader: false,
    redirectUri: "http://localhost"
};

var authWindowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false,
        partition: 'default'
    }
};




// Login Kickoff
function login(type) {
    scopes = type == "streamer" ? streamerScopes : botScopes;
    authWindowParams.webPreferences.partition = type;
    const oauthProvider = electronOauth2(authInfo, authWindowParams);
    oauthProvider.getAccessToken({ scope: scopes })
        .then(token => {
            userInfo(type, token.access_token, token.refresh_token);
        }, err => {
            //error requesting access 
            console.log(err);
        })
}


// User Info
// This function grabs info from the currently logged in user.
function userInfo(type, accessToken, refreshToken) {

    // Request user info and save out everything to auth file.
    request({
        url: 'https://mixer.com/api/v1/users/current',
        auth: {
            'bearer': accessToken
        }
    }, function (err, res) {
        var data = JSON.parse(res.body);

        // Push all to db.
        dbAuth.push('./' + type + '/username', data.username);
        dbAuth.push('./' + type + '/userId', data.id);
        dbAuth.push('./' + type + '/channelId', data.channel.id);
        dbAuth.push('./' + type + '/avatar', data.avatarUrl);
        dbAuth.push('./' + type + '/accessToken', accessToken);
        dbAuth.push('./' + type + '/refreshToken', refreshToken);

        // Style up the login page.
        loadLogin();
    });
}

// Load Login
// This function styles up the login page if there is info saved for anyone.
function loadLogin() {
    // Get streamer info.
    try {
        var streamer = dbAuth.getData('/streamer');
    } catch (error) {
        console.log('No streamer logged into the app.')
        var streamer = '';
    }
    // Get bot info
    try {
        var bot = dbAuth.getData('/bot');
    } catch (error) {
        console.log('No bot logged into the app.')
        var bot = '';
    }

    if (streamer !== '') {
        var username = dbAuth.getData('/streamer/username');
        var avatar = dbAuth.getData('/streamer/avatar');

        if (avatar == null) {
            avatar = './images/placeholders/default.jpg'
        }
        // Put avatar and username on page.
        $('.streamer-login h2').text(username);
        $('.streamer-login img').attr('src', avatar);

        // Flip the login button.
        $('.streamer-login button').removeClass('btn-success').addClass('btn-danger').text('Logout').attr('action', 'logout');

    }

    if (bot !== '') {
        var username = dbAuth.getData('/bot/username');
        var avatar = dbAuth.getData('/bot/avatar');

        if (avatar == null) {
            avatar = './images/placeholders/default.jpg'
        }
        $('.bot-login h2').text(username);
        $('.bot-login img').attr('src', avatar);

        // Flip the login button.
        $('.bot-login button').removeClass('btn-success').addClass('btn-danger').text('Logout').attr('action', 'logout');
    }
}

// Refresh Token
// This will get a new access token when connecting to interactive.
function refreshToken() {

    console.log('Trying to get refresh tokens...')

    // Refresh streamer token if the streamer is logged in.
    try {
        var refresh = dbAuth.getData('./streamer/refreshToken');
        authWindowParams.webPreferences.partition = 'refreshStreamer';
        var oauthProvider = electronOauth2(authInfo, authWindowParams);
        oauthProvider.refreshToken(refresh)
            .then(token => {


                // Success!
                var accessToken = token.access_token;
                var refreshToken = token.refresh_token;

                // Awesome, we got the auth token. Now to save it out for later.
                // Push all to db.
                if (accessToken !== null && accessToken !== undefined && accessToken !== "") {
                    dbAuth.push('./streamer/accessToken', accessToken);
                    dbAuth.push('./streamer/refreshToken', refreshToken);
                } else {
                    console.log('something went wrong with streamer refresh token.')
                    console.log(token);
                }

                // Refresh bot token if the bot is logged in.
                try {
                    var refresh = dbAuth.getData('./bot/refreshToken');
                    oauthProvider.refreshToken(refresh).then(token => {


                        // Success!
                        var accessToken = token.access_token;
                        var refreshToken = token.refresh_token;

                        // Awesome, we got the auth token. Now to save it out for later.
                        // Push all to db.
                        if (accessToken !== null && accessToken !== undefined && accessToken !== "") {
                            dbAuth.push('./bot/accessToken', accessToken);
                            dbAuth.push('./bot/refreshToken', refreshToken);
                        } else {
                            console.log('something went wrong with bot refresh token.')
                            console.log(token);
                        }

                        // Okay, we have both streamer and bot tokens now. Start up the login process.
                        ipcRenderer.send('gotRefreshToken');

                    }, err => {

                        // There was an error getting the bot token.
                        console.log(err);
                    });
                } catch (err) {
                    console.log('No bot logged in. Skipping refresh token.', err)

                    // We have the streamer token, but there is no bot logged in. So... start up the login process.
                    ipcRenderer.send('gotRefreshToken');
                }

            },
            (err) => {
                //error getting streamer refresh token
                console.log(err);
            })
    } catch (err) {
        // The streamer isn't logged in... stop everything.
        console.log('No streamer logged in. Skipping refresh token.', err)
        return;
    }
}

// Connect Request
// Recieves an event from the main process when the global hotkey is hit for connecting.
ipcRenderer.on('getRefreshToken', function (event, data) {
    var status = $('.connection-text').text();

    // Send event to render process.
    if (status.substring(0,9) === "Connected") {
        // Disconnect!
        ipcRenderer.send('mixerInteractive', 'disconnect');
    } else {
        // Let's connect! Get new tokens and connect.
        refreshToken();
    }
})

// Logout
// This will remove user info and log someone out.
function logout(type) {
    if (type == "streamer") {
        $('.streamer-login h2').text('Broadcaster');
        $('.streamer-login img').attr('src', './images/placeholders/default.jpg');

        // Flip login button
        $('.streamer-login button').addClass('btn-success').removeClass('btn-danger').text('Login').attr('action', 'login');

        // Delete Info
        dbAuth.delete('/streamer');
    } else {
        $('.bot-login h2').text('Bot');
        $('.bot-login img').attr('src', './images/placeholders/default.jpg');

        // Flip login button
        $('.bot-login button').addClass('btn-success').removeClass('btn-danger').text('Login').attr('action', 'login');

        // Delete Info
        dbAuth.delete('/bot');
    }
}


// Click Handlers
// Handle login buttons
$(".loginBtn").click(function () {
    // Get data attr to see which button was clicked.
    var type = $(this).attr('data');
    var action = $(this).attr('action');

    // If button is ready for login...
    if (action == 'login') {
        login(type);
    } else {
        logout(type);
    }
});


// On App Load
loadLogin()
