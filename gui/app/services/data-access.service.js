"use strict";
(function() {

    const dataAccess = require("../../backend/common/data-access.js");

    angular
        .module("firebotApp")
        .factory("dataAccess", function() {
            return dataAccess;
        });
}());
