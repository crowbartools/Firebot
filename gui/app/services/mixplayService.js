"use strict";

(function() {

    const profileManager = require("../../lib/common/profile-manager.js");

    angular
        .module("firebotApp")
        .factory("mixplayService", function($rootScope, listenerService, logger) {
            let service = {};

            service.createNewProject = function(name) {

            };

            return service;
        });
}());
