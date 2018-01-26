'use strict';

const mixerInteractive = require('./mixer-interactive.js');
const mixerChat = require('./mixer-chat');
const mixerConstellation = require('../live-events/mixer-constellation.js');

// Chat Reconnection
let chatReconnecting = false;
let chatReconnectTimeout = false;

// Interactive Reconnection
let interactiveReconnecting = false;
let interactiveReconnectTimeout = false;

// Constellation Reconnection
let constellationReconnecting = false;
let constellationReconnectTimeout = false;

// Clear Reconnect Timeout.
// This takes in a connection type and stops reconnection attempts.
function clearReconnectTimeout(connectionType) {
    switch (connectionType) {
    case "Chat":
        clearTimeout(chatReconnectTimeout);
        chatReconnectTimeout = false;
        chatReconnecting = false;
        break;
    case "Interactive":
        clearTimeout(interactiveReconnectTimeout);
        interactiveReconnectTimeout = false;
        interactiveReconnecting = false;
        break;
    case "Constellation":
        clearTimeout(constellationReconnectTimeout);
        constellationReconnectTimeout = false;
        constellationReconnecting = false;
        break;
    default:
        console.log('Invalid connection type passed to clear reconnect timeout.');
        return;
    }
}

// Chat Reconnect
// Takes in a retry number and override.
function chatReconnect(retry) {
    let chatConnected = mixerChat.getChatStatus(),
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    chatReconnecting = true;

    if (!chatConnected && retry <= maxRetries) {
        // Trying to reconnect...
        console.log('Chat reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        mixerChat.disconnect();

        chatReconnectTimeout = setTimeout(function(nextRetry) {
            if (!chatConnected) {
                mixerChat.connect();
                // eslint-disable-next-line no-use-before-define
                reconnectService('Chat', nextRetry, true, false);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!chatConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Chat reconnection failed several times. Stopping reconnection attempts.");

        // Clear Timeout
        clearReconnectTimeout("Chat");
        chatReconnecting = false;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Chat");
        chatReconnecting = false;
    }
}

// Interactive Reconnect
// Tries to reconnect interactive.
function interactiveReconnect(retry) {
    let interactiveConnected = mixerInteractive.getInteractiveStatus(),
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    chatReconnecting = true;

    if (!interactiveConnected && retry <= maxRetries) {
        // Trying to reconnect...
        console.log('Interactive reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        mixerInteractive.disconnect();

        chatReconnectTimeout = setTimeout(function(nextRetry) {
            if (!interactiveConnected) {
                mixerInteractive.connect();
                // eslint-disable-next-line no-use-before-define
                reconnectService('Interactive', nextRetry, true, false);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!interactiveConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Interactive reconnection failed several times. Stopping reconnection attempts.");

        // Clear Timeout
        clearReconnectTimeout("Interactive");
        interactiveReconnecting = false;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Interactive");
        interactiveReconnecting = false;
    }
}

// Constellation Reconnect
// Tries to reconnect constellation
function constellationReconnect(retry) {
    let constellationConnected = mixerConstellation.getConstellationStatus(),
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    constellationReconnecting = true;

    if (!constellationConnected && retry <= maxRetries) {
        // Trying to reconnect...
        console.log('Constellation reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        mixerConstellation.disconnect();

        chatReconnectTimeout = setTimeout(function(nextRetry) {
            if (!constellationConnected) {
                mixerConstellation.connect();
                // eslint-disable-next-line no-use-before-define
                reconnectService('Constellation', nextRetry, true, false);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!constellationConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Constellation reconnection failed several times. Stopping reconnection attempts.");

        // Clear Timeout
        clearReconnectTimeout("Constellation");
        constellationReconnecting = false;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Constellation");
        constellationReconnecting = false;
    }
}

// Reconnect Service.
// This is the main function for reconnecting services. Pass in the service to reconnect and other info.
function reconnectService(connectionType, retry, override, clear) {
    // Check to see if we have a connection type to try to reconnect.
    if (connectionType != null) {
        console.log('Starting reconnect function for ' + connectionType + '.');

        switch (connectionType) {
        case "Chat":
            if (chatReconnecting && !override) return;
            if (clear === false) {
                chatReconnect(retry);
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        case "Interactive":
            if (interactiveReconnecting && !override) return;
            if (clear === false) {
                interactiveReconnect(retry);
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        case "Constellation":
            if (constellationReconnecting && !override) return;
            if (clear === false) {
                constellationReconnect(retry);
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        default:
            console.log('Invalid connection type passed to reconnect service.');
            return;
        }
    } else {
        console.log('Null connection type passed to reconnect service.');
    }
}


// Export Functions
exports.reconnect = reconnectService;