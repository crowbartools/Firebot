"use strict";

(function() {
    angular.module("firebotApp")
        .component("joystickTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-joystick">
                    <div class="arrows top"></div>
                    <div class="arrows left"></div>
                    <div class="handle" style="transform: translate(0px, 0px); transition: none 0s ease 0s;"></div>
                </div>                
            `,
            /*
            <div class="mixer-button" ng-style="$ctrl.getButtonStyle()">
                    <div class="mixer-button-content">
                        <div class="mixer-button-text" ng-style="$ctrl.getTextStyle()">{{$ctrl.control.mixplay.text}}</div>
                        <div class="mixer-spark-wrapper" ng-show="$ctrl.control.mixplay.cost">
                            <div class="mixer-spark-pill">{{$ctrl.control.mixplay.cost}}</div>
                        </div>
                    </div>
                </div>
            */
            controller: function() {

            }
        });
}());
