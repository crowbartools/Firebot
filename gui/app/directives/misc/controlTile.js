"use strict";

(function() {
    angular.module("firebotApp")
        .component("controlTile", {
            bindings: {
                control: "<",
                previewMode: "<"
            },
            template: `
                <div style="width: 100%; height: 100%;">
                    <div ng-show="$ctrl.previewMode" ng-switch="$ctrl.control.kind" class="flex-center" style="width: 100%; height: 100%">

                        <button-tile ng-switch-when="button" control="$ctrl.control" style="width:100%; height: 100%;"></button-tile>

                        <label-tile ng-switch-when="label" control="$ctrl.control" style="width:100%; height: 100%;"></label-tile>

                        <joystick-tile ng-switch-when="joystick" control="$ctrl.control" style="width:100%; height: 100%;position: relative;"></joystick-tile>

                        <textbox-tile ng-switch-when="textbox" control="$ctrl.control" style="width:100%; height: 100%;"></textbox-tile>

                        <div ng-switch-default class="default-control">
                            <span class="control-name">{{$ctrl.control.name}}</span>
                        </div>             
                    </div>
                    <div ng-hide="$ctrl.previewMode" class="default-control">
                        <span class="control-name">{{$ctrl.control.name}}</span>
                    </div>
                </div>
            `,
            controller: function() {
                let $ctrl = this;

            }
        });
}());
