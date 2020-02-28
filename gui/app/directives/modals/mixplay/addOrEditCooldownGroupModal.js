"use strict";
(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("addOrEditCooldownGroupModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewGroup ? 'Add New Cooldown Group' : 'Edit Cooldown Group'}}</h4>
            </div>
            <div class="modal-body">
                <div class="general-button-settings">
                    <div class="settings-title">
                        <h3>General Settings</h3>
                    </div>
                <div class="input-group settings-cooldown-groupid">
                    <span class="input-group-addon">Group Name</span>
                    <input type="text" class="form-control" ng-model="$ctrl.cooldownGroup.name">
                </div>
                <div class="input-group settings-cooldown-length">
                    <span class="input-group-addon">Cooldown (sec)</span>
                    <input type="number" class="form-control" ng-model="$ctrl.cooldownGroup.duration">
                </div>

                <div class="cooldown-group-button-container">
                    <h3>Controls</h3>
                    <div style="display:flex; justify-content: space-between; align-items: center;">
                        <div class="searchbar-wrapper">
                            <input type="text" class="form-control" placeholder="Search controls..." ng-model="controlSearch" style="padding-left: 27px;">
                            <span class="searchbar-icon"><i class="far fa-search"></i></span>
                        </div>
                        <div class="cooldown-group-button-reset">
                            <button class="btn btn-default" ng-click="$ctrl.unselectAllControls()">Uncheck all</button>
                        </div>
                    </div>
                    <div class="cooldown-group-buttons">
                        <div ng-repeat="controlData in $ctrl.availableControlData | filter:controlSearch track by controlData.controlId" class="cooldown-list-btn-wrapper">
                            <label class="control-fb control--checkbox" style="margin-bottom: 0">{{controlData.controlName}} <span class="muted" style="font-size:12px;">(Scene: <b>{{controlData.sceneName}}</b>)</span>
                                <input type="checkbox" ng-click="$ctrl.toggleControlSelected(controlData.controlId)" ng-checked="$ctrl.controlIsSelected(controlData.controlId)"/>
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                    </div>              
                </div>
            </div>
        
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger remove-cooldown-group pull-left" ng-show="!$ctrl.isNewGroup" ng-click="$ctrl.delete()">Delete</button>
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(mixplayService, controlHelper, utilityService, ngToast) {
            let $ctrl = this;

            $ctrl.availableControlData = [];

            $ctrl.toggleControlSelected = function(controlId) {
                if ($ctrl.controlIsSelected(controlId)) {
                    $ctrl.cooldownGroup.controlIds = $ctrl.cooldownGroup.controlIds.filter(c => c !== controlId);
                } else {
                    $ctrl.cooldownGroup.controlIds.push(controlId);
                }
            };

            $ctrl.controlIsSelected = function(controlId) {
                return $ctrl.cooldownGroup.controlIds.includes(controlId);
            };

            $ctrl.unselectAllControls = function() {
                $ctrl.cooldownGroup.controlIds = [];
            };

            $ctrl.isNewGroup = true;

            $ctrl.cooldownGroup = {
                active: true,
                name: "",
                duration: 0,
                controlIds: []
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.cooldownGroup) {
                    $ctrl.cooldownGroup = $ctrl.resolve.cooldownGroup;
                    $ctrl.isNewGroup = false;
                }

                $ctrl.availableControlData = mixplayService.getControlDataForCurrentProject()
                    .filter(cd => controlHelper.controlSettings[cd.controlKind].canCooldown);

            };

            $ctrl.delete = function() {
                if ($ctrl.isNewGroup) return;

                utilityService
                    .showConfirmationModal({
                        title: "Delete Cooldown Group",
                        question: `Are you sure you want to delete this Cooldown Group?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            $ctrl.close({
                                $value: {
                                    cooldownGroup: $ctrl.cooldownGroup,
                                    index: $ctrl.resolve.index,
                                    action: "delete"
                                }
                            });
                        }
                    });
            };

            $ctrl.save = function() {
                if ($ctrl.cooldownGroup.name == null || $ctrl.cooldownGroup.name === "") {
                    ngToast.create("Please provide a name.");
                    return;
                }

                if ($ctrl.cooldownGroup.duration === null ||
                    $ctrl.cooldownGroup.duration === undefined ||
                    $ctrl.cooldownGroup.duration < 1) {
                    ngToast.create("Please provide a duration.");
                    return;
                }

                if ($ctrl.isNewGroup) {
                    $ctrl.cooldownGroup.id = uuidv1();
                }

                $ctrl.close({
                    $value: {
                        cooldownGroup: $ctrl.cooldownGroup,
                        action: $ctrl.isNewGroup ? "add" : "update"
                    }
                });
            };
        }
    });
}());
