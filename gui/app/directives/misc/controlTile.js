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

                        <button-tile ng-switch-when="button" control="$ctrl.control" style="width:100%; height: 100%; padding: 4px;"></button-tile>

                        <label-tile ng-switch-when="label" control="$ctrl.control" style="width:100%; height: 100%;"></label-tile>

                        <image-tile ng-switch-when="image" control="$ctrl.control" style="width:100%; height: 100%;"></image-tile>

                        <viewer-stat-tile ng-switch-when="viewerStat" control="$ctrl.control" style="width:100%; height: 100%;"></viewer-stat-tile>

                        <joystick-tile ng-switch-when="joystick" control="$ctrl.control" style="width:100%; height: 100%;position: relative;"></joystick-tile>

                        <textbox-tile ng-switch-when="textbox" control="$ctrl.control" style="width:100%; height: 100%;"></textbox-tile>

                        <div ng-switch-default class="default-control">
                            <span class="control-name">{{$ctrl.control.name}}</span>
                        </div>             
                    </div>
                    <div ng-hide="$ctrl.previewMode" class="default-control">
                        <span class="control-name">
                            <span class="control-kind"><i class="fas" ng-class="$ctrl.controlKindData.iconClass"></i> {{$ctrl.controlKindData.display}}</span>
                            <span>{{$ctrl.control.name}}</span>
                        </span>
                        <span class="control-dimensions">{{$ctrl.getDimensionDisplay()}}</span>
                    </div>
                </div>
            `,
            controller: function(gridHelper, controlHelper) {
                let $ctrl = this;


                $ctrl.getDimensionDisplay = () => {
                    if ($ctrl.control == null) return "";
                    if ($ctrl.control.position) {
                        let positionForGrid = $ctrl.control.position.find(p => p.size === gridHelper.currentGridSize);
                        if (positionForGrid) {
                            return `${positionForGrid.width} x ${positionForGrid.height}`;
                        }
                    }
                    return "";
                };

                $ctrl.controlKindData = {
                    display: "",
                    iconClass: ""
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.control == null) return;
                    let controlKindData = controlHelper.getControlKindData($ctrl.control.kind);
                    if (controlKindData == null) return;
                    $ctrl.controlKindData = controlKindData;
                };

            }
        });
}());
