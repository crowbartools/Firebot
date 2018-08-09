"use strict";
const electronOauth2 = require("electron-oauth2");
const { session } = require("electron");

let authWindowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: true
  }
};

function issueAuthRequest(authInfo, scopes, partition) {
  return new Promise((res, rej) => {
    authInfo.redirectUri =
      "https://crowbartools.com/projects/firebot/redirect.php";

    // clear out any previous sessions
    const ses = session.fromPartition(partition);
    ses.clearStorageData();

    authWindowParams.webPreferences.partition = partition;
    const oauthProvider = electronOauth2(authInfo, authWindowParams);
    oauthProvider
      .getAccessToken({ scope: scopes })
      .then(resp => {
        console.log("Auth Response:");
        console.log(resp);
        res(resp);
      })
      .catch(err => {
        rej(err);
      });
  });
}

exports.issueAuthRequest = issueAuthRequest;
