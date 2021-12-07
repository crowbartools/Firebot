"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotSettingCategory", {
            bindings: {
                name: "@",
                description: "@?",
                padTop: "<?"
            },
            transclude: true,
            template: `
                <div style="width: 100%;" ng-class="{ 'setting-category-padtop': $ctrl.padTop }">
                    <div style="font-size: 17px;opacity: 0.7;">{{$ctrl.name}}</div>
                    <div 
                        ng-if="$ctrl.description" 
                        style="opacity: 0.5; font-size: 16px;"
                    >{{$ctrl.description}}</div>
                </div>
            `
        });
}());
