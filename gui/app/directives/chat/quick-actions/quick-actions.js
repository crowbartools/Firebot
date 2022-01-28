"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("quickActions", {
            template: `
                <div class="quick-actions-column">
                    <div ui-sortable="sortableOptions">
                        <div ng-repeat="action in $ctrl.quickActions track by $index">
                            <button
                                ng-if="action.type === 'system' && $ctrl.settings[action.id].enabled"
                                class="quick-action-btn mt-4"
                                ng-click="$ctrl.triggerQuickAction(action.id)"
                                uib-tooltip="{{action.name}}"
                                append-tooltip-to-body="true"
                                tooltip-placement="right"
                                aria-label="{{action.name}}"
                            >
                                <i class="{{action.icon}}" ng-if="action.icon"></i>
                            </button>

                            <button
                                ng-if="action.type === 'custom' && $ctrl.settings[action.id].enabled"
                                class="quick-action-btn mt-4"
                                ng-click="$ctrl.triggerQuickAction(action.id)"
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

                    <hr class="my-5">

                    <button
                        class="quick-action-btn"
                        uib-tooltip="Add Custom Quick Action"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="quickActionsService.showAddOrEditCustomQuickActionModal()"
                        aria-label="Add Custom Quick Action"
                    >
                        <i class="fas fa-plus"></i>
                    </button>

                    <button
                        class="quick-action-btn mt-4"
                        uib-tooltip="Quick Action Settings"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="$ctrl.openQuickActionSettingsModal()"
                        aria-label="Quick Action Settings"
                    >
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            `,
            controller: function($scope, utilityService, backendCommunicator, settingsService, quickActionsService, logger) {
                const $ctrl = this;

                $scope.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {}
                };

                $ctrl.settings = settingsService.getQuickActionSettings();
                $scope.quickActionsService = quickActionsService;
                $scope.logger = logger;

                $ctrl.quickActions = [];

                $ctrl.buildQuickActions = () => {
                    $ctrl.quickActions = quickActionsService.quickActions.sort((a, b) => {
                        return $ctrl.settings[a.id]?.position - $ctrl.settings[b.id]?.position;
                    });
                };

                $ctrl.setupListeners = () => {
                    backendCommunicator.on("trigger-quickaction:stream-info", () => {
                        utilityService.showModal({
                            component: "editStreamInfoModal",
                            size: "md"
                        });
                    });

                    backendCommunicator.on("trigger-quickaction:give-currency", () => {
                        utilityService.showModal({
                            component: "giveCurrencyModal",
                            size: "md"
                        });
                    });
                };

                $scope.$watchCollection("quickActionsService.quickActions", () => {
                    $ctrl.buildQuickActions();
                });

                $ctrl.triggerQuickAction = (quickActionId) => {
                    backendCommunicator.fireEvent("triggerQuickAction", quickActionId);
                };

                $ctrl.$onInit = async () => {
                    $ctrl.setupListeners();

                    if ($ctrl.settings == null) {
                        $ctrl.settings = {
                            "firebot:stream-info": {
                                enabled: true,
                                position: 1
                            },
                            "firebot:give-currency": {
                                enabled: true,
                                position: 2
                            },
                            "firebot:stream-preview": {
                                enabled: true,
                                position: 3
                            }
                        };
                    }
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
                                utilityService
                                    .showConfirmationModal({
                                        title: "Delete Custom Quick Action",
                                        question: `Are you sure you want to delete the Custom Quick Action "${customQuickAction.name}"?`,
                                        confirmLabel: "Delete",
                                        confirmBtnType: "btn-danger"
                                    })
                                    .then(confirmed => {
                                        if (confirmed) {
                                            quickActionsService.deleteCustomQuickAction(customQuickAction.id);

                                            delete $ctrl.settings[customQuickAction.id];
                                            settingsService.setQuickActionSettings($ctrl.settings);
                                        }
                                    });

                            },
                            compile: true
                        }
                    ];

                    return options;
                };

                $ctrl.openQuickActionSettingsModal = () => {
                    utilityService.showModal({
                        component: "quickActionSettingsModal",
                        size: "sm",
                        resolveObj: {
                            quickActions: () => $ctrl.quickActions,
                            settings: () => $ctrl.settings
                        },
                        dismissCallback: () => {
                            settingsService.setQuickActionSettings($ctrl.settings);
                        }
                    });
                };
            }
        });
}());