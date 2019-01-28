"use strict";

(function() {
    angular.module("firebotApp")
        .component("buttonTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-button" ng-style="$ctrl.getButtonStyle()">
                    <div class="mixer-button-content">
                        <div class="mixer-button-text" ng-style="$ctrl.getTextStyle()">{{$ctrl.control.mixplay.text}}</div>
                        <div class="mixer-spark-wrapper" ng-show="$ctrl.control.mixplay.cost">
                            <div class="mixer-spark-pill">{{$ctrl.control.mixplay.cost}}</div>
                        </div>
                    </div>
                </div>                        
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.getTextStyle = function() {
                    let style = {};
                    style = {
                        'color': $ctrl.control.mixplay.textColor,
                        'font-size': $ctrl.control.mixplay.textSize
                    };
                    return style;
                };

                $ctrl.getButtonStyle = function() {
                    let style = {};
                    style = {
                        'border': $ctrl.control.mixplay.borderColor ? `2px solid ${$ctrl.control.mixplay.borderColor}` : null
                    };

                    if ($ctrl.control.mixplay.backgroundImage) {
                        style["background-image"] = `url(${$ctrl.control.mixplay.backgroundImage})`;
                    } else {
                        style["background"] = $ctrl.control.mixplay.backgroundColor;
                    }

                    return style;
                };
            }
        });
}());
