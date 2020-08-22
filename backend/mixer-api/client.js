"use strict";

const { app } = require('electron');
const Mixer = require('@mixer/client-node');

const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");

const CLIENT_ID = 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9';

const firebotRequest = require("request").defaults({
    'User-Agent': `Firebot/${app.getVersion()}`,
    'Client-ID': CLIENT_ID
});

require('request-debug')(firebotRequest, function(type, data) {
    //if huge json response from steam, dont log this bad boi
    if (data.body && data.body.applist) return;

    logger.debug("Request debug: ", { type: type, data: JSON.stringify(data) });
});

const firebotRequestRunner = {
    run: (options) => {
        return new Promise((resolve, reject) => {
            firebotRequest(options, (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(response);
            });
        });
    }
};

const streamerClient = new Mixer.Client(firebotRequestRunner);
const botClient = new Mixer.Client(new Mixer.DefaultRequestRunner());

/**
 * Sets up the streamer and bot clients with oauth providers
 */
function setupClients() {
    const streamer = accountAccess.getAccounts().streamer;
    if (streamer.loggedIn) {
        streamerClient.use(new Mixer.OAuthProvider(streamerClient, {
            clientId: CLIENT_ID,
            tokens: {
                access: streamer.auth.access_token,
                expires: new Date(streamer.auth.expires_at).getTime()
            }
        }));
    }

    const bot = accountAccess.getAccounts().bot;
    if (bot.loggedIn) {
        botClient.use(new Mixer.OAuthProvider(botClient, {
            clientId: CLIENT_ID,
            tokens: {
                access: bot.auth.access_token,
                expires: new Date(bot.auth.expires_at).getTime()
            }
        }));
    }
}

let tokenRefreshIntervalId = null;
function startTokenRefreshInterval() {
}

/**
 * Refreshes tokens and then ensures clients are setup.
 */
async function initClients() {
    setupClients();
    startTokenRefreshInterval();
}

accountAccess.events.on("account-update", () => {
    setupClients();
});

/**
 * Gets connection information from Mixer's chat servers
 * @param {string} accountType The account type to get chat connection info with (streamer or bot)
 */
async function getChatConnectionInformation(accountType) {
    let client = streamerClient;
    if (accountType === 'bot') {
        client = botClient;
    }

    const channelId = accountAccess.getAccounts().streamer.channelId;
    return client.chat.join(channelId).then(response => response.body);
}

exports.initClients = initClients;
exports.setupClients = setupClients;
exports.getChatConnectionInformation = getChatConnectionInformation;
exports.streamer = streamerClient;