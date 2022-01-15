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
                        <searchable-event-dropdown
                            selected="{ eventId: $ctrl.event.eventId, sourceId: $ctrl.event.sourceId }"
                            style="width:100%"
                            update="$ctrl.eventChanged(event)"
                        ></searchable-event-dropdown>
                    </div>

                    <div ng-if="$ctrl.metadata" style="text-transform: capitalize">
                        <command-option
                            ng-repeat="data in $ctrl.metadata"
                            name="data.title"
                            metadata="data"
                            on-update="$ctrl.isAnon(value)"
                        ></command-option>
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

                $ctrl.metadata = [];
                $ctrl.eventData = {
                    eventId: null,
                    sourceId: null,
                    metadata: {}
                };
                $ctrl.eventError = false;

                $ctrl.changeUsername = (key, usernameType, isAnon) => {
                    const username = $ctrl.metadata.find(md => md.key === key);

                    if (username && isAnon) {
                        username.value = `An Anonymous ${usernameType}`;
                    } else {
                        username.value = "";
                    }

                    const index = $ctrl.metadata.findIndex(md => md.key === key);
                    $ctrl.metadata[index] = username;
                };

                $ctrl.isAnon = (isAnon) => {
                    if ($ctrl.eventData.eventId === 'subs-gifted' || $ctrl.eventData.eventId === 'community-subs-gifted') {
                        $ctrl.changeUsername('gifterUsername', 'Gifter', isAnon);
                        return;
                    } else if ($ctrl.eventData.eventId === 'cheer') {
                        $ctrl.changeUsername('username', 'Cheerer', isAnon);
                    }
                };

                $ctrl.eventChanged = async (event) => {
                    $ctrl.eventData.eventId = event.eventId;
                    $ctrl.eventData.sourceId = event.sourceId;
                    $ctrl.eventData.metadata = {};

                    const eventSource = await backendCommunicator.fireEventAsync("getEventSource", event);
                    if (eventSource.manualMetadata) {
                        $ctrl.metadata = Object.keys(eventSource.manualMetadata).map(mmd => {
                            const data = {
                                key: mmd,
                                title: mmd.split(/(?=[A-Z])/).join(" "),
                                type: eventSource.manualMetadata[mmd].type || typeof eventSource.manualMetadata[mmd],
                                options: eventSource.manualMetadata[mmd].options || {}
                            };

                            return data;
                        });
                    } else {
                        $ctrl.metadata = [];
                    }
                };

                $ctrl.simulate = () => {
                    $ctrl.eventError = false;

                    if ($ctrl.eventData.sourceId == null) {
                        $ctrl.eventError = true;
                        return;
                    }

                    if ($ctrl.metadata.length > 0) {
                        $ctrl.metadata.forEach(md => $ctrl.eventData.metadata[md.key] = md.value);
                    }

                    backendCommunicator.fireEventSync("simulateEvent", $ctrl.eventData);
                    ngToast.create({
                        className: 'success',
                        content: "Event simulated!"
                    });
                    $ctrl.close();
                };
            }
        });
}());
