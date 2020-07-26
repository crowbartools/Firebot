"use strict";

const twitchRoles = [
    {
        id: "vip",
        name: "VIP"
    },
    {
        id: "sub",
        name: "Subscriber"
    },
    {
        id: "mod",
        name: "Moderator"
    },
    {
        id: "broadcaster",
        name: "Streamer"
    }
];

function mapMixerRoleIdToTwitchRoleId(mixerRoleId) {
    switch (mixerRoleId) {
    case "Subscriber":
        return "sub";
    case "Mod":
    case "ChannelEditor":
        return "mod";
    case "Owner":
        return "broadcaster";
    }
    return mixerRoleId;
}

exports.getTwitchRoles = () => twitchRoles;
exports.mapTwitchRole = role => twitchRoles.find(r => r.id === role);
exports.mapMixerRoleIdToTwitchRoleId = mapMixerRoleIdToTwitchRoleId;


