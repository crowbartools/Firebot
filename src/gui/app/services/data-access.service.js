"use strict";
(function() {

    const { getPathInUserData, getJsonDbInUserData } = require("../../backend/common/data-access");

    angular
        .module("firebotApp")
        .factory("dataAccess", function() {
            const service = {};

            service.getJsonDbInUserData = getJsonDbInUserData;
            service.getPathInUserData = getPathInUserData;

            return service;
        });
}());
