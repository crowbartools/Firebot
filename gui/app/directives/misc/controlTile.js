"use strict";

(function() {
    angular.module("firebotApp")
        .component("controlTile", {
            bindings: {
                control: "<",
                previewMode: "<"
            },
            template: `
                <div style="width: 100%; height: 100%; overflow: hidden;">
                    <div ng-show="$ctrl.previewMode" ng-switch="$ctrl.control.kind" class="flex-center" style="width: 100%; height: 100%">

                        <button-tile ng-switch-when="button" control="$ctrl.control" style="width:100%; height: 100%;"></button-tile>

                        <label-tile ng-switch-when="label" control="$ctrl.control" style="width:100%; height: 100%;"></label-tile>

                        <joystick-tile ng-switch-when="joystick" control="$ctrl.control" style="width:100%; height: 100%;position: relative;"></joystick-tile>

                        <div ng-switch-default class="default-control">
                            {{$ctrl.control.name}}
                        </div>             
                    </div>
                    <div ng-hide="$ctrl.previewMode" class="default-control">
                        {{$ctrl.control.name}}
                    </div>
                </div>
            `,
            controller: function() {
                let $ctrl = this;

            }
        });
}());
