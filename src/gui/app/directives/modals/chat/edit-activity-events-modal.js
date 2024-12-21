"use strict";

(function() {
    angular.module("firebotApp")
        .component("editActivityEventsModal", {
            template: `
            <div class="modal-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Activity Events</h4>
            </div>
            <div class="modal-body" style="padding: 0 35px">
              <p>Select which events you want to see in the activity feed</p>
              <div class="viewer-db-switches">
                <div style="margin-bottom: 10px;">
                    <searchbar placeholder-text="Search events" query="eventSearch" />
                </div>
                <div ng-hide="eventSearch && !!eventSearch.length" style="display: flex;align-items: center;justify-content: space-between;margin-bottom:10px;padding-bottom: 5px; border-bottom: 1px solid #585858;">
                        <span style="font-weight: 900;" id="selectAllLabel">Select All</span>
                        <span>
                            <input class="tgl tgl-light sr-only" id="select-all" type="checkbox" aria-labelledby="selectAllLabel"
                            ng-checked="$ctrl.allEventsChecked()"
                            ng-click="$ctrl.toggleAllEvents()"/>
                        <label class="tgl-btn" for="select-all"></label>
                    </span>
                </div>
                <div ng-repeat="event in $ctrl.events | orderBy:'eventName' | filter:eventSearch">
                  <div style="display: flex;align-items: center;justify-content: space-between;margin-bottom:5px;">
                      <span><span style="font-weight: 900;">{{event.eventName}}</span> <span>({{event.sourceName}})</span></span>
                      <span>
                          <input class="tgl tgl-light sr-only" id="{{event.sourceId}}:{{event.eventId}}" type="checkbox" aria-label="{{event.sourceId}} {{event.eventId}}"
                            ng-checked="$ctrl.eventIsChecked(event)"
                            ng-click="$ctrl.toggleEventChecked(event)"/>
                        <label class="tgl-btn" for="{{event.sourceId}}:{{event.eventId}}"></label>
                      </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer sticky-footer edit-activity-events-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            <scroll-sentinel element-class="edit-activity-events-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($q, backendCommunicator, settingsService) {
                const $ctrl = this;

                $ctrl.events = [];

                $ctrl.allowedEvents = settingsService.getSetting("AllowedActivityEvents");

                $q.when(backendCommunicator
                    .fireEventAsync("get-activity-feed-supported-events"))
                    .then((supportedEvents) => {
                        if (supportedEvents != null) {
                            $ctrl.events = supportedEvents;
                        }
                    });

                $ctrl.toggleEventChecked = function(event) {
                    const eventKey = `${event.sourceId}:${event.eventId}`;
                    if ($ctrl.eventIsChecked(event)) {
                        $ctrl.allowedEvents =
                            $ctrl.allowedEvents.filter(e => e !== eventKey);
                    } else {
                        $ctrl.allowedEvents.push(eventKey);
                    }
                };

                $ctrl.eventIsChecked = function(event) {
                    return $ctrl.allowedEvents.includes(`${event.sourceId}:${event.eventId}`);
                };

                $ctrl.allEventsChecked = () => $ctrl.events.every(event =>
                    $ctrl.allowedEvents.includes(`${event.sourceId}:${event.eventId}`));

                $ctrl.toggleAllEvents = () => {
                    if ($ctrl.allEventsChecked()) {
                        $ctrl.allowedEvents = [];
                    } else {
                        $ctrl.allowedEvents = $ctrl.events.map(event =>
                            `${event.sourceId}:${event.eventId}`);
                    }
                };

                $ctrl.save = () => {
                    console.log($ctrl.allowedEvents);
                    settingsService.saveSetting("AllowedActivityEvents", $ctrl.allowedEvents);
                    $ctrl.close();
                };

                $ctrl.$onInit = function() {};
            }
        });
}());
