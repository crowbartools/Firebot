'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("eosContainer", {
            bindings: {
                header: "@"
            },
            transclude: true,
            template: `
                <div class="effect-setting-container">
                    <div class="effect-specific-title"><h4>{{$ctrl.header}}</h4></div>
                    <div class="effect-setting-content" ng-transclude></div>
                </div>
            `
        });
}());