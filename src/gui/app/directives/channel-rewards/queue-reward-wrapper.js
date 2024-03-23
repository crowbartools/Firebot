"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("queueRewardWrapper", {
            bindings: {
                selected: "<"
            },
            transclude: true,
            template: `
            <div class="queue-reward-wrapper" ng-class="{ selected: $ctrl.selected }" ng-transclude></div>
            `
        });
}());
