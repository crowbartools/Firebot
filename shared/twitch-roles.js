"use strict";

const twitchRoles = [
    {
        id: "vip",
        name: "VIPs"
    },
    {
        id: "sub",
        name: "Subscribers"
    },
    {
        id: "mod",
        name: "Moderators"
    },
    {
        id: "broadcaster",
        name: "Streamer"
    }
];

exports.getTwitchRoles = () => twitchRoles;
exports.mapTwitchRole = role => twitchRoles.find(r => r.id === role);


