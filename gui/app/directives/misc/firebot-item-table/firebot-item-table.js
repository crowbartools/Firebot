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
            controller: function($scope, sortTagsService, effectQueuesService) {
                const $ctrl = this;

                $scope.sts = sortTagsService;

                $ctrl.selectedItemIds = [];

                $ctrl.allItemsSelected = false;

                function updateAllItemsSelected() {
                    $ctrl.allItemsSelected = $ctrl.selectedItemIds.length === $ctrl.items.length;
                }

                $ctrl.unselectAll = () => {
                    $ctrl.selectedItemIds = [];
                    $ctrl.allItemsSelected = false;
                };

                $ctrl.toggleSelectAll = () => {
                    if ($ctrl.allItemsSelected) {
                        $ctrl.selectedItemIds = [];
                    } else {
                        $ctrl.selectedItemIds = $ctrl.items.map(i => i.id);
                    }
                    updateAllItemsSelected();
                };

                $ctrl.toggleSelectItem = (itemId) => {
                    if ($ctrl.selectedItemIds.includes(itemId)) {
                        $ctrl.selectedItemIds = $ctrl.selectedItemIds.filter(id => id !== itemId);
                    } else {
                        $ctrl.selectedItemIds.push(itemId);
                    }
                    updateAllItemsSelected();
                };

                $ctrl.selectItemFromClick = (itemId, event) => {
                    if (!event.metaKey && !event.ctrlKey) {
                        return;
                    }
                    $ctrl.toggleSelectItem(itemId);
                };

                $ctrl.itemIsSelected = (itemId) => {
                    return $ctrl.selectedItemIds.includes(itemId);
                };

                function getSelectedItems() {
                    return $ctrl.selectedItemIds
                        .map(id => $ctrl.items.find(i => i.id === id))
                        .filter(i => !!i);
                }

                $ctrl.getBulkActions = () => {
                    const actions = [];

                    if ($ctrl.statusField) {
                        actions.push({
                            label: "Toggle active",
                            icon: "",
                            onClick: () => {
                                const selectedItems = getSelectedItems();
                                const allItemsInactive = selectedItems.every(i => !$ctrl.getStatus(i));
                                selectedItems.forEach(i => $ctrl.setStatus(i, allItemsInactive ? true : false));
                                $ctrl.triggerItemsUpdate();
                            }
                        });
                    }
                };

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

                $ctrl.setStatus = (item, status) => {
                    if (item == null || $ctrl.statusField == null) {
                        return;
                    }
                    const nodes = $ctrl.statusField.split(".");
                    const lastIndex = nodes.length - 1;
                    let itemCursor = item;
                    for (let i = 0; i < nodes.length; i++) {
                        const property = nodes[i];
                        if (i !== lastIndex) {
                            itemCursor = itemCursor[property];
                        } else {
                            itemCursor[property] = status;
                        }
                    }
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

                $ctrl.addToEffectQueue = (item, queueId) => {
                    if (item == null) {
                        return;
                    }

                    if (item.effects) {
                        item.effects.queue = queueId;
                    }

                    $ctrl.triggerItemsUpdate();
                };

                $ctrl.clearEffectQueue = (item) => {
                    item.effects.queue = null;
                };

                $ctrl.getContextMenu = (item) => {
                    const menuItems = $ctrl.contextMenuOptions({ item: item }) || [];

                    const queues = effectQueuesService.getEffectQueues();
                    if (item.effects != null && queues != null && queues.length > 0) {
                        const children = queues.map(q => {
                            const isSelected = item.effects.queue && item.effects.queue === q.id;
                            return {
                                html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${q.name}</a>`,
                                click: () => {
                                    $ctrl.addToEffectQueue(item, q.id);
                                }
                            };
                        });

                        const hasEffectQueue = item.effects.queue != null && item.effects.queue !== "";
                        children.push({
                            html: `<a href><i class="${!hasEffectQueue ? 'fas fa-check' : ''}" style="margin-right: ${!hasEffectQueue ? '10' : '27'}px;"></i> None</a>`,
                            click: () => {
                                $ctrl.clearEffectQueue(item);
                            },
                            hasTopDivider: true
                        });

                        menuItems.push({
                            text: `Effect Queues...`,
                            children: children,
                            hasTopDivider: true
                        });
                    }

                    return menuItems;
                };
            }
        });
}());
