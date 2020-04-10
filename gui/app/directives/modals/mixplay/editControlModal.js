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

                        <div class="input-group">
                            <span class="input-group-addon" id="control-name">Control Name <tooltip text="'A name to help you identify this control. Viewers wont see this.'"></tooltip></span>
                            <input type="text" class="form-control" aria-describedby="control-name" ng-model="$ctrl.control.name">
                        </div>

                    <live-control-preview control="$ctrl.control"></live-control-preview>

                    <div class="settings-title" style="margin-top: 15px;">
                        <h3>MixPlay Settings</h3>
                    </div>
                    <control-settings control="$ctrl.control" kind="$ctrl.control.kind"></control-settings>

                </div>

                <div>
                    <div class="settings-title" style="margin-top: 15px;">
                        <h3>Other</h3>
                    </div>

                    <div class="controls-fb-inline">
                        <label class="control-fb control--checkbox">Enabled
                            <input type="checkbox" ng-model="$ctrl.control.active" aria-label="..." checked>
                            <div class="control__indicator"></div>
                        </label>
                        <label ng-show="$ctrl.supportsEffects" class="control-fb control--checkbox">Show In Chat Feed <tooltip text="'Whether or not you want to see an alert in the chat feed when someone clicks this control'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.control.chatFeedAlert" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>

                </div>

                <div ng-if="$ctrl.supportsEffects">
                    <div style="margin-bottom: 20px;">
                        <h3 style="margin-bottom: 5px;">Restrictions <span class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">(Permissions, currency costs, and more)</span></h3>
                        <restrictions-list 
                            restriction-data="$ctrl.control.restrictionData"
                            trigger="interactive" 
                            trigger-meta="$ctrl.triggerMeta">
                        </restrictions-section>
                    </div>  
                </div>

                <div ng-if="$ctrl.supportsEffects" class="function-button-settings" style="margin-top: 15px;">

                    <effect-list header="What should this {{$ctrl.kindName}} do?" effects="$ctrl.control.effects" trigger="interactive" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{$ctrl.modalId}}"></effect-list>

                </div>
                    
            </div>
            <div class="modal-footer sticky-footer edit-control-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            <scroll-sentinel element-class="edit-control-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&",
                modalInstance: "<"
            },
            controller: function($scope, controlHelper, utilityService, ngToast) {
                let $ctrl = this;

                $ctrl.control = {};

                $ctrl.triggerMeta = {};

                $ctrl.modalId = "Edit Control";
                $ctrl.effectListUpdated = function(effects) {
                    $ctrl.control.effects = effects;
                };

                $ctrl.save = function() {
                    if ($ctrl.control.name == null || $ctrl.control.name.trim() === "") {
                        ngToast.create("Please provide a control name.");
                        return;
                    }
                    $ctrl.close({
                        $value: {
                            control: $ctrl.control
                        }
                    });
                };

                $ctrl.supportsEffects = false;

                $ctrl.kindName = "";

                $ctrl.$onInit = function() {

                    if ($ctrl.resolve.control != null) {
                        $ctrl.control = JSON.parse(JSON.stringify($ctrl.resolve.control));

                        $ctrl.triggerMeta = {
                            triggerId: $ctrl.control.kind
                        };

                        let kind = $ctrl.control.kind;
                        if (kind) {
                            let controlSettings = controlHelper.controlSettings[kind];

                            $ctrl.supportsEffects = controlSettings.effects;

                            $ctrl.kindName = controlSettings.name;
                        }
                    }

                    let modalId = $ctrl.resolve.modalId;
                    utilityService.addSlidingModal(
                        $ctrl.modalInstance.rendered.then(() => {
                            let modalElement = $("." + modalId).children();
                            return {
                                element: modalElement,
                                name: "Edit Control",
                                id: modalId,
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
