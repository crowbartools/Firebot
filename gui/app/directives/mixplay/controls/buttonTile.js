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
                        <div class="mixer-button-text" ng-style="$ctrl.getTextStyle()">{{$ctrl.control.text}}</div>
                        <div class="mixer-spark-wrapper" ng-show="$ctrl.control.cost">
                            <div class="mixer-spark-pill">{{$ctrl.control.cost}}</div>
                        </div>
                    </div>
                </div>                        
            `,
            controller: function() {
                let $ctrl = this;

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
                        'border': $ctrl.control.borderColor ? `2px solid ${$ctrl.control.borderColor}` : null
                    };

                    if ($ctrl.control.backgroundImage) {
                        style["background-image"] = `url(${$ctrl.control.backgroundImage})`;
                    } else {
                        style["background"] = $ctrl.control.backgroundColor;
                    }

                    return style;
                };
            }
        });
}());
