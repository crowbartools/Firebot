"use strict";

// Modal for adding or editting an event

(function() {

    let uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("addOrEditEventModal", {
        template:
        `
        <div class="modal-header">
            <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title" id="editEventLabel">{{$ctrl.isNewEvent ? "Add Event" : "Edit Event"}}</h4>
        </div>
        <div class="modal-body">
            <div class="general-event-settings">
            
                <div class="effect-setting-container">
                    <h3>Trigger On</h3>
                    <searchable-event-dropdown selected="{ eventId: $ctrl.event.eventId, sourceId: $ctrl.event.sourceId }" style="width:100%" update="$ctrl.eventChanged(event)"></searchable-event-dropdown>
                </div>

                <div class="effect-setting-container">
                    <h3>Name</h3>
                    <input type="text" class="form-control event-id" aria-describedby="basic-addon3" placeholder="Enter name" ng-model="$ctrl.event.name" ng-change="$ctrl.nameChanged()">
                </div>
        
                <div ng-if="$ctrl.event.eventId != null">
                    <filter-list event-source-id="$ctrl.event.sourceId" event-id="$ctrl.event.eventId" filter-data="$ctrl.event.filterData"></filter-list>
                </div>
                
                 <!-- <div class="effect-setting-container setting-padtop" ng-show="$ctrl.allSortTags != null && $ctrl.allSortTags.length > 0">
                    <h3>Sort Tags</h3>
                    <sort-tag-list current-tag-ids="$ctrl.event.sortTags" all-tags="$ctrl.allSortTags"></sort-tag-list>
                </div> -->

                <div class="other-settings setting-padtop">
                    <div class="settings-title">
                        <h3>Settings</h3>
                    </div>

                    <div class="controls-fb-inline effect-setting-container">
                        <label class="control-fb control--checkbox">Is Enabled
                            <input type="checkbox" ng-model="$ctrl.event.active" aria-label="..." checked>
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
                <div class="cooldown-title">
                    <div class="controls-fb-inline effect-custom-cooldown-container">
                        <label class="control-fb control--checkbox">Custom Cooldown
                            <input type="checkbox" ng-model="$ctrl.event.customCooldown" aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
                        <div id="cooldown-options" ng-if="$ctrl.event.customCooldown" class="nav-body-wrapper" style="padding-left: 29px;">
                            <input type="number" class="form-control event-id" aria-describedby="basic-addon3" placeholder="Enter time in seconds" ng-model="$ctrl.event.customCooldownSecs" style="margin-bottom: 6px;">
                            <label class="control-fb control--checkbox">Apply Cooldown Per User
                                <input type="checkbox" ng-model="$ctrl.event.customCooldownPerUser" aria-label="..." >
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                    </div>
            </div>
            </div>
            <div ng-if="$ctrl.event.eventId != null" class="effect-setting-container setting-padtop">
                <effect-list header="What should this event do?" effects="$ctrl.event.effects" trigger="event" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{modalId}}" is-array="true"></effect-list>      
            </div>
        </div>
        <div class="modal-footer sticky-footer edit-event-footer">
            <button ng-if="!$ctrl.isNewEvent" type="button" class="btn btn-danger delete-event-button pull-left" ng-click="$ctrl.delete()">Delete Event</button>
            <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
            <button type="button" class="btn btn-primary event-edit-save" ng-click="$ctrl.save()">{{isNewEvent ? "Add" : "Save"}}</button>
        </div>
        <scroll-sentinel element-class="edit-event-footer"></scroll-sentinel>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, utilityService, ngToast, eventsService) {
            let $ctrl = this;

            $ctrl.isNewEvent = true;

            $ctrl.eventNameManuallyEditted = true;
            $ctrl.nameChanged = () => {
                $ctrl.eventNameManuallyEditted = true;
            };

            $ctrl.event = {
                name: "",
                active: true,
                cached: true
            };

            $ctrl.triggerMeta = {};

            function updateTriggerId() {
                if ($ctrl.event.sourceId && $ctrl.event.eventId) {
                    $ctrl.triggerMeta.triggerId = `${$ctrl.event.sourceId}:${$ctrl.event.eventId}`;
                }
            }
            updateTriggerId();

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.event == null) {
                    $ctrl.isNewEvent = true;
                    $ctrl.eventNameManuallyEditted = false;
                } else {
                    $ctrl.isNewEvent = false;
                    $ctrl.event = JSON.parse(angular.toJson($ctrl.resolve.event));
                }

                let modalId = $ctrl.resolve.modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        let modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Event",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });

                updateTriggerId();
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.event.effects = effects;
            };

            $ctrl.eventChanged = function(event) {
                $ctrl.event.eventId = event.eventId;
                $ctrl.event.sourceId = event.sourceId;
                if (!$ctrl.eventNameManuallyEditted) {
                    $ctrl.event.name = event.name;
                }
                updateTriggerId();
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewEvent) return;

                utilityService
                    .showConfirmationModal({
                        title: "Delete Event",
                        question: `Are you sure you want to delete this event?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            $ctrl.close({
                                $value: {
                                    event: $ctrl.event,
                                    groupId: $ctrl.resolve.groupId,
                                    index: $ctrl.resolve.index,
                                    action: "delete"
                                }
                            });
                        }
                    });
            };

            $ctrl.save = function() {
                if ($ctrl.event.name == null || $ctrl.event.name === "") {
                    ngToast.create("Please enter an event name.");
                    return;
                }

                if ($ctrl.isNewEvent) {
                    $ctrl.event.id = uuidv1();
                }

                $ctrl.close({
                    $value: {
                        event: $ctrl.event,
                        groupId: $ctrl.resolve.groupId,
                        index: $ctrl.resolve.index,
                        action: $ctrl.isNewEvent ? "add" : "update"
                    }
                });
            };
        }
    });
}());
