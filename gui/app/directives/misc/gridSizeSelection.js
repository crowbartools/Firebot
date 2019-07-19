"use strict";

(function() {
    angular.module("firebotApp")
        .component("gridSizeSelection", {
            bindings: {
                selectedSize: "=",
                availableGrids: "<",
                update: "&"
            },
            template: `
                <div class="flex-row-center">
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('large')" 
                        ng-show="$ctrl.gridIsAvailable('large')"
                        style="margin-right: 7px;" 
                        ng-class="{'selected': $ctrl.sizeSelected('large')}"
                        uib-tooltip="Large Grid (Desktops)">
                            <i class="fal fa-desktop"></i>
                    </div>
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('medium')"
                        ng-show="$ctrl.gridIsAvailable('medium')" 
                        style="margin-right: 7px;transform: rotate(-90deg);" 
                        ng-class="{'selected': $ctrl.sizeSelected('medium')}"
                        uib-tooltip="Medium Grid (Tablets)">
                            <i class="fal fa-tablet"></i>
                    </div>
                    <div 
                        class="grid-icon clickable-minimal" 
                        ng-click="$ctrl.setSize('small')" 
                        ng-show="$ctrl.gridIsAvailable('small')"
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

                $ctrl.gridIsAvailable = function(size) {
                    if ($ctrl.availableGrids && Array.isArray($ctrl.availableGrids)) {
                        if ($ctrl.availableGrids.length < 2) {
                            return false;
                        }
                        return $ctrl.availableGrids.includes(size);
                    }
                    return true;
                };

                $ctrl.sizeSelected = function(size) {
                    return size === $ctrl.selectedSize;
                };

            }
        });
}());
