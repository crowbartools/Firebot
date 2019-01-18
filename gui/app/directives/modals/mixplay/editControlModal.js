"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("editControlModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Control</h4>
            </div>
            <div class="modal-body">
                <div class="general-button-settings">

                    <div class="settings-title">
                        <h3>Control Preview</h3>
                    </div>
                    <div style="display:flex; align-items: center;">
                        <div style="width: {{$ctrl.controlPixelDimensions.width}}px; height: {{$ctrl.controlPixelDimensions.height}}px;">
                            <control-tile control="$ctrl.control" class="control-tile-wrapper"></control-tile>
                        </div>
                    </div>
                    <div class="settings-title" style="margin-top: 15px;">
                        <h3>Settings</h3>
                    </div>
                    <control-settings control="$ctrl.control"></control-settings>

                    
                
                </div>
                    
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(controlHelper) {
                let $ctrl = this;

                $ctrl.control = {};

                $ctrl.save = function() {
                    $ctrl.close({
                        $value: {
                            control: $ctrl.control
                        }
                    });
                };

                $ctrl.controlPixelDimensions = {width: 72, height: 48};

                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.control != null) {
                        $ctrl.control = JSON.parse(JSON.stringify($ctrl.resolve.control));

                        let kind = $ctrl.control.kind;
                        if (kind) {
                            let gridSize = $ctrl.resolve.currentGridSize;
                            let controlSize;
                            if (gridSize && $ctrl.control.position) {
                                controlSize = $ctrl.control.position.find(p => p.size === gridSize);
                            }
                            if (!controlSize) {
                                let controlSettings = controlHelper.controlSettings[kind];
                                controlSize = controlSettings.minSize;
                            }
                            $ctrl.controlPixelDimensions = {
                                width: controlSize.width * 12,
                                height: controlSize.height * 12
                            };
                        }
                    }
                };


            }
        });
}());
