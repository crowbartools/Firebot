"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("simulateGroupEventsModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Simulate Event</h4>
                </div>
                <div class="modal-body">
                    <p class="muted">Select an event to simulate to test any effects you have saved.</p>            
                    <div class="form-group" ng-class="{'has-error': $ctrl.eventError}">
                        <label class="control-label">Event</label>
                        <searchable-event-dropdown selected="{ eventId: $ctrl.event.eventId, sourceId: $ctrl.event.sourceId }" style="width:100%" update="$ctrl.eventChanged(event)"></searchable-event-dropdown>    
                    </div>            
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.simulate()">Simulate</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, ngToast) {
                const $ctrl = this;

                $ctrl.eventSourceId = null;
                $ctrl.eventId = null;
                $ctrl.eventError = false;

                $ctrl.eventChanged = (event) => {
                    $ctrl.eventId = event.eventId;
                    $ctrl.eventSourceId = event.sourceId;
                };

                $ctrl.simulate = () => {

                    $ctrl.eventError = false;

                    if ($ctrl.eventSourceId == null) {
                        $ctrl.eventError = true;
                        return;
                    }

                    backendCommunicator.fireEventSync("simulateEvent", { eventSourceId: $ctrl.eventSourceId, eventId: $ctrl.eventId });
                    ngToast.create({
                        className: 'success',
                        content: "Event simulated!"
                    });
                    $ctrl.close();
                };

                $ctrl.$onInit = () => {
                    // When the component is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
