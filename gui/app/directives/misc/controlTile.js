"use strict";

(function() {
    angular.module("firebotApp")
        .component("controlTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div style="width: 100%; height: 100%; overflow: hidden;">
                    <div ng-switch="$ctrl.control.kind" class="flex-center" style="width: 100%; height: 100%">
                        <div ng-switch-when="button" class="mixer-button" ng-style="$ctrl.getButtonStyle()">
                            <div class="mixer-button-content">
                                <div class="mixer-button-text" ng-style="$ctrl.getTextStyle()">{{$ctrl.control.text}}</div>
                                <div class="mixer-spark-wrapper" ng-show="$ctrl.control.cost">
                                    <div class="mixer-spark-pill">{{$ctrl.control.cost}}</div>
                                </div>
                            </div>
                        </div>
                        <div ng-switch-default class="default-control">
                            {{$ctrl.control.name}}
                        </div>             
                    </div>
                </div>
            `,
            controller: function(controlHelper) {
                let $ctrl = this;

                $ctrl.getControlSettings = function(type) {
                    return controlHelper.controlSettings[type];
                };

                $ctrl.getTextStyle = function() {
                    let style = {};
                    style = {
                        'color': $ctrl.control.textColor,
                        'font-size': $ctrl.control.textSize
                    };
                    return style;
                };

                $ctrl.getButtonStyle = function() {
                    let style = {};
                    style = {
                        'background': $ctrl.control.backgroundColor,
                        'border': $ctrl.control.borderColor ? `2px solid ${$ctrl.control.borderColor}` : null
                    };
                    return style;
                };
            }
        });
}());
