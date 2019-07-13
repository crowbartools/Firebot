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
                <div class="settings-title">
                    <h3>General Settings</h3>
                </div>
            
                <div class="effect-setting-container setting-padtop">
                    <div class="input-group settings-eventid">
                    <span class="input-group-addon" id="basic-addon3">Event Name</span>
                    <input type="text" class="form-control ng-pristine ng-untouched ng-valid ng-not-empty event-id" aria-describedby="basic-addon3" ng-model="$ctrl.event.name">
                </div>
            </div>
        
            <div class="controls-fb-inline effect-setting-container setting-padtop">
                <label class="control-fb control--checkbox" ng-if="!$ctrl.isNewEvent">Active Event
                    <input type="checkbox" ng-model="$ctrl.event.active" aria-label="..." checked>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--checkbox">Show In Chat Feed <tooltip text="'Whether or not you want to see an alert in the chat feed when this event happens.'"></tooltip>
                    <input type="checkbox" ng-model="$ctrl.event.chatFeedAlert" aria-label="...">
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--checkbox">Skip Logging
                    <input type="checkbox" ng-model="$ctrl.event.skipLog" aria-label="...">
                    <div class="control__indicator"></div>
                </label>
            </div>
        
            <div class="effect-setting-container setting-padtop">
                <h3>Trigger On</h3>
                <searchable-event-dropdown selected="{ eventId: $ctrl.event.eventId, sourceId: $ctrl.event.sourceId }" style="width:100%" update="$ctrl.eventChanged(event)"></searchable-event-dropdown>
            </div>
        
            <div ng-if="$ctrl.event.eventId != null">
                <filter-list event-source-id="$ctrl.event.sourceId" event-id="$ctrl.event.eventId" filters="$ctrl.event.filters"></filter-list>
            </div>  
        </div>
        <div ng-if="$ctrl.event.eventId != null" class="effect-setting-container setting-padtop">
            <effect-list header="What should this event do?" effects="$ctrl.event.effects" trigger="event" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{modalId}}" is-array="true"></effect-list>      
        </div>
        <div class="modal-footer">
            <button ng-if="!$ctrl.isNewEvent" type="button" class="btn btn-danger delete-event-button pull-left" ng-click="$ctrl.delete()">Delete Event</button>
            <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
            <button type="button" class="btn btn-primary event-edit-save" ng-click="$ctrl.save()">{{isNewEvent ? "Add" : "Save"}}</button>
        </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, utilityService) {
            let $ctrl = this;

            $ctrl.isNewEvent = true;

            $ctrl.event = {
                name: "",
                active: true,
                filters: [],
                effects: []
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
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.event.effects = effects;
            };

            $ctrl.eventChanged = function(event) {
                $ctrl.event.eventId = event.eventId;
                $ctrl.event.sourceId = event.sourceId;
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
                if ($ctrl.event.name == null || $ctrl.event.name === "") return;

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
