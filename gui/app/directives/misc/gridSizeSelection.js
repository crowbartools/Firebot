"use strict";

(function() {
    angular.module("firebotApp")
        .component("gridSizeSelection", {
            bindings: {
                selectedSize: "=",
                update: "&"
            },
            template: `
                <div class="flex-row-center">
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('large')" 
                        ng-class="{'selected': $ctrl.sizeSelected('large')}"
                        uib-tooltip="Large Grid (Desktops)">
                            <i class="fal fa-desktop"></i>
                    </div>
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('medium')" 
                        style="margin-left: 7px;transform: rotate(-90deg);" 
                        ng-class="{'selected': $ctrl.sizeSelected('medium')}"
                        uib-tooltip="Medium Grid (Tablets)">
                            <i class="fal fa-tablet"></i>
                    </div>
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('small')" 
                        style="margin-left: 7px" 
                        ng-class="{'selected': $ctrl.sizeSelected('small')}"
                        uib-tooltip="Small Grid (Phones)">
                            <i class="fal fa-mobile"></i>
                    </div>
                </div>
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.setSize = function(size) {
                    $ctrl.selectedSize = size;
                    $ctrl.update({
                        size: size
                    });
                };

                $ctrl.sizeSelected = function(size) {
                    return size === $ctrl.selectedSize;
                };

            }
        });
}());
