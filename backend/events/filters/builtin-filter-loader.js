"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {

    const usernameFilter = require("./builtin/username");
    const viewerRolesFilter = require("./builtin/viewerRoles");

    const donationFrom = require("./builtin/donation-from");
    const donationAmount = require("./builtin/donation-amount");

    const previousViewTime = require("./builtin/previous-view-time");
    const newViewTime = require("./builtin/new-view-time");

    const subType = require("./builtin/sub-type");
    const giftCount = require("./builtin/gift-count");

    const hostType = require("./builtin/host-type");
    const hostViewerCount = require("./builtin/host-viewer-count");

    const messageType = require("./builtin/message-type");
    const message = require("./builtin/message");

    const rewardName = require("./builtin/reward-name");

    filterManager.registerFilter(usernameFilter);
    filterManager.registerFilter(viewerRolesFilter);

    filterManager.registerFilter(donationFrom);
    filterManager.registerFilter(donationAmount);

    filterManager.registerFilter(previousViewTime);
    filterManager.registerFilter(newViewTime);

    filterManager.registerFilter(subType);
    filterManager.registerFilter(giftCount);

    filterManager.registerFilter(hostType);
    filterManager.registerFilter(hostViewerCount);

    filterManager.registerFilter(messageType);
    filterManager.registerFilter(message);

    filterManager.registerFilter(rewardName);
};