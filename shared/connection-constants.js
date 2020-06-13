"use strict";

const ConnectionState = Object.freeze({
    Disconnected: "disconnected",
    Connected: "connected",
    Reconnecting: "reconnecting",
    Connecting: "connecting"
});

exports.ConnectionState = ConnectionState;