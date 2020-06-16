"use strict";

(function() {
    angular.module("firebotApp")
        .component("collapsableSection", {
            bindings: {
                showText: "@",
                hideText: "@",
                textColor: "@"
            },
            transclude: true,
            template: `
                <div ng-init="hidePanel = true">
                    <div ng-click="hidePanel = !hidePanel" class="clickable" ng-style="{'color': $ctrl.textColor ? $ctrl.textColor : 'unset'}">
                        <span>{{hidePanel ? $ctrl.showText : $ctrl.hideText}}</span>
                        <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                    </div>
                    <div uib-collapse="hidePanel" ng-transclude></div> 
                </div>
                `
        });
}());
