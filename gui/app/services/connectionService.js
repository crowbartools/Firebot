(function(){
  
 // This handles logins and connections to mixer interactive
 
 const electronOauth2 = require('electron-oauth2');
 const dbAuth = new JsonDB("./user-settings/auth", true, false); 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('connectionService', function (listenerService, settingsService, soundService, utilityService, $q) {
    var service = {};
    
    var ListenerType = listenerService.ListenerType;
    
    // Auth Options
    var streamerScopes = "user:details:self interactive:manage:self interactive:robot:self chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"
    var botScopes = "chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"    
    
    var authInfo = {
        clientId: process.env.CLIENT_ID,
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
    
    /**
    * Login Stuff
    */
    
    var defaultPhotoUrl = "../images/placeholders/default.jpg";
    
    service.accounts = {
      streamer: {
        username: "Broadcaster",
        photoUrl: "../images/placeholders/default.jpg",
        isLoggedIn: false
      },
      bot: {
        username: "Bot",
        photoUrl: "../images/placeholders/default.jpg",
        isLoggedIn: false
      }
    }
    
    // Login Kickoff
    service.loginOrLogout = function(type) {      
        if((type === 'streamer' && !service.accounts.streamer.isLoggedIn) || 
            (type === 'bot' && !service.accounts.bot.isLoggedIn)) {
          // We need to login
          login(type);              
        } else { 
          // We need to logout
          logout(type);
        }
    }
    
    function logout(type) {
      if(type === "streamer") {
        // Delete Info
        dbAuth.delete('/streamer');
        
        var streamerAccount = service.accounts.streamer;
        streamerAccount.username = "Broadcaster";
        streamerAccount.photoUrl = defaultPhotoUrl;
        streamerAccount.isLoggedIn = false;

      } else {
        // Delete Info
        dbAuth.delete('/bot');
        
        var botAccount = service.accounts.bot;
        botAccount.username = "Bot";
        botAccount.photoUrl = defaultPhotoUrl;
        botAccount.isLoggedIn = false;
        
      }
    }
    
    function login(type) { 
      var scopes = type == "streamer" ? streamerScopes : botScopes;

      authWindowParams.webPreferences.partition = type;
      const oauthProvider = electronOauth2(authInfo, authWindowParams);
      oauthProvider.getAccessToken({ scope: scopes })
          .then(token => {
              userInfo(type, token.access_token, token.refresh_token);
          }, err => {
              //error requesting access 
              console.log(err);
          });
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
            $q.resolve(true, () => service.loadLogin());              
        });
    }
    
    // Load Login
    // This function populates the accounnt fields which will in turn update the ui
     service.loadLogin = function() {
        // Get streamer info.
        try {
            var streamer = dbAuth.getData('/streamer');
            
            if(streamer != null) {
              service.accounts.streamer.isLoggedIn = true;
              
              var username = streamer.username;
              var avatar = streamer.avatar
      
              if (avatar != null) {
                service.accounts.streamer.photoUrl = avatar;
              }
              
              if (username != null) {
                service.accounts.streamer.username = username;
              }   
            }              
        } catch (error) {
          console.log('No streamer logged into the app.')
        }
        // Get bot info
        try {
          var bot = dbAuth.getData('/bot');
          
          if(bot != null) {            
            service.accounts.bot.isLoggedIn = true;
            
            var username = bot.username;
            var avatar = bot.avatar
    
            if (avatar != null) {
              service.accounts.bot.photoUrl = avatar;
            }
            
            if (username != null) {
              service.accounts.bot.username = username;
            }   
          }   
        } catch (error) {
          console.log('No bot logged into the app.')
        }
    }    
    
    /**
    * Interactive Connection Stuff
    */
    service.connectedToInteractive = false;
    service.waitingForStatusChange = false;
    service.connectedBoard = "";
    
    service.toggleConnectionToInteractive = function() {
      if(service.connectedToInteractive == true) {
        service.disconnectFromInteractive();
      } else {
        service.connectToInteractive();
      }    
    }
    
    service.connectToInteractive = function() {
      // Let's connect! Get new tokens and connect.
      service.waitingForStatusChange = true;
      service.connectedBoard = settingsService.getLastBoardName();
      refreshToken();
    }
    
    service.disconnectFromInteractive = function() {
      // Disconnect!
      service.waitingForStatusChange = true;
      ipcRenderer.send('mixerInteractive', 'disconnect');
    }
    
    // Connection Monitor
    // Recieves event from main process that connection has been established or disconnected.
    listenerService.registerListener(
      { type: ListenerType.CONNECTION_STATUS }, 
      (isConnected) => {
        service.connectedToInteractive = isConnected;
        
        var soundType = isConnected ? "Online" : "Offline";
        soundService.connectSound(soundType);
        
        service.waitingForStatusChange = false;
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
                        service.waitingForStatusChange = false;
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
                    service.waitingForStatusChange = false;
                    console.log(err);
                })
        } catch (err) {
            // The streamer isn't logged in... stop everything.
            service.waitingForStatusChange = false;
            console.log('No streamer logged in. Skipping refresh token.', err);
            utilityService.showErrorModal("You need to log into your streamer account before you can connect to Interactive.");              
            return;
        }
    }
    
    return service;
  });
})();