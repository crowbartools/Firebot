"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {

    const usernameFilter = require("./builtin/username");
    const viewerRolesFilter = require("./builtin/viewerRoles");

    const skillTypeFilter = require("./builtin/skill-type");
    const skillNameFilter = require("./builtin/skill-name");
    const skillCurrencyTypeFilter = require("./builtin/skill-currency-type");
    const skillCost = require("./builtin/skill-cost");

    filterManager.registerFilter(usernameFilter);
    filterManager.registerFilter(viewerRolesFilter);

    filterManager.registerFilter(skillTypeFilter);
    filterManager.registerFilter(skillNameFilter);
    filterManager.registerFilter(skillCurrencyTypeFilter);
    filterManager.registerFilter(skillCost);

};