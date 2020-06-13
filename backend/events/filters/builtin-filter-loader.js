"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {

    const usernameFilter = require("./builtin/username");
    const viewerRolesFilter = require("./builtin/viewerRoles");

    const skillTypeFilter = require("./builtin/skill-type");
    const skillNameFilter = require("./builtin/skill-name");
    const skillCurrencyTypeFilter = require("./builtin/skill-currency-type");
    const skillCost = require("./builtin/skill-cost");

    const donationFrom = require("./builtin/donation-from");
    const donationAmount = require("./builtin/donation-amount");

    const patronageEarned = require("./builtin/patronage-earned");

    const viewerLevel = require("./builtin/viewer-level");
    const viewerHearts = require("./builtin/viewer-total-hearts");

    const previousViewTime = require("./builtin/previous-view-time");
    const newViewTime = require("./builtin/new-view-time");

    const resubShared = require("./builtin/resub-shared");

    const hostType = require("./builtin/host-type");
    const hostViewerCount = require("./builtin/host-viewer-count");

    const messageType = require("./builtin/message-type");
    const message = require("./builtin/message");
    const messageOrigin = require("./builtin/message-origin");

    filterManager.registerFilter(usernameFilter);
    filterManager.registerFilter(viewerRolesFilter);

    filterManager.registerFilter(skillTypeFilter);
    filterManager.registerFilter(skillNameFilter);
    filterManager.registerFilter(skillCurrencyTypeFilter);
    filterManager.registerFilter(skillCost);

    filterManager.registerFilter(donationFrom);
    filterManager.registerFilter(donationAmount);

    filterManager.registerFilter(patronageEarned);

    filterManager.registerFilter(viewerLevel);
    filterManager.registerFilter(viewerHearts);

    filterManager.registerFilter(previousViewTime);
    filterManager.registerFilter(newViewTime);

    filterManager.registerFilter(resubShared);

    filterManager.registerFilter(hostType);
    filterManager.registerFilter(hostViewerCount);

    filterManager.registerFilter(messageType);
    filterManager.registerFilter(message);
    filterManager.registerFilter(messageOrigin);
};