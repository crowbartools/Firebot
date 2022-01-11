"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("quickActions", {
            template: `
                <div class="quick-actions-column">
                    <div ng-repeat="action in $ctrl.quickActions">
                        <button
                            ng-if="action.type === 'system' && $ctrl.settings[action.id].enabled"
                            class="quick-action-btn mt-4"
                            ng-click="action.click()"
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
                            ng-click="action.click()"
                            uib-tooltip="{{action.name}}"
                            append-tooltip-to-body="true"
                            tooltip-placement="right"
                            aria-label="{{action.name}}"
                            context-menu="$ctrl.customQuickActionsContextMenu(action)"
                            context-menu-orientation="right"
                        >
                            <span ng-if="action.label">{{action.label}}</span>
                        </button>
                    </div>

                    <hr class="my-5">

                    <button
                        class="quick-action-btn"
                        uib-tooltip="Quick Action Settings"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="$ctrl.openQuickActionSettingsModal()"
                        aria-label="Quick Action Settings"
                    >
                        <i class="fas fa-cog"></i>
                    </button>

                    <button
                        class="quick-action-btn mt-4"
                        uib-tooltip="Add Custom Quick Action"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="customQuickActionsService.showAddOrEditCustomQuickActionModal()"
                        aria-label="Add Custom Quick Action"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `,
            controller: function($scope, utilityService, backendCommunicator, settingsService, customQuickActionsService, presetEffectListsService) {
                const $ctrl = this;

                $ctrl.settings = settingsService.getQuickActionSettings();
                $scope.customQuickActionsService = customQuickActionsService;
                $scope.presetEffectListsService = presetEffectListsService;

                $ctrl.quickActions = [];

                $ctrl.systemQuickActions = [
                    {
                        id: "streamInfo",
                        name: "Edit Stream Info",
                        type: "system",
                        icon: "far fa-pencil",
                        click: () => {
                            $ctrl.showEditStreamInfoModal();
                        }
                    },
                    {
                        id: "giveCurrency",
                        name: "Give Currency",
                        type: "system",
                        icon: "far fa-coin",
                        click: () => {
                            $ctrl.showGiveCurrencyModal();
                        }
                    },
                    {
                        id: "streamPreview",
                        name: "Open Stream Preview",
                        type: "system",
                        icon: "far fa-tv-alt",
                        click: () => {
                            $ctrl.popoutStreamPreview();
                        }
                    }
                ];

                $ctrl.buildQuickActions = () => {
                    $ctrl.quickActions = [
                        ...$ctrl.systemQuickActions,
                        ...customQuickActionsService.customQuickActions
                    ].sort((a, b) => {
                        return $ctrl.settings[a.id].position - $ctrl.settings[b.id].position;
                    });
                };

                $scope.$watchCollection("customQuickActionsService.customQuickActions", () => {
                    $ctrl.buildQuickActions();
                });

                $ctrl.$onInit = async () => {
                    if ($ctrl.settings == null) {
                        $ctrl.settings = {
                            streamInfo: {
                                enabled: true,
                                position: 1
                            },
                            giveCurrency: {
                                enabled: true,
                                position: 2
                            },
                            streamPreview: {
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
                                customQuickActionsService.showAddOrEditCustomQuickActionModal(customQuickAction);
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
                                            customQuickActionsService.deleteCustomQuickAction(customQuickAction.id);

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

                $ctrl.showEditStreamInfoModal = () => {
                    utilityService.showModal({
                        component: "editStreamInfoModal",
                        size: "md"
                    });
                };

                $ctrl.showGiveCurrencyModal = () => {
                    utilityService.showModal({
                        component: "giveCurrencyModal",
                        size: "md"
                    });
                };

                $ctrl.popoutStreamPreview = () => {
                    backendCommunicator.send("show-twitch-preview");
                };
            }
        });
}());