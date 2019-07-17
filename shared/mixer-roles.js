"use strict";

const mixerRoles = [
    {
        id: "Pro",
        name: "Pro Users"
    },
    {
        id: "Subscriber",
        name: "Subscribers"
    },
    {
        id: "Partner",
        name: "Partners"
    },
    {
        id: "Mod",
        name: "Moderators"
    },
    {
        id: "ChannelEditor",
        name: "Channel Editors"
    },
    {
        id: "Staff",
        name: "Staff"
    },
    {
        id: "Owner",
        name: "Streamer"
    }
];

// get a firebot mixer role object baed on the raw role id from mixers api
function mapMixerRole(rawRole) {
    let mappedRole;
    switch (rawRole) {
    case "Staff":
    case "Guardian":
    case "GlobalMod":
    case "Founder":
        mappedRole = "Staff";
        break;
    case "VerifiedPartner":
    case "Partner":
        mappedRole = "Partner";
        break;
    default:
        mappedRole = rawRole;
    }
    return mixerRoles.find(r => r.id === mappedRole);
}

exports.getMixerRoles = () => mixerRoles;
exports.mapMixerRole = mapMixerRole;


