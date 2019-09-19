"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('firebotApp')
        .component("restrictionsSection", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                restrictions: "=",
                modalId: "@"
            },
            template: `
                <div>
                    <h2>Restrictions</h2>
                    <div>Permissions, currency costs, and more.</div>
                    <div style="border-bottom: 1px solid black"></div>
                </div>
            `,
            controller: function(utilityService, backendCommunicator) {
                let $ctrl = this;

                let restrictionDefinitions = backendCommunicator.fireEventSync("getRestrictions");

                function getRestrictionDefinition(restrictionType) {
                    return restrictionDefinitions.find(r => r.definition.id === restrictionType);
                }
            }
        });
}());
