"use strict";

// Modal for adding or editting a filter

(function() {
    angular.module("firebotApp").component("addOrEditFilterModal", {
        template:
        `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewFilter ? 'Create New Filter' : 'Edit Filter'}}</h4>
            </div>
            <div class="modal-body">

                <div style="display: flex;flex-wrap: wrap;">
                    <div class="btn-group" style="margin-right: 5px;margin-bottom:5px;" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{$ctrl.getFilterName($ctrl.selectedFilter.type)}}<span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-repeat="filter in $ctrl.availableFilters" ng-click="$ctrl.selectFilter(filter.id)">
                                <a href>{{filter.name}} <tooltip text="filter.description"></tooltip></a>
                            </li>
                        </ul>
                    </div>

                    <div class="btn-group" style="margin-right: 5px;margin-bottom:5px;" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{$ctrl.selectedFilter.comparisonType}} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-repeat="comparisonType in $ctrl.currentFilterDef.comparisonTypes" ng-click="$ctrl.selectedFilter.comparisonType = comparisonType">
                                <a href>{{comparisonType}}</a>
                            </li>
                        </ul>
                    </div>

                    <div ng-switch="$ctrl.currentFilterDef.valueType" style="flex: 1 1 0;">
                        <div ng-switch-when="preset">

                            <div class="btn-group" style="margin-right: 5px;margin-bottom:5px;" uib-dropdown>
                                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                                    {{$ctrl.getSelectedPresetValueDisplay()}} <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                                    <li role="menuitem" ng-repeat="preset in $ctrl.presetValues" ng-click="$ctrl.selectedFilter.value = preset.value">
                                        <a href>{{preset.display}}</a>
                                    </li>
                                </ul>
                            </div>

                        </div>
                        <div ng-switch-default>
                            <input type="{{$ctrl.currentFilterDef.valueType}}" class="form-control" style="min-width: 100px;" ng-model="$ctrl.selectedFilter.value" placeholder="Value">
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger pull-left" ng-click="$ctrl.delete()" ng-hide="$ctrl.isNewFilter">Delete</button>
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
        controller: function($injector) {
            const $ctrl = this;

            $ctrl.availableFilters = [];

            $ctrl.currentFilterDef = {};

            $ctrl.selectedFilter = {};

            $ctrl.presetValues = [];
            async function loadPresetValues() {
                if ($ctrl.currentFilterDef && $ctrl.currentFilterDef.valueType === "preset") {
                    const presetValues = await $injector.invoke($ctrl.currentFilterDef.getPresetValues, {}, {});
                    if (presetValues != null && Array.isArray(presetValues)) {
                        $ctrl.presetValues = presetValues;
                    }
                }
            }

            $ctrl.getSelectedPresetValueDisplay = function() {
                if ($ctrl.presetValues.length > 0 && $ctrl.selectedFilter && $ctrl.selectedFilter.value) {

                    const presetValue = $ctrl.presetValues.find(pv => pv.value === $ctrl.selectedFilter.value);

                    if (presetValue) {
                        return presetValue.display;
                    }
                }
                return "Select one";
            };


            $ctrl.selectFilter = function(filterId) {
                $ctrl.selectedFilter.type = filterId;
                $ctrl.selectedFilter.value = null;

                $ctrl.currentFilterDef = $ctrl.availableFilters.find(f => f.id === filterId);
                if ($ctrl.currentFilterDef) {
                    $ctrl.selectedFilter.comparisonType = $ctrl.currentFilterDef.comparisonTypes[0];
                    loadPresetValues();
                }
            };

            $ctrl.getFilterName = function(filterId) {
                const filterDef = $ctrl.availableFilters.find(f => f.id === filterId);
                return filterDef ? filterDef.name : filterId;
            };

            $ctrl.$onInit = function() {

                if ($ctrl.resolve.availableFilters) {
                    $ctrl.availableFilters = $ctrl.resolve.availableFilters;
                }
                if ($ctrl.resolve.filter == null) {

                    $ctrl.isNewFilter = true;

                    if ($ctrl.availableFilters.length > 0) {
                        const firstFilterDef = $ctrl.availableFilters[0];
                        $ctrl.selectedFilter.type = firstFilterDef.id;
                        $ctrl.selectedFilter.comparisonType = firstFilterDef.comparisonTypes[0];
                        $ctrl.currentFilterDef = firstFilterDef;
                        loadPresetValues();
                    }

                } else {
                    $ctrl.selectedFilter = JSON.parse(JSON.stringify($ctrl.resolve.filter));
                    $ctrl.currentFilterDef = $ctrl.availableFilters.find(f => f.id === $ctrl.selectedFilter.type);
                    loadPresetValues();
                }
            };

            $ctrl.delete = function() {
                if ($ctrl.filter) {
                    return;
                }

                $ctrl.close({
                    $value: { filter: $ctrl.selectedFilter, index: $ctrl.resolve.index, action: "delete" }
                });
            };

            $ctrl.save = function() {
                $ctrl.close({
                    $value: {
                        filter: $ctrl.selectedFilter,
                        index: $ctrl.resolve.index,
                        action: $ctrl.isNewFilter ? "add" : "update"
                    }
                });
            };
        }
    });
}());
