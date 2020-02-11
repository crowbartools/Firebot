"use strict";

(function() {
    angular.module("firebotApp")
        .component("imageTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-image" ng-style="$ctrl.getButtonStyle()"></div>                        
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.getButtonStyle = function() {
                    let style = {};

                    let borderRadius = $ctrl.control.mixplay.borderRadius;
                    if (borderRadius !== undefined && borderRadius !== null) {
                        if (!isNaN(borderRadius)) {
                            borderRadius += "px";
                        }
                    }

                    style = {
                        'border': $ctrl.control.mixplay.border != null && $ctrl.control.mixplay.border !== "" ? $ctrl.control.mixplay.border : null,
                        "border-radius": borderRadius
                    };

                    if ($ctrl.control.mixplay.imageUrl) {
                        style["background-image"] = `url(${$ctrl.control.mixplay.imageUrl})`;
                    }

                    return style;
                };
            }
        });
}());
