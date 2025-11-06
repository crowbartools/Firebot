"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("quickActions", {
            template: `
                <div class="quick-actions flex flex-col items-center text-2xl pb-4">
                    <div ng-repeat="action in $ctrl.quickActionsService.quickActions | orderBy: $ctrl.sortQuickActions track by $index" class="mt-4 draggableAction" ng-show="$ctrl.quickActionsService.settings[action.id].enabled">
                        <button
                            ng-if="action.type === 'system'"
                            class="quick-action-btn p-0"
                            ng-click="$ctrl.quickActionsService.triggerQuickAction(action.id)"
                            uib-tooltip="{{action.name}}"
                            append-tooltip-to-body="true"
                            tooltip-placement="right"
                            aria-label="{{action.name}}"
                        >
                            <i class="{{action.icon}}" ng-if="action.icon"></i>
                        </button>

                        <button
                            ng-if="action.type === 'custom'"
                            class="quick-action-btn p-0"
                            ng-click="$ctrl.quickActionsService.triggerQuickAction(action.id)"
                            uib-tooltip="{{action.name}}"
                            append-tooltip-to-body="true"
                            tooltip-placement="right"
                            aria-label="{{action.name}}"
                            context-menu="$ctrl.customQuickActionsContextMenu(action)"
                            context-menu-orientation="right"
                        >
                            <i class="{{action.icon}}" ng-if="action.icon"></i>
                        </button>
                    </div>
                </div>
                <hr class="my-4 flex flex-col items-center">
                <div class="quick-action-settings flex flex-col items-center mb-4">
                    <button
                        class="quick-action-btn p-0"
                        uib-tooltip="Edit Quick Actions"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="$ctrl.quickActionsService.openQuickActionSettingsModal()"
                        aria-label="Edit Quick Actions"
                    >
                        <i class="fas fa-pencil"></i>
                    </button>
                </div>
            `,
            controller: function(quickActionsService) {
                const $ctrl = this;

                $ctrl.quickActionsService = quickActionsService;

                $ctrl.sortQuickActions = (qa) => {
                    return quickActionsService.settings[qa.id].position;
                };

                $ctrl.customQuickActionsContextMenu = (customQuickAction) => {
                    const options = [
                        {
                            html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                            click: () => {
                                quickActionsService.showAddOrEditCustomQuickActionModal(customQuickAction);
                            }
                        },
                        {
                            html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                            click: () => {
                                quickActionsService.deleteCustomQuickAction(customQuickAction.id);
                            },
                            compile: true
                        }
                    ];

                    return options;
                };
            }
        });
}());