const {ipcMain} = require('electron')
const {BrowserWindow} = require('electron')
const JsonDB = require('node-json-db');

// Login Button Pressed
// This works in conjunction with the render login.js file and acts when a login button has been pressed.
// It grabs the auth token and then sends it back to the render process login.js.
ipcMain.on('oauth-login', function(event, streamOrBot) {

    // If these options are changed they also need to be adjusted in the gui login.js for alternative logins.
    var options = {
        client_id: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9',
        scopes: ["user:details:self", "interactive:manage:self", "interactive:robot:self", "chat:connect", "chat:bypass_slowchat", "chat:bypass_links", "chat:chat", "chat:whisper"] // Scopes limit access for OAuth tokens.
    };

    var date = Date.now();

    authWindow = new BrowserWindow({
        width: 400,
        height: 625,
        resizable: true,
        alwaysOnTop: true,
        show: true,
        webPreferences: {
            nodeIntegration: false,
            partition: 'persist:'+date,
            sandbox: true
        }
    });

    // Reset the authWindow on close
    authWindow.on('close', function() {
        authWindow = null;
    }, false);

    var url = "https://beam.pro/oauth/authorize?";
    var authUrl = url + "client_id=" + options.client_id + "&scope=" + options.scopes.join(' ') + "&redirect_uri=http://firebottle.tv/Firebot/oauth" + "&response_type=token";
    authWindow.loadURL(encodeURI(authUrl));
    authWindow.show();

    function handleCallback(url, streamOrBot) {
        var raw_token = /token=([^&]*)/.exec(url) || null;
        var token = (raw_token && raw_token.length > 1) ? raw_token[1] : null;
        var error = /\?error=(.+)$/.exec(url);

        if (token) {
            // Send token back to render process.
            event.sender.send('oauth-complete', token, streamOrBot, authWindow);
        }
    }

    authWindow.webContents.on('will-navigate', function(event, url) {
        handleCallback(url, streamOrBot);
    });

    authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
        handleCallback(newUrl, streamOrBot);
    });

});

// Close auth window when done.
ipcMain.on('auth-close', function(event) {
    authWindow.close();
});