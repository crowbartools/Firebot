"use strict";

/**
 * The listener function that acts on event data
 *
 * @callback ListenerFunc
 * @param {any} data - data from the chat event
 * @returns {void}
 */

/**
 * A Chat event listener
 * @typedef {Object} ChatListener
 * @property {string} accountType - which account type to listen on ("streamer" or "bot")
 * @property {string} event - The event name to subscribe to
 * @property {ListenerFunc} callback
 */

/**@type {ChatListener[]} */
const listeners = [
    require('./listeners/chat-message-bot-listener'),
    require('./listeners/chat-message-streamer-listener'),
    require('./listeners/clear-messages-listener'),
    require('./listeners/delete-message-listener'),
    require('./listeners/poll-listeners').pollStart,
    require('./listeners/poll-listeners').pollEnd,
    require('./listeners/purge-messages-listener'),
    require('./listeners/skill-attribution-listener'),
    require('./listeners/user-join-listener'),
    require('./listeners/user-leave-listener'),
    require('./listeners/user-update-listener')
];
Object.freeze(listeners);

exports.getStreamerListeners = () => listeners.filter(l => l.accountType === 'streamer');
exports.getBotListeners = () => listeners.filter(l => l.accountType === 'bot');