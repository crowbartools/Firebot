"use strict";

(function() {
    angular.module("firebotApp")
        .component("filterList", {
            bindings: {
                filterData: "=",
                eventSourceId: "<",
                eventId: "<",
                update: "&",
                modalId: "@"
            },
            template: `
        <div>
          <h3 style="margin-bottom: 5px;">Filters</h3>
          <div style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand'; color: #8A8B8D;" ng-if="$ctrl.hasFiltersAvailable()">
            <span>Only trigger this event when</span>

            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                  <div class="noselect pointer ddtext" style="font-size: 12px;">{{$ctrl.getFilterModeDisplay()}}<span class="fb-arrow down ddtext"></span></div>
                  <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>

                    <li ng-click="$ctrl.filterData.mode = 'exclusive'">
                      <a style="padding-left: 10px;">all filters pass</a>
                    </li>

                    <li ng-click="$ctrl.filterData.mode = 'inclusive'">
                      <a style="padding-left: 10px;">any filter passes</a>
                    </li>
                </ul>
            </div>
            <span>:</span>
          </div>
          <div stlye="display:flex;">
                <div ng-repeat="filter in $ctrl.filterData.filters track by $index"
                    class="filter-bar"
                    ng-click="$ctrl.openAddOrEditFilterModal($index)">
                        <filter-display filter="filter" filter-type="$ctrl.getFilterType(filter.type)"></filter-display>
                        <span class="clickable" style="padding-left: 10px;" ng-click="$ctrl.removeFilterAtIndex($index)" uib-tooltip="Remove filter" tooltip-append-to-body="true">
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
                    if ($ctrl.filterData == null) {
                        $ctrl.filterData = {
                            mode: "exclusive",
                            filters: []
                        };
                    }
                    if ($ctrl.filterData.filters == null) {
                        $ctrl.filterData.filters = [];
                    }

                    filterDefintions = backendCommunicator.fireEventSync("getFiltersForEvent", {
                        eventSourceId: $ctrl.eventSourceId,
                        eventId: $ctrl.eventId
                    }).map(fd => {
                        fd.getPresetValues = eval(fd.getPresetValues); // eslint-disable-line no-eval
                        fd.getSelectedValueDisplay = eval(fd.getSelectedValueDisplay); // eslint-disable-line no-eval
                        return fd;
                    });

                    if (previousEventSourceId !== $ctrl.eventSourceId || previousEventId !== $ctrl.eventId) {
                        $ctrl.filterData.filters = $ctrl.filterData.filters.filter(f => filterDefintions.some(fd => fd.id === f.type));
                        previousEventSourceId = $ctrl.eventSourceId;
                        previousEventId = $ctrl.eventSourceId;
                    }
                }

                $ctrl.getFilterModeDisplay = function() {
                    return $ctrl.filterData.mode === "inclusive" ? "any filter passes" : "all filters pass";
                };

                $ctrl.getFilterType = function(typeId) {
                    return filterDefintions.find(fd => fd.id === typeId);
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

                $ctrl.removeFilterAtIndex = function(index) {
                    $ctrl.filterData.filters.splice(index, 1);
                };

                $ctrl.openAddOrEditFilterModal = function(index) {
                    utilityService.showModal({
                        component: "addOrEditFilterModal",
                        windowClass: "fb-medium-modal",
                        resolveObj: {
                            filter: () => $ctrl.filterData && $ctrl.filterData.filters[index],
                            availableFilters: () => filterDefintions,
                            index: () => index
                        },
                        closeCallback: resp => {
                            let action = resp.action;

                            switch (action) {
                            case "add":
                                $ctrl.filterData.filters.push(resp.filter);
                                break;
                            case "update":
                                $ctrl.filterData.filters[resp.index] = resp.filter;
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