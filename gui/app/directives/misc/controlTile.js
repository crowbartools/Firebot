"use strict";

(function() {
    angular.module("firebotApp")
        .component("controlTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div style="width: 100%; height: 100%;">
                    <div class="flex-center" style="overflow: hidden;width: 100%; height: 100%">
                        {{$ctrl.control.name}}
                    </div>
                    <span ng-show="$ctrl.getControlSettings($ctrl.control.kind).resizable">
                        <span resize="left" class="resize"><span class="resize-ball"></span></span>
                        <span resize="right" class="resize"><span class="resize-ball"></span></span>
                        <span resize="top" class="resize"><span class="resize-ball"></span></span>
                        <span resize="bottom" class="resize"><span class="resize-ball"></span></span>
                    </span>
                </div>
            `,
            controller: function(controlHelper) {
                let $ctrl = this;

                $ctrl.getControlSettings = function(type) {
                    return controlHelper.controlSettings[type];
                };
            }
        });
}());
