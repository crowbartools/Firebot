"use strict";
(function() {

    const fontManager = require('../../backend/fontManager');

    angular
        .module("firebotApp")
        .factory("fontManager", function() {
            return fontManager;
        });
}());
