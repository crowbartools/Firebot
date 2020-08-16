"use strict";

(function() {

    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("addOrEditPresetEffectListModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()">&times;</span></button>
                <h4 class="modal-title">
                    {{$ctrl.isNewPresetList ? 'Add Preset Effect List' : 'Edit Preset Effect List' }}
                </h4>
            </div>
            <div class="modal-body">
                <div>
                    <h3>Name</h3>
                    <input type="text" class="form-control" placeholder="Enter name" ng-model="$ctrl.presetList.name">
                </div>

                <div>
                    <h3>Args</h3>
                    <p>Allow data to be passed to this preset effect list.</p>

                    <div class="role-bar" ng-repeat="arg in $ctrl.presetList.args track by $index">
                        <span uib-tooltip="Access via $presetListArg[{{arg.name}}]" tooltip-append-to-body="true">{{arg.name}}</span>
                        <span class="clickable" style="padding-left: 10px;" ng-click="$ctrl.deletePresetListArg($index)" uib-tooltip="Remove arg" tooltip-append-to-body="true">
                            <i class="far fa-times"></i>
                        </span>
                    </div>
                    <div class="role-bar clickable" ng-click="$ctrl.addPresetListArg()" uib-tooltip="Add arg" tooltip-append-to-body="true">
                        <i class="far fa-plus"></i>
                    </div>
                </div>
                
                <div style="margin-top:20px;">
                    <effect-list effects="$ctrl.presetList.effects" trigger="preset" update="$ctrl.effectListUpdated(effects)"></effect-list>
                </div>

                <div style="margin-top: 20px;">
                    <collapsable-panel header="How to trigger from StreamDeck">
                        <p>Steps:</p>
                        <ol>
                            <li>Add "Website" Action to a StreamDeck button</li>
                            <li>Set URL to <b>http://localhost:7472/api/v1/effects/preset/{{$ctrl.presetList.id}}</b></li>
                            <li>Check "Access in background"</li>
                        </ol>
                    </collapsable-panel>
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-danger pull-left" ng-show="!$ctrl.isNewPresetList && !$ctrl.hideDeleteButton" ng-click="$ctrl.delete()">Delete Preset List</button>
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
        controller: function(ngToast, utilityService, $scope) {
            const $ctrl = this;

            $ctrl.isNewPresetList = true;

            $ctrl.hideDeleteButton = false;

            $ctrl.presetList = {
                name: "",
                effects: null,
                args: []
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.presetList.effects = effects;
            };

            $ctrl.addPresetListArg = () => {
                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "Add Argument",
                        inputPlaceholder: "Enter name",
                        saveText: "Save",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else if ($ctrl.presetList.args.some(a => a.name === value.trim())) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Argument name cannot be empty and must be unique."

                    },
                    (name) => {
                        $ctrl.presetList.args.push({ name: name.trim() });
                    });

            };

            $ctrl.deletePresetListArg = (index) => {
                $ctrl.presetList.args.splice(index, 1);
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.presetList) {
                    $ctrl.presetList = JSON.parse(
                        angular.toJson($ctrl.resolve.presetList)
                    );

                    if ($ctrl.presetList.args == null) {
                        $ctrl.presetList.args = [];
                    }

                    $ctrl.isNewPresetList = false;
                }

                $ctrl.hideDeleteButton = $ctrl.resolve.hideDeleteButton;

                const modalId = $ctrl.resolve.modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        const modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Preset Effect List",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewPresetList) return;
                $ctrl.close({
                    $value: {
                        presetList: $ctrl.presetList,
                        action: "delete"
                    }
                });
            };

            $ctrl.save = function() {
                if ($ctrl.presetList.name == null || $ctrl.presetList.name === "") {
                    ngToast.create("Please provide a name for this Preset List");
                    return;
                }

                if ($ctrl.isNewPresetList) {
                    $ctrl.presetList.id = uuidv1();
                }

                $ctrl.close({
                    $value: {
                        presetList: $ctrl.presetList,
                        action: $ctrl.presetList ? "add" : "update"
                    }
                });
            };
        }
    });
}());
