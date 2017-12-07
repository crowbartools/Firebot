'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("eosContainer", {
            bindings: {
                header: "@",
                padTop: "<"
            },
            transclude: true,
            template: `
                <div class="effect-setting-container" ng-class="{ 'setting-padtop' : $ctrl.padTop }">
                    <div class="effect-specific-title"><h4>{{$ctrl.header}}</h4></div>
                    <div class="effect-setting-content" ng-transclude></div>
                </div>
            `
        });
}());