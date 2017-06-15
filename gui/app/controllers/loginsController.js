(function(){
  
 //This handles the Logins tab and uses alot of the code from the previous login.js class
 
 angular
   .module('firebotApp')
   .controller('loginsController', function($scope) {
       
      // Dont forget to update this for a build
      var authClientId = "";
      
      const electronOauth2 = require('electron-oauth2');
      const JsonDB = require('node-json-db');
      
      var dbSettings = new JsonDB("./user-settings/settings", true, false);
      var dbAuth = new JsonDB("./user-settings/auth", true, false);
          
      
      var defaultPhotoUrl = "../images/placeholders/default.jpg";
      
      // angular varibles for frontend
      
      $scope.accounts = {
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
      $scope.loginOrLogout = function(type) {      
          if((type === 'streamer' && !$scope.accounts.streamer.isLoggedIn) || 
              (type === 'bot' && !$scope.accounts.bot.isLoggedIn)) {
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
          
          var streamerAccount = $scope.accounts.streamer;
          streamerAccount.username = "Broadcaster";
          streamerAccount.photoUrl = defaultPhotoUrl;
          streamerAccount.isLoggedIn = false;

        } else {
          // Delete Info
          dbAuth.delete('/bot');
          
          var botAccount = $scope.accounts.bot;
          botAccount.username = "Bot";
          botAccount.photoUrl = defaultPhotoUrl;
          botAccount.isLoggedIn = false;
          
        }
      }
      
      function login(type) {
        // Options
        var streamerScopes = "user:details:self interactive:manage:self interactive:robot:self chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"
        var botScopes = "chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat"            
        var authInfo = {
            clientId: authClientId,
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
              loadLogin();
          });
      }
      
      // Load Login
      // This function styles up the login page if there is info saved for anyone.
      function loadLogin() {
          // Get streamer info.
          try {
              var streamer = dbAuth.getData('/streamer');
              
              if(streamer != null) {
                $scope.accounts.streamer.isLoggedIn = true;
                
                var username = streamer.username;
                var avatar = streamer.avatar
        
                if (avatar != null) {
                  $scope.accounts.streamer.photoUrl = avatar;
                }
                
                if (username != null) {
                  $scope.accounts.streamer.username = username;
                }   
              }              
          } catch (error) {
            console.log('No streamer logged into the app.')
          }
          // Get bot info
          try {
            var bot = dbAuth.getData('/bot');
            
            if(bot != null) {            
              $scope.accounts.bot.isLoggedIn = true;
              
              var username = bot.username;
              var avatar = bot.avatar
      
              if (avatar != null) {
                $scope.accounts.bot.photoUrl = avatar;
              }
              
              if (username != null) {
                $scope.accounts.bot.username = username;
              }   
            }   
          } catch (error) {
            console.log('No bot logged into the app.')
          }
      }    
      
      // Run loadLogin to update the UI on page load.
      loadLogin();  
    });    
})();