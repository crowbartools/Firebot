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
                pageSize: "<",
                // optional server side fetches, callback should resolve to "{ items, total, totalUnfiltered }"
                onFetchPage: "&?",
                reloadToken: "<"
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
                  <tr ng-repeat="data in $ctrl.visibleRows track by $ctrl.getTrackBy(data, $index)" class="viewer-row" ng-class="{selectable: $ctrl.clickable}"
                      ng-click="$ctrl.clickable && $ctrl.onRowClick({ data: data })">
                      <td ng-repeat="header in $ctrl.headers track by $index" ng-style="header.cellStyles">
                        <sortable-table-cell data="data" header="header" cell-index="$index"></sortable-table-cell>
                      </td>
                  </tr>
              </tbody>
            </table>
            <div ng-show="$ctrl.loading" class="fb-table-row">
                <span class="muted">Loading...</span>
            </div>
            <div ng-show="!$ctrl.loading && $ctrl.totalCount < 1" class="fb-table-row">
                <span class="muted">{{$ctrl.noDataMessage ? $ctrl.noDataMessage : "No data available yet"}}</span>
            </div>
            <div style="display: grid;grid-template-columns: 1fr max-content 1fr;">
              <div></div>
              <div>
                  <div ng-show="$ctrl.filteredCount > $ctrl.pagination.pageSize" style="text-align: center;">
                      <ul uib-pagination total-items="$ctrl.filteredCount" ng-model="$ctrl.pagination.currentPage" items-per-page="$ctrl.pagination.pageSize" class="pagination-sm" max-size="3" boundary-link-numbers="true" rotate="true" style="margin-top:10px;"></ul>
                  </div>
              </div>
              <div>
                  <div ng-hide="$ctrl.totalCount < 1" class="muted" style="margin-top: 10px;font-size: 11px;text-align: right;">
                      <span>Showing <strong>{{$ctrl.getRangeMin()}}</strong> - <strong>{{$ctrl.getRangeMax($ctrl.filteredCount)}}</strong> of <strong>{{$ctrl.totalCount}}</strong> total</span>
                  </div>
              </div>
            </div>
          </div>
          `,
            controller: function($scope, $filter, $q, $attrs) {
                const $ctrl = this;

                $ctrl.serverMode = "onFetchPage" in $attrs;

                $ctrl.visibleRows = [];
                $ctrl.filteredCount = 0;
                $ctrl.totalCount = 0;
                $ctrl.loading = false;

                $ctrl.pagination = {
                    currentPage: 1,
                    pageSize: 10
                };

                $ctrl.order = {
                    field: '0',
                    reverse: false
                };

                let fetchSeq = 0;
                let initialized = false;

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

                    initialized = true;

                    // Reset to the first page whenever the search query or sort changes.
                    $scope.$watchGroup(['$ctrl.query', '$ctrl.order.field', '$ctrl.order.reverse'], (newVals, oldVals) => {
                        if (newVals === oldVals) {
                            return;
                        }
                        $ctrl.pagination.currentPage = 1;
                    });

                    $scope.$watchGroup(
                        ['$ctrl.query', '$ctrl.order.field', '$ctrl.order.reverse', '$ctrl.pagination.currentPage', '$ctrl.pagination.pageSize'],
                        () => $ctrl.recompute()
                    );

                    if (!$ctrl.serverMode) {
                        $scope.$watchCollection('$ctrl.tableDataSet', () => $ctrl.recompute());
                    }
                };

                $ctrl.$onChanges = (changes) => {
                    if ($ctrl.serverMode && initialized && changes.reloadToken && !changes.reloadToken.isFirstChange()) {
                        $ctrl.recompute();
                    }
                };

                $ctrl.recompute = () => {
                    if ($ctrl.serverMode) {
                        $ctrl.fetchServerPage();
                        return;
                    }

                    let filtered = $filter('filter')($ctrl.tableDataSet || [], $ctrl.query);
                    filtered = $filter('orderBy')(filtered, $ctrl.dynamicOrder, $ctrl.order.reverse);

                    $ctrl.filteredCount = filtered.length;
                    $ctrl.totalCount = ($ctrl.tableDataSet || []).length;

                    const start = ($ctrl.pagination.currentPage - 1) * $ctrl.pagination.pageSize;
                    $ctrl.visibleRows = filtered.slice(start, start + $ctrl.pagination.pageSize);
                };

                $ctrl.fetchServerPage = () => {
                    const seq = ++fetchSeq;
                    $ctrl.loading = true;

                    $q.when($ctrl.onFetchPage({
                        params: {
                            page: $ctrl.pagination.currentPage,
                            pageSize: $ctrl.pagination.pageSize,
                            sortField: $ctrl.order.field,
                            sortReversed: $ctrl.order.reverse,
                            search: $ctrl.query
                        }
                    })).then((result) => {
                        if (seq !== fetchSeq) {
                            return;
                        }
                        result = result || {};
                        $ctrl.visibleRows = result.items || [];
                        $ctrl.filteredCount = result.total != null ? result.total : 0;
                        $ctrl.totalCount = result.totalUnfiltered != null ? result.totalUnfiltered : $ctrl.filteredCount;
                        $ctrl.loading = false;
                    }).catch(() => {
                        if (seq !== fetchSeq) {
                            return;
                        }
                        $ctrl.loading = false;
                    });
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
