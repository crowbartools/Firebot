'use strict';

// Live Event Router
// Takes in all the info from the constellation connection and routes is as needed.
function liveEventRouter (event) {
    switch (event.type) {

    case "update": {
        // Update
        // Note that this provides pretty much all changes to the channel including things like profile changes.
        // Main thing that could be useful would be channel online/offline status and viewer/follow stats.
        let numFollowers = event.metadata.numFollowers,
            viewersCurrent = event.metadata.viewersCurrent,
            viewersTotal = event.metadata.viewersTotal,
            online = event.metadata.online;

        if (numFollowers != null) {
            console.log('Num Followers: ' + numFollowers);
        }
        if (viewersCurrent != null) {
            console.log('Viewers Current: ' + viewersCurrent);
        }
        if (viewersTotal != null) {
            console.log('Viewers Total: ' + viewersTotal);
        }
        if (online != null) {
            if (online === false) {
                console.log('Channel has gone offline.');
            } else {
                console.log('Channel has gone online!');
            }
        }
        break;
    }
    case "followed": {
        // Follow
        // This returns the entire user object with additional parameter of follow = true or false.
        // Note we could pull sparks, creation date, levels, etc...
        if (event.metadata.following === true) {
            console.log(event.metadata.username + ' followed the channel!');
        }
        break;
    }
    case "hosted": {
        // Hosted
        // This returns a channel object (not user).
        // We could get things like partner status here.
        console.log(event.metadata.username + ' hosted the channel!');
        break;
    }
    case "subscribed": {
        // Subscribed
        // Returns user object.
        // This is the initial subscription. We can assume that this person is in the channel when this happens.
        console.log(event.metadata.username + ' subscribed to the channel!');
        break;
    }
    case "resubscribed": {
        // Resubscribe
        // This is fired when payment goes through, but does not meant the person is in chat. Returns user object.
        // Returns user object, total months, date started, and other stats.
        console.log(event.metadata.username + ' resubscribed to the channel for ' + event.metadata.totalMonths + ' months!');
        break;
    }
    case "resubShared": {
        // Resub Shared
        // This is when a user clicks the share button. Person has to be in channel to trigger this one.
        // Returns user object, total months, date started, and other stats.
        console.log(event.metadata.username + ' shared a resub to the channel for ' + event.metadata.totalMonths + ' months!');
        break;
    }
    default: {
        console.log(event);
    }
    }
}

// Export Functions
exports.go = liveEventRouter;