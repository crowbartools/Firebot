"use strict";

(function() {
    const fs = require("fs");
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .component("pluginSettings", {
            bindings: {
                effect: "=",
                modalId: "<",
                trigger: "<",
                triggerMeta: "<",
                allowStartup: "<"
            },
            template: `
            <eos-container header="Script">
            </eos-container>
            `,
            controller: function($scope, utilityService, $rootScope, $q, logger,
                $sce, backendCommunicator, profileManager) {
                // TODO: Implement
            }
        });
}());