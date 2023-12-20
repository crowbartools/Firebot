"use strict";

const twitchRoles = [
    {
        id: "broadcaster",
        name: "Streamer"
    },
    {
        id: "mod",
        name: "Moderator"
    },
    {
        id: "vip",
        name: "VIP"
    },
    {
        id: "sub",
        name: "Subscriber"
    },
    {
        id: "tier1",
        name: "Tier 1 Sub"
    },
    {
        id: "tier2",
        name: "Tier 2 Sub"
    },
    {
        id: "tier3",
        name: "Tier 3 Sub"
    },
    {
        id: "viewerlistbot",
        name: "Known Bot"
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
/**
 * @param {string} role
 * @returns {{id: string; name: string}}
 * */
exports.mapTwitchRole = role => {
    if (role === "founder") {
        return twitchRoles.find(r => r.id === 'sub');
    }
    return twitchRoles.find(r => r.id === role);
};
exports.mapMixerRoleIdToTwitchRoleId = mapMixerRoleIdToTwitchRoleId;
