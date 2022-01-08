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
