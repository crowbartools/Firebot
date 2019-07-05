"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("editControlModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit {{$ctrl.kindName}} - {{$ctrl.control.name}}</h4>
            </div>
            <div class="modal-body">
                <div class="general-button-settings">

                    <div class="settings-title">
                        <h4>Preview</h4>
                    </div>
                    <div style="display:flex; align-items: center;">
                        <div style="width: {{$ctrl.controlPixelDimensions.width}}px; height: {{$ctrl.controlPixelDimensions.height}}px;">
                            <control-tile control="$ctrl.control" class="control-tile-wrapper" preview-mode="true"></control-tile>
                        </div>
                    </div>
                    <div class="settings-title" style="margin-top: 15px;">
                        <h3>MixPlay Settings</h3>
                    </div>
                    <control-settings control="$ctrl.control"></control-settings>

                </div>

                <div>
                    <div class="settings-title" style="margin-top: 15px;">
                        <h3>Other</h3>
                    </div>

                    <div class="controls-fb-inline">
                        <label class="control-fb control--checkbox">Active
                            <input type="checkbox" ng-model="$ctrl.control.active" aria-label="..." checked>
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox">Show In Chat Feed <tooltip text="'Whether or not you want to see an alert in the chat feed when someone clicks this control'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.control.chatFeedAlert" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox">Skip Logging
                            <input type="checkbox" ng-model="$ctrl.control.skipLog" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>

                </div>

                <div ng-if="$ctrl.supportsEffects" class="function-button-settings" style="margin-top: 15px;">

                    <effect-list header="What should this {{$ctrl.kindName}} do?" effects="$ctrl.control.effects" trigger="interactive" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{$ctrl.modalId}}"></effect-list>

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
                dismiss: "&",
                modalInstance: "<"
            },
            controller: function($scope, controlHelper, utilityService) {
                let $ctrl = this;

                $ctrl.control = {};

                $ctrl.triggerMeta = {};

                $ctrl.modalId = "Edit Control";
                $ctrl.effectListUpdated = function(effects) {
                    $ctrl.control.effects = effects;
                };

                $ctrl.save = function() {
                    $ctrl.close({
                        $value: {
                            control: $ctrl.control
                        }
                    });
                };

                $ctrl.controlPixelDimensions = {width: 72, height: 48};

                $ctrl.supportsEffects = false;

                $ctrl.kindName = "";

                $ctrl.$onInit = function() {

                    if ($ctrl.resolve.control != null) {
                        $ctrl.control = JSON.parse(JSON.stringify($ctrl.resolve.control));

                        $ctrl.triggerMeta = {
                            control: $ctrl.control.kind
                        };

                        let kind = $ctrl.control.kind;
                        if (kind) {
                            let controlSettings = controlHelper.controlSettings[kind];

                            let gridSize = $ctrl.resolve.currentGridSize;
                            let controlSize;
                            if (gridSize && $ctrl.control.position) {
                                controlSize = $ctrl.control.position.find(p => p.size === gridSize);
                            }
                            if (!controlSize) {
                                controlSize = controlSettings.minSize;
                            }
                            $ctrl.controlPixelDimensions = {
                                width: controlSize.width * 12,
                                height: controlSize.height * 12
                            };

                            $ctrl.supportsEffects = controlSettings.effects;

                            $ctrl.kindName = controlSettings.name;
                        }
                    }

                    utilityService.addSlidingModal(
                        $ctrl.modalInstance.rendered.then(() => {
                            let modalElement = $("." + $ctrl.modalId).children();
                            return {
                                element: modalElement,
                                name: "Edit Control",
                                id: $ctrl.modalId,
                                instance: $ctrl.modalInstance
                            };
                        })
                    );

                    $scope.$on("modal.closing", function() {
                        utilityService.removeSlidingModal();
                    });
                };


            }
        });
}());
