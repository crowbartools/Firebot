"use strict";

(function() {
    angular.module("firebotApp")
        .component("liveControlPreview", {
            bindings: {
                control: "<"
            },
            template: `
                <div>
                    <div style="display: flex; align-items: center;margin-bottom: 5px;">
                        <h4 style="margin: 0 15px 0 0;">Preview</h4> <grid-size-selection selected-size="$ctrl.gridSize" update="$ctrl.gridSizeChanged(size)" available-grids="$ctrl.availableGrids"></grid-size-selection>
                    </div>
                    <div style="display:flex; align-items: center;">
                        <div style="width: {{$ctrl.controlPixelDimensions.width}}px; height: {{$ctrl.controlPixelDimensions.height}}px;">
                            <control-tile control="$ctrl.control" class="control-tile-wrapper" preview-mode="true"></control-tile>
                        </div>
                    </div>
                </div>
            `,
            controller: function(gridHelper, controlHelper) {
                let $ctrl = this;

                $ctrl.controlPixelDimensions = {
                    width: 0,
                    height: 0
                };

                $ctrl.gridSize = gridHelper.currentGridSize;

                $ctrl.availableGrids = [];

                function calculateSizes() {
                    if (!$ctrl.control) return;

                    if ($ctrl.control.position) {
                        $ctrl.availableGrids = $ctrl.control.position.map(p => p.size);
                    }

                    let kind = $ctrl.control.kind;
                    if (kind) {
                        let controlSettings = controlHelper.controlSettings[kind];

                        let controlSize;
                        if ($ctrl.gridSize && $ctrl.control.position) {
                            controlSize = $ctrl.control.position.find(p => p.size === $ctrl.gridSize);
                        }
                        if (!controlSize) {
                            controlSize = controlSettings.minSize;
                        }
                        $ctrl.controlPixelDimensions = {
                            width: controlSize.width * 12,
                            height: controlSize.height * 12
                        };
                    }
                }

                $ctrl.gridSizeChanged = function(size) {
                    $ctrl.gridSize = size;
                    calculateSizes();
                };

                $ctrl.$onInit = function() {
                    calculateSizes();
                };

                $ctrl.$onChanges = function() {
                    calculateSizes();
                };
            }
        });
}());
