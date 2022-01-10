"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("quickActions", {
            template: `
                <div class="quick-actions-column" ng-if="$ctrl.quickActions.length > 0">
                    <button
                        ng-repeat="action in $ctrl.quickActions"
                        ng-if="action.enabled"
                        class="quick-action-btn mt-4"
                        ng-click="action.controller()"
                        uib-tooltip="{{action.name}}"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        aria-label="{{action.name}}"
                    >
                        <i class="{{action.icon}}" ng-if="action.icon"></i>
                        <span ng-if="action.label">{{action.label}}</span>
                    </button>

                    <hr class="my-5">

                    <button
                        class="quick-action-btn"
                        uib-tooltip="Edit Quick Actions"
                        append-tooltip-to-body="true"
                        tooltip-placement="right"
                        ng-click="$ctrl.openQuickActionsEditorModal()"
                        aria-label="Edit Quick Actions"
                    >
                    <i class="fas fa-cog"></i>
                </button>
                </div>
            `,
            controller: function(utilityService, backendCommunicator, settingsService) {
                const $ctrl = this;

                $ctrl.quickActions = [];

                $ctrl.$onInit = () => {
                    $ctrl.settings = settingsService.getQuickActions();

                    if ($ctrl.settings == null) {
                        $ctrl.settings = {
                            streamInfo: true,
                            giveCurrency: true,
                            streamPreview: true
                        };
                    }

                    $ctrl.buildQuickActions();
                };

                $ctrl.buildQuickActions = () => {
                    $ctrl.quickActions = [
                        {
                            id: "streamInfo",
                            name: "Edit Stream Info",
                            enabled: $ctrl.settings.streamInfo,
                            icon: "far fa-pencil",
                            controller: () => {
                                $ctrl.showEditStreamInfoModal();
                            }
                        },
                        {
                            id: "giveCurrency",
                            name: "Give Currency",
                            enabled: $ctrl.settings.giveCurrency,
                            icon: "far fa-coin",
                            controller: () => {
                                $ctrl.showGiveCurrencyModal();
                            }
                        },
                        {
                            id: "streamPreview",
                            name: "Open Stream Preview",
                            enabled: $ctrl.settings.streamPreview,
                            icon: "far fa-tv-alt",
                            controller: () => {
                                $ctrl.popoutStreamPreview();
                            }
                        }
                    ];
                };

                $ctrl.openQuickActionsEditorModal = () => {
                    utilityService.showModal({
                        component: "quickActionsEditorModal",
                        size: "sm",
                        resolveObj: {
                            quickActions: () => $ctrl.quickActions
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