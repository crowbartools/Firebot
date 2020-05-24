"use strict";

(function() {
    angular.module("firebotApp").component("settingContainer", {
        bindings: {
            header: "@",
            description: "@",
            padTop: "<"
        },
        transclude: true,
        template: `
            <div class="fb-setting-container" ng-class="{ 'fb-setting-padtop' : $ctrl.padTop }">
                <div class="fb-setting-header" ng-if="$ctrl.header">
                    <h4>{{$ctrl.header}} <span ng-if="$ctrl.description != null && $ctrl.description != ''" class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">({{$ctrl.description}})</span></h4>
                </div>
                <div class="fb-setting-content" ng-transclude></div>
            </div>
        `
    });
}());
