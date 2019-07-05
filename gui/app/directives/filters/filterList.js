"use strict";
(function() {
    angular.module("firebotApp")
        .component("filterList", {
            bindings: {
                filters: "=",
                eventSourceId: "<",
                eventId: "<",
                update: "&",
                modalId: "@"
            },
            template: `
        <div>
          <h3>Filters</h3>

          <div stlye="display:flex;">
                <div ng-repeat="filter in $ctrl.filters track by $index"
                    class="filter-bar clickable"
                    ng-click="$ctrl.openAddOrEditFilterModal($index)">
                        <span>
                            <b>{{$ctrl.getFilterName(filter.id)}}</b> {{filter.comparisonType}} <b>{{filter.value || '[No Value Set]'}}</b>
                        </span>
                        <span class="clickable-dark" style="padding-left: 10px;" ng-click="$ctrl.removeFilterAtIndex($index)" uib-tooltip="Remove filter" tooltip-append-to-body="true">
                            <i class="far fa-times"></i>
                        </span>
                </div>

                <div class="filter-bar clickable" ng-if="$ctrl.hasFiltersAvailable()" ng-click="$ctrl.openAddOrEditFilterModal()" uib-tooltip="Add new filter" tooltip-append-to-body="true">
                    <i class="far fa-plus"></i> 
                </div>

          </div>
             
            <div ng-if="!$ctrl.hasFiltersAvailable()" class="muted">There are no filters available for this event type.</div>            
        </div>
            `,
            controller: function(utilityService, backendCommunicator) {
                let $ctrl = this;

                // when the element is initialized
                let filterDefintions = [];

                let previousEventSourceId = null,
                    previousEventId = null;

                function reloadFilters() {
                    if ($ctrl.filters == null) {
                        $ctrl.filters = [];
                    }

                    filterDefintions = backendCommunicator.fireEventSync("getFiltersForEvent", {
                        eventSourceId: $ctrl.eventSourceId,
                        eventId: $ctrl.eventId
                    });

                    if (previousEventSourceId !== $ctrl.eventSourceId || previousEventId !== $ctrl.eventId) {
                        $ctrl.filters = $ctrl.filters.filter(f => filterDefintions.some(fd => fd.id === f.id));
                        previousEventSourceId = $ctrl.eventSourceId;
                        previousEventId = $ctrl.eventSourceId;
                    }
                }

                $ctrl.getFilterName = function(filterId) {
                    let filter = filterDefintions.find(fd => fd.id === filterId);
                    return filter ? filter.name : filterId;
                };

                $ctrl.$onInit = function() {
                    reloadFilters();
                };

                $ctrl.$onChanges = function() {
                    reloadFilters();
                };

                $ctrl.hasFiltersAvailable = function() {
                    return filterDefintions.length > 0;
                };

                /*$ctrl.actionsUpdate = function() {
                    $ctrl.update({ actions: $ctrl.actionsArray });
                };*/

                $ctrl.removeFilterAtIndex = function(index) {
                    $ctrl.filters.splice(index, 1);
                };

                $ctrl.openAddOrEditFilterModal = function(index) {
                    utilityService.showModal({
                        component: "addOrEditFilterModal",
                        windowClass: "fb-medium-modal",
                        resolveObj: {
                            filter: () => $ctrl.filters[index],
                            availableFilters: () => filterDefintions,
                            index: () => index
                        },
                        closeCallback: resp => {
                            let action = resp.action;

                            switch (action) {
                            case "add":
                                $ctrl.filters.push(resp.filter);
                                break;
                            case "update":
                                $ctrl.filters[resp.index] = resp.filter;
                                break;
                            case "delete":
                                $ctrl.removeFilterAtIndex(resp.index);
                                break;
                            }
                        }
                    });
                };
            }
        });
}());