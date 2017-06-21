(function(){
  
 // This handles logins and connections to mixer interactive
 
 const electronOauth2 = require('electron-oauth2');
 
 const dbAuth = new JsonDB("./user-settings/auth", true, false); 
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('connectionService', function (listenerService, settingsService, soundService) {
    var service = {};
    
    var ListenerType = listenerService.ListenerType;
    
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
    
    service.connectedToInteractive = false;
    service.waitingForStatusChange = false;
    
    service.toggleConnectionToInteractive = function() {
      if(service.connectedToInteractive == true) {
        service.disconnectFromInteractive();
      } else {
        service.connectToInteractive();
      }    
    }
    
    service.connectToInteractive = function() {
      // Let's connect! Get new tokens and connect.
      refreshToken();
      service.waitingForStatusChange = true;
    }
    
    service.disconnectFromInteractive = function() {
      // Disconnect!
      ipcRenderer.send('mixerInteractive', 'disconnect');
      service.waitingForStatusChange = true;
    }
    
    // Connection Monitor
    // Recieves event from main process that connection has been established or disconnected.
    listenerService.registerListener(
      { type: ListenerType.CONNECTION_STATUS }, 
      (isConnected) => {
        service.connectedToInteractive = isConnected;
        
        var soundType = isConnected ? "Online" : "Offline";
        soundService.connectSound(soundType);
        
        if(service.waitingForStatusChange == true) {
          service.waitingForStatusChange = false;
        }
      });
      
    // Connect Request
    // Recieves an event from the main process when the global hotkey is hit for connecting.  
    listenerService.registerListener(
      { type: ListenerType.CONNECTION_CHANGE_REQUEST }, 
      () => {
        service.toggleConnectionToInteractive();
      });
    
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
                        if(service.waitingForStatusChange == true) {
                          service.waitingForStatusChange = false;
                        }
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
                  if(service.waitingForStatusChange == true) {
                    service.waitingForStatusChange = false;
                  }
                    //error getting streamer refresh token
                    console.log(err);
                })
        } catch (err) {
            // The streamer isn't logged in... stop everything.
            console.log('No streamer logged in. Skipping refresh token.', err);
            
            if(service.waitingForStatusChange == true) {
              service.waitingForStatusChange = false;
            }
            return;
        }
    }
    
    return service;
  });
})();