"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotSetting", {
            bindings: {
                name: "@",
                tag: "@?",
                description: "@",
                bottomBorder: "<?"
            },
            transclude: {
                descriptionAddon: "?settingDescriptionAddon"
            },
            template: `
            <div style="display: flex; width: 100%; padding: 20px 0;" ng-style="{'border-bottom': $ctrl.bottomBorder === false ? 'none' : '2px solid #383D3F'}">
                <div style="flex: 1;">
                    <h4 style="display: flex; align-items: center; gap: 10px;">{{$ctrl.name}}<span ng-if="$ctrl.tag" class="label label-primary">{{$ctrl.tag}}</span></h4>
                    <div style="opacity: 0.7;">{{$ctrl.description}} <div style="display: inline-block;margin-top: 5px;" ng-transclude="descriptionAddon"></div></div>
                </div>
                <div ng-transclude style="flex: 1; display:flex; align-items: center; justify-content: flex-end;"></div>
            </div>
        `
        });
}());
