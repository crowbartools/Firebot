"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {

    const usernameFilter = require("./builtin/username");
    filterManager.registerFilter(usernameFilter);

};