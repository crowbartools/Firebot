"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("eosOverlayRotation", {
            bindings: {
                effect: '=',
                padTop: "<"
            },
            template: `
            <eos-container header="Rotation" pad-top="$ctrl.padTop">

            </eos-container>
       `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = function() {
                    // do stuff on init
                };
            }
        });
}());
