const {ipcMain} = require('electron')
const {BrowserWindow} = require('electron')

// Login Button Pressed
// This works in conjunction with the render login.js file and acts when a login button has been pressed.
// It grabs the auth token and then sends it back to the render process login.js.
ipcMain.on('oauth-login', function(event, streamOrBot) {
    var options = {
        client_id: '256e0678a231e8fff721e476d6eb0b43cada80730bd771a4',
        scopes: ["user:details:self", "interactive:manage:self", "interactive:robot:self"] // Scopes limit access for OAuth tokens.
    };

    var authWindow = new BrowserWindow({
        width: 400,
        height: 625,
        resizable: true,
        alwaysOnTop: true,
        show: true,
        webPreferences: {
            nodeIntegration: false,
            partition: 'persist:interactive'
        }
    });

    // Reset the authWindow on close
    authWindow.on('close', function() {
        authWindow = null;
    }, false);

    var url = "https://beam.pro/oauth/authorize?";
    var authUrl = url + "client_id=" + options.client_id + "&scope=" + options.scopes.join(' ') + "&redirect_uri=http://localhost/callback" + "&response_type=token";
    authWindow.loadURL(encodeURI(authUrl));
    authWindow.show();

    function handleCallback(url, streamOrBot) {
        var raw_token = /token=([^&]*)/.exec(url) || null;
        var token = (raw_token && raw_token.length > 1) ? raw_token[1] : null;
        var error = /\?error=(.+)$/.exec(url);

        if (token) {
            // Send token back to render process.
            event.sender.send('oauth-complete', token, streamOrBot);
        }
        if (error) {
            authWindow.close();
        }
        authWindow.close();
    }

    authWindow.webContents.on('will-navigate', function(event, url) {
        handleCallback(url, streamOrBot);
    });

    authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
        handleCallback(newUrl, streamOrBot);
    });

});