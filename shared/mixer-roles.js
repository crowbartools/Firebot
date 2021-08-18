"use strict";

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

exports.mapMixerRole = mapMixerRole;


