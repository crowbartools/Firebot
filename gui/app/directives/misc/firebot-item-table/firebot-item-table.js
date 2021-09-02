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
                statusField: "@?",
                groups: "<?",
                itemPluralLabel: "@?",
                itemSingularLabel: "@?"
            },
            transclude: {
                footer: "?fbItemTableFooter",
                toolbar: "?fbItemTableToolbar"
            },
            templateUrl: "./directives/misc/firebot-item-table/firebot-item-table.html",
            controller: function($scope, sortTagsService, itemGroupService) {
                const $ctrl = this;

                $scope.sts = sortTagsService;
                $scope.igs = itemGroupService;

                $ctrl.$onInit = () => {
                    if ($ctrl.items == null) {
                        $ctrl.items = [];
                    }

                    if ($ctrl.filterName == null) {
                        $ctrl.filterName = "filter";
                    }

                    $ctrl.showStatusIndicator = $ctrl.statusField != null;
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

                $ctrl.toggleSortTag = (item, tagId) => {
                    if (item == null) return;
                    if (item.sortTags == null) {
                        item.sortTags = [];
                    }
                    if (item.sortTags.includes(tagId)) {
                        item.sortTags = item.sortTags.filter(id => id !== tagId);
                    } else {
                        item.sortTags.push(tagId);
                    }
                    $ctrl.triggerItemsUpdate();
                };

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    'ui-preserve-size': true,
                    stop: () => {
                        if (sortTagsService.getSelectedSortTag($ctrl.sortTagContext) != null &&
                            ($scope.searchQuery == null ||
                                $scope.searchQuery.length < 1)) return;
                        $ctrl.triggerItemsUpdate();
                    }
                };

                $ctrl.getContextMenu = (item) => {
                    const menuItems = $ctrl.contextMenuOptions({ item: item }) || [];

                    if ($ctrl.sortTagContext != null) {
                        const sortTags = sortTagsService.getSortTags($ctrl.sortTagContext);

                        if (sortTags.length > 0) {
                            menuItems.push({
                                text: "Sort tags...",
                                children: sortTags.map(st => {
                                    const isSelected = item.sortTags && item.sortTags.includes(st.id);
                                    return {
                                        html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${st.name}</a>`,
                                        click: () => {
                                            $ctrl.toggleSortTag(item, st.id);
                                        }
                                    };
                                }),
                                hasTopDivider: true
                            });
                        }
                    }

                    return menuItems;
                };

            }
        });
}());
