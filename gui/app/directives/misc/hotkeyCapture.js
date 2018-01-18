'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("hotkeyCapture", {
            bindings: {
            },
            template: `
                <span>
                <button ng-click="$ctrl.">Capture</button>
                </span>
            `,
            controller: function() {
                let ctrl = this;
                ctrl.recordKeys = function() {

                };
            }
        });
}());