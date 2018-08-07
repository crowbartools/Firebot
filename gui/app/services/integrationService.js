"use strict";

(function() {
  // This handles logins and connections to mixer interactive

  const electronOauth2 = require("electron-oauth2");
  const profileManager = require("../../lib/common/profile-manager.js");
  const dataAccess = require("../../lib/common/data-access.js");
  const { session } = require("electron").remote;
  const request = require("request");

  angular
    .module("firebotApp")
    .factory("integrationService", function(
      listenerService,
      settingsService,
      soundService,
      utilityService,
      $q,
      $rootScope,
      boardService,
      logger
    ) {
      let service = {};

      let authWindowParams = {
        alwaysOnTop: true,
        webPreferences: {
          sandbox: true
        }
      };

      let integrations = {
        streamlabs: {
          authInfo: {
            clientId: "XtzRXbIUU9OZcU3siwNBXOSVFD8DGjYhkLmeUqYQ",
            clientSecret: "pJMm1ktVgtXkNEdhU5HIowQNCLxZyMLin0yu0q6b",
            authorizationUrl: "https://streamlabs.com/api/v1.0/authorize",
            tokenUrl: "https://streamlabs.com/api/v1.0/token"
          },
          scopes: "donations.read socket.token",
          tokens: {},
          linked: false
        }
      };

      service.integrationIsLinked = function(type) {
        switch (type) {
          case "streamlabs":
            return integrations.streamlabs.linked;
          default:
            return false;
        }
      };

      service.loadIntegrations = function() {
        let integrationDb = profileManager.getJsonDbInProfile("/integrations"),
          data = integrationDb.getData("/");

        if (data == null) return;

        if (data.streamlabs) {
          let streamlabsData = data.streamlabs;
          if (
            streamlabsData.accessToken == null ||
            streamlabsData.refreshToken == null ||
            streamlabsData.socketToken == null
          ) {
            return;
          }

          integrations.streamlabs.tokens = streamlabsData;
          integrations.streamlabs.linked = true;
        }
      };

      function getAuthTokens(authInfo, scopes, partition) {
        return new Promise((res, rej) => {
          authInfo.useBasicAuthorizationHeader = true;
          authInfo.redirectUri =
            "https://crowbartools.com/projects/firebot/redirect.php";

          // clear out any previous sessions
          const ses = session.fromPartition(partition);
          ses.clearStorageData();

          authWindowParams.webPreferences.partition = partition;
          const oauthProvider = electronOauth2(authInfo, authWindowParams);
          oauthProvider
            .getAccessToken({ scope: scopes })
            .then(token => {
              console.log("GOT TOKENS!");
              console.log(token);

              if (
                (token != null && token.name === "ValidationError") ||
                token.error
              ) {
                rej(token.error + ": " + token.error_description);
              } else {
                res({
                  accessToken: token.access_token,
                  refreshToken: token.refresh_token
                });
              }
            })
            .catch(err => {
              rej(err);
            });
        });
      }

      function refreshTokens(authInfo, refreshToken, partition) {
        return new Promise((res, rej) => {
          authInfo.useBasicAuthorizationHeader = false;
          authInfo.redirectUri =
            "https://crowbartools.com/projects/firebot/redirect.php";

          let oauthProvider = electronOauth2(authInfo, authWindowParams);
          oauthProvider
            .refreshToken(refresh)
            .then(token => {
              logger.info("Got refresh token!");

              // Success!
              let accessToken = token.access_token;
              let refreshToken = token.refresh_token;

              // Awesome, we got the auth token. Now to save it out for later.
              // Push all to db.
              if (accessToken == null || accessToken === "") {
                return rej("Error getting refresh tokens");
              }

              res({
                accessToken: accessToken,
                refreshToken: trefreshToken
              });
            })
            .catch(error => {
              rej(error);
            });
        });
      }

      function getStreamlabsSocketToken(accessToken) {
        return new Promise((res, rej) => {
          let options = {
            method: "GET",
            url: "https://streamlabs.com/api/v1.0/socket/token",
            qs: { access_token: accessToken }
          };

          request(options, function(error, response, body) {
            if (error) return rej(error);

            body = JSON.parse(body);

            console.log(body.socket_token);
            res(body.socket_token);
          });
        });
      }

      service.linkToStreamlabs = async function() {
        console.log("getting tokens...");
        let tokens;
        try {
          tokens = await getAuthTokens(
            integrations.streamlabs.authInfo,
            integrations.streamlabs.scopes,
            "streamlabs"
          );
        } catch (error) {
          console.log(error);
        }

        console.log("tokens:");
        console.log(tokens);

        try {
          tokens.socketToken = await getStreamlabsSocketToken(
            tokens.accessToken
          );
        } catch (error) {
          console.log(error);
        }

        console.log("updated tokens:");
        console.log(tokens);

        integrations.streamlabs.tokens = tokens;
        integrations.streamlabs.linked = true;

        try {
          let integrationDb = profileManager.getJsonDbInProfile(
            "/integrations"
          );

          integrationDb.push("/streamlabs", tokens);
        } catch (error) {
          console.log(error);
        }

        listenerService.fireEvent("integrationLinked", "streamlabs");
      };

      return service;
    });
})();
