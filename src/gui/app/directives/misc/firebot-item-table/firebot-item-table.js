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
                searchField: "@?",
                testButton: "<?",
                onTestButtonClicked: "&",
                statusField: "@?",
                startingSortField: "@?",
                sortInitiallyReversed: "<?",
                customFilterName: "@?",
                useFullTextSearch: "<?"
            },
            transclude: {
                footer: "?fbItemTableFooter",
                toolbar: "?fbItemTableToolbar"
            },
            templateUrl: "./directives/misc/firebot-item-table/firebot-item-table.html",
            controller: function($scope, sortTagsService, effectQueuesService) {
                const $ctrl = this;

                $scope.sts = sortTagsService;

                $ctrl.order = {
                    field: null,
                    reverse: false
                };

                $ctrl.getFilterName = () => {
                    return $ctrl.useFullTextSearch ? null : $ctrl.customFilterName;
                };

                $ctrl.showAdvancedOptionsButton = false;

                $ctrl.hasAdvancedOptionsApplied = () => {
                    return $ctrl.useFullTextSearch;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.items == null) {
                        $ctrl.items = [];
                    }

                    $ctrl.order.field = $ctrl.startingSortField ?? null;
                    $ctrl.order.reverse = !!$ctrl.sortInitiallyReversed;

                    $ctrl.showStatusIndicator = $ctrl.statusField != null;
                    $ctrl.headerClass = `${$ctrl.sortTagContext.split(' ').join('-')}-header`;

                    $ctrl.showAdvancedOptionsButton = $ctrl.customFilterName != null;
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
                    stop: (_e, ui) => {
                        //reset the width of the children that "ui-preserve-size" sets
                        const item = angular.element(ui.item);
                        item.children().each(function() {
                            const $el = angular.element(this);
                            $el.css("width", "");
                        });

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
                    const menuItems = [...($ctrl.contextMenuOptions({ item: item }) || [])];

                    const queues = effectQueuesService.getEffectQueues();
                    if (item.effects != null && queues != null && queues.length > 0) {
                        const children = queues.map((q) => {
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

                $ctrl.isOrderField = function(field) {
                    return field === $ctrl.order.field;
                };

                $ctrl.setOrderField = function(field) {
                    if ($ctrl.order.field !== field) {
                        $ctrl.order.reverse = false;
                        $ctrl.order.field = field;
                    } else if (!$ctrl.order.reverse) {
                        $ctrl.order.reverse = true;
                    } else {
                        $ctrl.order.field = null;
                        $ctrl.order.reverse = false;
                    }
                };

                $ctrl.dynamicOrder = function(data) {
                    const field = $ctrl.order.field;

                    if (field == null) {
                        return null;
                    }

                    if (field === '%sorttags%') {
                        return sortTagsService
                            .getSortTagsForItem($ctrl.sortTagContext, data.sortTags)
                            .map(st => st.name)
                            .join(", ");
                    }

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
