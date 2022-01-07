"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotItemTable", {
            bindings: {
                items: "<",
                onItemsUpdate: "&",
                headers: "<",
                sortTagContext: "@?",
                orderable: "<",
                addNewButtonDisabled: "<?",
                addNewButtonText: "@",
                onAddNewClicked: "&",
                contextMenuOptions: "&",
                noDataMessage: "@",
                noneFoundMessage: "@",
                searchPlaceholder: "@",
                testButton: "<?",
                onTestButtonClicked: "&",
                filterName: "@?",
                statusField: "@?"
            },
            transclude: {
                footer: "?fbItemTableFooter",
                toolbar: "?fbItemTableToolbar"
            },
            templateUrl: "./directives/misc/firebot-item-table/firebot-item-table.html",
            controller: function($scope, sortTagsService) {
                const $ctrl = this;

                $scope.sts = sortTagsService;

                $ctrl.$onInit = () => {
                    if ($ctrl.items == null) {
                        $ctrl.items = [];
                    }

                    if ($ctrl.filterName == null) {
                        $ctrl.filterName = "filter";
                    }

                    $ctrl.showStatusIndicator = $ctrl.statusField != null;
                    $ctrl.headerClass = `${$ctrl.sortTagContext.split(' ').join('-')}-header`;
                };

                $ctrl.triggerItemsUpdate = () => {
                    $ctrl.onItemsUpdate({ items: $ctrl.items });
                };

                $ctrl.getStatus = (item) => {
                    if (item == null || $ctrl.statusField == null) {
                        return false;
                    }
                    let status = item;
                    const nodes = $ctrl.statusField.split(".");
                    for (const node of nodes) {
                        status = status[node];
                    }
                    return status;
                };

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    'ui-preserve-size': true,
                    stop: () => {
                        if (sortTagsService.getSelectedSortTag($ctrl.sortTagContext) != null &&
                            ($scope.searchQuery == null ||
                                $scope.searchQuery.length < 1)) {
                            return;
                        }

                        $ctrl.triggerItemsUpdate();
                    }
                };

                $ctrl.getContextMenu = (item) => {
                    return $ctrl.contextMenuOptions({ item: item }) || [];
                };

            }
        });
}());
