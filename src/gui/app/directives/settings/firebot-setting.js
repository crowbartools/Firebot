"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotSetting", {
            bindings: {
                name: "@",
                description: "@"
            },
            transclude: {
                descriptionAddon: "?settingDescriptionAddon"
            },
            template: `
            <div style="display: flex; width: 100%; padding: 20px 0; border-bottom: 2px solid #383D3F;">
                <div style="flex: 1;">
                    <h4>{{$ctrl.name}}</h4>
                    <div style="opacity: 0.7;">{{$ctrl.description}} <div style="display: inline-block" ng-transclude="descriptionAddon"></div></div>
                </div>
                <div ng-transclude style="flex: 1; display:flex; align-items: center; justify-content: flex-end;"></div>
            </div>
        `
        });
}());
