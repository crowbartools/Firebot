'use strict';

const {ipcMain} = require('electron');
const mixerInteractive = require('./mixer-interactive.js');
const mixerChat = require('./mixer-chat');
const mixerConstellation = require('../live-events/mixer-constellation.js');
const logger = require('../logwrapper');

// Chat Reconnection
let chatReconnecting = false;
let chatReconnectTimeout = false;
let chatAttempts = 0;

// Interactive Reconnection
let interactiveReconnecting = false;
let interactiveReconnectTimeout = false;
let interactiveAttempts = 0;

// Constellation Reconnection
let constellationReconnecting = false;
let constellationReconnectTimeout = false;
let constellationAttempts = 0;

// Clear Reconnect Timeout.
// This takes in a connection type and stops reconnection attempts.
function clearReconnectTimeout(connectionType) {
    logger.info('Clearing Reconnect Timeout. ', connectionType);
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
    case "All":
        clearTimeout(chatReconnectTimeout);
        chatReconnectTimeout = false;
        chatReconnecting = false;

        clearTimeout(interactiveReconnectTimeout);
        interactiveReconnectTimeout = false;
        interactiveReconnecting = false;

        clearTimeout(constellationReconnectTimeout);
        constellationReconnectTimeout = false;
        constellationReconnecting = false;
        break;
    default:
        logger.error('Invalid connection type passed to clear reconnect timeout.');
        return;
    }
}

// Chat Reconnect
// Takes in a retry number and override.
function chatReconnect() {
    let chatConnected = mixerChat.getChatStatus(),
        retry = chatAttempts,
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    // If this is our first retry, then we want to attempt to reconnect instantly. Otherwise, add in delay.
    if (newRetry === 1) {
        retryWait = 0;
    }

    chatReconnecting = true;
    chatAttempts = newRetry;

    if (!chatConnected && retry <= maxRetries) {
        // Trying to reconnect...
        logger.info('Chat reconnect try: ' + newRetry + '/' + maxRetries);

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
        logger.error('Chat connection failed several times. Stopping reconnect attempts.');

        // Clear Timeout
        clearReconnectTimeout("Chat");
        chatReconnecting = false;
        chatAttempts = 0;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Chat");
        chatReconnecting = false;
        chatAttempts = 0;
    }
}

// Interactive Reconnect
// Tries to reconnect interactive.
function interactiveReconnect() {
    let interactiveConnected = mixerInteractive.getInteractiveStatus(),
        retry = interactiveAttempts,
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    // If this is our first retry, then we want to attempt to reconnect instantly. Otherwise, add in delay.
    if (newRetry === 1) {
        retryWait = 0;
    }

    interactiveReconnecting = true;
    interactiveAttempts = newRetry;

    if (!interactiveConnected && retry <= maxRetries) {
        // Trying to reconnect...
        logger.info('Interactive reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        mixerInteractive.disconnect();

        interactiveReconnectTimeout = setTimeout(function(nextRetry) {
            if (!interactiveConnected) {
                mixerInteractive.connect();
                // eslint-disable-next-line no-use-before-define
                reconnectService('Interactive', nextRetry, true, false);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!interactiveConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Interactive reconnection failed several times. Stopping reconnection attempts.");
        logger.error("Interactive reconnection failed several times. Stopping reconnection attempts.");

        // Clear Timeout
        clearReconnectTimeout("Interactive");
        interactiveReconnecting = false;
        interactiveAttempts = 0;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Interactive");
        interactiveReconnecting = false;
        interactiveAttempts = 0;
    }
}

// Constellation Reconnect
// Tries to reconnect constellation
function constellationReconnect() {
    let constellationConnected = mixerConstellation.getConstellationStatus(),
        retry = constellationAttempts,
        retryWait = 10000,
        maxRetries = 5,
        newRetry = retry + 1;

    constellationReconnecting = true;
    constellationAttempts = newRetry;

    if (!constellationConnected && retry <= maxRetries) {
        // Trying to reconnect...
        logger.info('Constellation reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        mixerConstellation.disconnect();

        constellationReconnectTimeout = setTimeout(function(nextRetry) {
            if (!constellationConnected) {
                mixerConstellation.connect();
                // eslint-disable-next-line no-use-before-define
                reconnectService('Constellation', nextRetry, true, false);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!constellationConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Constellation reconnection failed several times. Stopping reconnection attempts.");
        logger.error("Constellation reconnection failed several times. Stopping reconnection attempts.");

        // Clear Timeout
        clearReconnectTimeout("Constellation");
        constellationReconnecting = false;
        constellationAttempts = 0;
    } else {
        // We connected!
        // Clear Timeout
        clearReconnectTimeout("Constellation");
        constellationReconnecting = false;
        constellationAttempts = 0;
    }
}

// Reconnect Service.
// This is the main function for reconnecting services. Pass in the service to reconnect and other info.
function reconnectService(connectionType, override, clear) {
    // Check to see if we have a connection type to try to reconnect.
    if (connectionType != null) {
        switch (connectionType) {
        case "Chat":
            if (chatReconnecting && !override) return;
            if (clear === false) {
                chatReconnect();
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        case "Interactive":
            if (interactiveReconnecting && !override) return;
            if (clear === false) {
                interactiveReconnect();
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        case "Constellation":
            if (constellationReconnecting && !override) return;
            if (clear === false) {
                constellationReconnect();
            } else {
                clearReconnectTimeout(connectionType);
            }
            break;
        default:
            logger.error('Invalid connection type passed to reconnect service.');
            return;
        }
    } else {
        logger.error('Null connection type passed to reconnect service.');
    }
}

// Clear Timeouts
// Clears all reconnect timeouts. Used when user manually clicks connection buttons.
ipcMain.on('clearReconnect', function(evt, data) {
    clearReconnectTimeout(data);
});

// Export Functions
exports.reconnect = reconnectService;