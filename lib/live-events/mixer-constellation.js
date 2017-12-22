'use strict';

const Carina = require('carina').Carina;
const ws = require('ws');
const eventsRouter = require('../live-events/events-router.js');
const { LiveEvent, EventSourceType, EventType } = require('./EventType');
Carina.WebSocket = ws;

// This holds the constellation connection so we can stop it later.
let ca = {};

// Constellation Connect
// This will connect to constellation and subscribe to all constellation events we need.
function constellationConnect(channelId) {

    // Testing - Switch out with a live channel id.
    // (34083 - Lagby)
    // channelId = 34083;

    console.log('Attempting to connect to Constellation.', channelId);
    ca = new Carina({ isBot: true }).open();

    // Clear any previous subscriptions just in case something weird happens.
    ca.subscriptions = {};

    // Channel Status
    // This gets general channel data such as online status, num followers, current viewers.
    let prefix = 'channel:' + channelId + ":";
    ca.subscribe(prefix + 'update', data => {
        let event = new LiveEvent(EventType.UPDATE, EventSourceType.CONSTELLATION, {
            online: data.online,
            numFollowers: data.numFollowers,
            viewersCurrent: data.viewersCurrent,
            viewersTotal: data.viewersTotal
        });
        eventsRouter.go(event);
    });

    // Resub Shared
    // This is a resub event in which the user manually triggered the celebration.
    ca.subscribe(prefix + 'resubShared', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            shared: true,
            username: data['user'].username,
            totalMonths: data.totalMonths
        });
        eventsRouter.go(event);
    });

    // Resub
    // This is a resub event in which the users payment went through, but they might not be in the channel.
    ca.subscribe(prefix + 'resubscribed', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            username: data['user'].username,
            totalMonths: data.totalMonths
        });
        eventsRouter.go(event);
    });

    // Sub
    // This is an initial sub to the channel.
    ca.subscribe(prefix + 'subscribed', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            username: data['user'].username,
            totalMonths: 0
        });
        eventsRouter.go(event);
    });

    // Host
    // This is a channel host.
    ca.subscribe(prefix + 'hosted', data => {
        let event = new LiveEvent(EventType.HOSTED, EventSourceType.CONSTELLATION, {
            username: data['hoster'].token
        });
        eventsRouter.go(event);
    });

    // Follow
    // This is a follow event. Can be true or false for follow or unfollow.
    ca.subscribe(prefix + 'followed', data => {
        let event = new LiveEvent(EventType.FOLLOWED, EventSourceType.CONSTELLATION, {
            username: data['user'].username,
            followed: data.following
        });
        eventsRouter.go(event);
    });

    // NOTE(FB): I dont actually know if this works yet. Not sure how to force errors in constellation.
    ca.on('error', data => {
        console.log('Constellation Error');
        console.log(data);
    });
}

// Constellation Disconnect
// This will disconnect the current constellation connection and unsub from everything.
function constellationDisconnect() {
    console.log('Disconnecting Constellation.');

    // Close and clear all subscriptions.
    ca.close();
    ca.subscriptions = {};
}

// Export Functions
exports.connect = constellationConnect;
exports.disconnect = constellationDisconnect;