"use strict";

/**
 * Enum to describe an integration or platform's connection state.
 * @readonly
 * @enum {string}
 */
const ConnectionState = Object.freeze({
    Disconnected: "disconnected",
    Connected: "connected",
    Reconnecting: "reconnecting",
    Connecting: "connecting"
});

exports.ConnectionState = ConnectionState;