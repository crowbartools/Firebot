"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {

    const usernameFilter = require("./builtin/username");
    const viewerRolesFilter = require("./builtin/viewerRoles");

    const donationFrom = require("./builtin/donation-from");
    const donationAmount = require("./builtin/donation-amount");

    const previousViewTime = require("./builtin/previous-view-time");
    const newViewTime = require("./builtin/new-view-time");

    const streamCategory = require("./builtin/stream-category");

    const subType = require("./builtin/sub-type");
    const subKind = require("./builtin/sub-kind");
    const giftCount = require("./builtin/gift-count");
    const giftDuration = require("./builtin/gift-duration");

    const hostType = require("./builtin/host-type");
    const hostViewerCount = require("./builtin/host-viewer-count");

    const message = require("./builtin/message");

    const rewardName = require("./builtin/reward-name");
    const reward = require("./builtin/reward");

    const cheerBitsAmount = require("./builtin/cheer-bits-amount");

    const isAnonymous = require("./builtin/is-anonymous");

    filterManager.registerFilter(usernameFilter);
    filterManager.registerFilter(viewerRolesFilter);

    filterManager.registerFilter(donationFrom);
    filterManager.registerFilter(donationAmount);

    filterManager.registerFilter(previousViewTime);
    filterManager.registerFilter(newViewTime);

    filterManager.registerFilter(streamCategory);

    filterManager.registerFilter(subType);
    filterManager.registerFilter(subKind);
    filterManager.registerFilter(giftCount);
    filterManager.registerFilter(giftDuration);

    filterManager.registerFilter(hostType);
    filterManager.registerFilter(hostViewerCount);

    filterManager.registerFilter(message);

    filterManager.registerFilter(reward);
    filterManager.registerFilter(rewardName);

    filterManager.registerFilter(cheerBitsAmount);

    filterManager.registerFilter(isAnonymous);
};