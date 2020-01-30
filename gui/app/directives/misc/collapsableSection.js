"use strict";

(function() {
    angular.module("firebotApp")
        .component("collapsableSection", {
            bindings: {},
            transclude: {
                'header': 'sectionHeader',
                'content': 'sectionContent'
            },
            template: `
                <div ng-init="hidePanel = true">
                    <div ng-click="hidePanel = !hidePanel" ng-transclude="header"></div>
                    <div uib-collapse="hidePanel" ng-transclude="content"></div> 
                </div>
                `
        });
}());
