"use strict";

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

                    <div ng-if="$ctrl.metadata">
                        <dynamic-parameter
                            ng-repeat="data in $ctrl.metadata"
                            name="{{data.key}}"
                            schema="data"
                            ng-model="$ctrl.eventData.metadata[data.key]"
                            ng-change="$ctrl.checkForAnon(data.key)"
                        ></dynamic-parameter>
                    </div>

                </div>
                <div class="modal-footer">
                    <button ng-if="$ctrl.hasPreviousProperties" type="button" class="btn btn-default pull-left" ng-click="$ctrl.loadPrevious()">Load Previous</button>
                    <button type="button" ng-disabled="$ctrl.eventData.eventId == null" class="btn btn-primary" ng-click="$ctrl.simulate()">Simulate</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, ngToast, simulatedEventsCache) {
                const $ctrl = this;

                $ctrl.metadata = [];
                $ctrl.manualMetadata = {};
                $ctrl.eventData = {
                    eventId: null,
                    sourceId: null,
                    metadata: {}
                };
                $ctrl.eventError = false;

                $ctrl.hasPreviousProperties = false;

                $ctrl.changeUsername = (key, usernameType, isAnon) => {
                    const username = $ctrl.metadata.find(md => md.key === key);

                    if (isAnon) {
                        $ctrl.eventData.metadata[key] = `An Anonymous ${usernameType}`;
                    } else {
                        const originalUsername = $ctrl.manualMetadata[key];

                        if (originalUsername) {
                            $ctrl.eventData.metadata[key] = originalUsername;
                        }
                    }

                    const index = $ctrl.metadata.findIndex(md => md.key === key);
                    $ctrl.metadata[index] = username;
                };

                $ctrl.checkForAnon = (key) => {
                    const isAnonKey = key === 'isAnonymous';
                    if (!isAnonKey) {
                        return;
                    }

                    const isAnon = $ctrl.eventData.metadata[key];

                    if ($ctrl.eventData.eventId === 'subs-gifted' || $ctrl.eventData.eventId === 'community-subs-gifted') {
                        $ctrl.changeUsername('gifterUsername', 'Gifter', isAnon);
                        return;
                    } else if ($ctrl.eventData.eventId === 'cheer') {
                        $ctrl.changeUsername('username', 'Cheerer', isAnon);
                    }
                };

                const getTitle = (metadata) => {
                    const titleArray = metadata.split(/(?=[A-Z])/);

                    const capitalized = titleArray.map(word => word.charAt(0).toUpperCase() + word.slice(1, word.length));
                    return capitalized.join(" ");
                };

                $ctrl.eventChanged = (event) => {
                    $ctrl.eventData.eventId = event.eventId;
                    $ctrl.eventData.sourceId = event.sourceId;
                    $ctrl.eventData.metadata = {};

                    $ctrl.hasPreviousProperties = simulatedEventsCache.hasPreviouslySimulatedEvent(
                        event.sourceId,
                        event.eventId
                    );

                    const eventSource = backendCommunicator.fireEventSync("events:get-event-source", event);
                    if (eventSource.manualMetadata) {
                        $ctrl.manualMetadata = eventSource.manualMetadata;
                        $ctrl.eventData.metadata = {
                            ...eventSource.manualMetadata
                        };
                        $ctrl.metadata = Object.keys(eventSource.manualMetadata).map((mmd) => {
                            const meta = eventSource.manualMetadata[mmd];
                            const dataType = meta == null ? "string" : meta.type || typeof meta;
                            const data = {
                                key: mmd,
                                title: getTitle(mmd),
                                type: dataType,
                                value: dataType !== "enum" ? (meta.value ?? meta) : undefined,
                                options: meta?.options || {}
                            };

                            return data;
                        });
                    } else {
                        $ctrl.metadata = [];
                    }
                };

                $ctrl.loadPrevious = () => {
                    if (!simulatedEventsCache.hasPreviouslySimulatedEvent(
                        $ctrl.eventData.sourceId,
                        $ctrl.eventData.eventId
                    )) {
                        return;
                    }

                    const previousProperties = simulatedEventsCache.getPreviouslySimulatedEventProperties(
                        $ctrl.eventData.sourceId,
                        $ctrl.eventData.eventId
                    );

                    $ctrl.metadata.forEach((md) => {
                        const previousValue = previousProperties[md.key];
                        if (previousValue != null) {
                            $ctrl.eventData.metadata[md.key] = previousValue;
                        }
                    });
                };

                $ctrl.simulate = () => {
                    $ctrl.eventError = false;

                    if ($ctrl.eventData.sourceId == null) {
                        $ctrl.eventError = true;
                        return;
                    }

                    simulatedEventsCache.setSimulatedEventProperties(
                        $ctrl.eventData.sourceId,
                        $ctrl.eventData.eventId,
                        $ctrl.eventData.metadata
                    );

                    backendCommunicator.fireEventSync("events:simulate-event", $ctrl.eventData);
                    ngToast.create({
                        className: 'success',
                        content: "Event simulated!"
                    });
                    $ctrl.close();
                };
            }
        });
}());
