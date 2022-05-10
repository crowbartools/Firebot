"use strict";

(function() {
    angular.module("firebotApp")
        .component("sortableTable", {
            bindings: {
                tableDataSet: "<",
                headers: "<",
                query: "<",
                clickable: "<",
                onRowClick: "&",
                trackByField: "@",
                startingSortField: "@",
                sortInitiallyReversed: "<",
                noDataMessage: "@",
                pageSize: "<"
            },
            template: `
          <div>
            <table class="fb-table-alt" style="width:100%;">
              <thead>
                <tr style="font-size: 11px;">
                  <th ng-repeat="header in $ctrl.headers track by $index" ng-click="header.sortable && $ctrl.setOrderField(header.dataField)" ng-class="{'selected': $ctrl.isOrderField(header.dataField)}" ng-style="header.headerStyles">
                    <div style="display:flex;">
                        <span style="display:inline-block;"><i ng-show="header.icon" class="fas" ng-class="header.icon"></i></span>
                        <span ng-show="header.name" style="margin: 0 5px;display:inline-block;">{{header.name}}</span>
                        <span ng-if="header.sortable" style="display:inline-block; width: 11px;">
                            <i ng-show="$ctrl.isOrderField(header.dataField)" class="fal" ng-class="{'fa-arrow-to-bottom': !$ctrl.order.reverse,'fa-arrow-to-top': $ctrl.order.reverse}"></i>
                        </span>
                    </div>     
                  </th>
                </tr>
              </thead>
              <tbody>
                  <tr ng-repeat="data in filtered = ($ctrl.tableDataSet | filter:$ctrl.query | orderBy:$ctrl.dynamicOrder:$ctrl.order.reverse) | startFrom:($ctrl.pagination.currentPage-1)*$ctrl.pagination.pageSize | limitTo:$ctrl.pagination.pageSize as visible track by $ctrl.getTrackBy(data, $index)" class="viewer-row" ng-class="{selectable: $ctrl.clickable}" 
                      ng-click="$ctrl.clickable && $ctrl.onRowClick({ data: data })">
                      <td ng-repeat="header in $ctrl.headers track by $index" ng-style="header.cellStyles">
                        <sortable-table-cell data="data" header="header" cell-index="$index"></sortable-table-cell>
                      </td>
                  </tr>
              </tbody>
            </table>
            <div ng-show="$ctrl.tableDataSet.length < 1" class="fb-table-row">
                <span class="muted">{{$ctrl.noDataMessage ? $ctrl.noDataMessage : "No data available yet"}}</span>
            </div>
            <div style="display: grid;grid-template-columns: 1fr max-content 1fr;">
              <div></div>
              <div>
                  <div ng-show="filtered.length > $ctrl.pagination.pageSize" style="text-align: center;">
                      <ul uib-pagination total-items="filtered.length" ng-model="$ctrl.pagination.currentPage" items-per-page="$ctrl.pagination.pageSize" class="pagination-sm" max-size="3" boundary-link-numbers="true" rotate="true" style="margin-top:10px;"></ul>
                  </div>
              </div>
              <div>
                  <div ng-hide="$ctrl.tableDataSet.length < 1" class="muted" style="margin-top: 10px;font-size: 11px;text-align: right;">
                      <span>Showing <strong>{{$ctrl.getRangeMin()}}</strong> - <strong>{{$ctrl.getRangeMax(filtered.length)}}</strong> of <strong>{{$ctrl.tableDataSet.length}}</strong> total</span>
                  </div>
              </div>
            </div>
          </div>
          `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.tableDataSet == null) {
                        $ctrl.tableDataSet = [];
                    }

                    $ctrl.order.field = $ctrl.startingSortField || '0';

                    if ($ctrl.sortInitiallyReversed !== undefined && $ctrl.sortInitiallyReversed !== null) {
                        $ctrl.order.reverse = $ctrl.sortInitiallyReversed;
                    }

                    if ($ctrl.pageSize !== undefined && $ctrl.pageSize !== null) {
                        $ctrl.pagination.pageSize = $ctrl.pageSize;
                    }
                };

                $ctrl.pagination = {
                    currentPage: 1,
                    pageSize: 10
                };

                $ctrl.getTrackBy = (data, index) => {
                    if ($ctrl.trackByField) {
                        return data[$ctrl.trackByField];
                    }
                    return index;
                };

                $ctrl.getRangeMin = function() {
                    return 1 + $ctrl.pagination.pageSize * ($ctrl.pagination.currentPage - 1);
                };

                $ctrl.getRangeMax = function(filteredLength) {
                    const max = $ctrl.pagination.pageSize * $ctrl.pagination.currentPage;
                    return max <= filteredLength ? max : filteredLength;
                };

                $ctrl.order = {
                    field: '0',
                    reverse: false
                };

                $ctrl.isOrderField = function(field) {
                    return field === $ctrl.order.field;
                };

                $ctrl.setOrderField = function(field) {
                    if ($ctrl.order.field !== field) {
                        $ctrl.order.reverse = false;
                        $ctrl.order.field = field;
                    } else {
                        $ctrl.order.reverse = !$ctrl.order.reverse;
                    }
                };

                $ctrl.dynamicOrder = function(data) {
                    const field = $ctrl.order.field;

                    if (field.includes(".")) {
                        const nodes = field.split(".");
                        let currentData = data;
                        for (const node of nodes) {
                            currentData = currentData[node];
                        }
                        return currentData;
                    }
                    return data[$ctrl.order.field];
                };
            }
        });
}());
