"use strict";
(function() {

    const profileManager = require("../../backend/common/profile-manager.js");

    angular
        .module("firebotApp")
        .factory("profileManager", function() {
            return profileManager;
        });
}());
