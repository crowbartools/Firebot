"use strict";

(function() {
    angular.module("firebotApp")
        .component("quickActionSettingsModal", {
            template: `
            <div class="modal-header sticky-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Quick Action Settings</h4>
            </div>
            <div class="modal-body py-8 px-14">
                <firebot-item-table
                    style="overflow: initial; height: initial;"
                    items="$ctrl.quickActionsService.quickActions"
                    on-items-update="$ctrl.onItemsUpdate()"
                    headers="$ctrl.headers"
                    orderable="true"
                    add-new-button-text="Add new Quick Action"
                    on-add-new-clicked="$ctrl.quickActionsService.showAddOrEditCustomQuickActionModal()"
                    context-menu-options="$ctrl.createQuickActionMenuOptions(item)"
                    no-data-message="No Quick Actions have been saved. You should make one! :)"
                    none-found-message="No Quick Actions found."
                    hide-search="true"
                    test-button="true"
                    on-test-button-clicked="$ctrl.quickActionsService.triggerQuickAction(itemId)"
                />
            </div>
            <div class="modal-footer sticky-footer">
                <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Close</button>
            </div>
            `,
            bindings: {
                close: "&",
                dismiss: "&"
            },
            controller: function(quickActionsService) {
                const $ctrl = this;

                $ctrl.quickActionsService = quickActionsService;

                $ctrl.headers = [
                    {
                        headerStyles: {
                            'width': '50px'
                        },
                        cellTemplate: `
                            <div style="width: 30px; height: 30px; border-radius: 5px; background-color: #00000033; display: flex; align-items: center; justify-content: center;">
                                <i class="{{data.icon && data.icon.length ? data.icon : 'far fa-magic'}}" style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.50));" />
                            </div>
                        `,
                        cellController: () => { }
                    },
                    {
                        dataField: "name",
                        headerStyles: {
                            'width': '400px'
                        },
                        cellTemplate: `{{data.name}}`,
                        cellController: () => {}
                    },
                    {
                        cellTemplate: `<status-indicator status="getStatus(data)" enabled-label="Enabled" disabled-label="Disabled" />`,
                        cellController: ($scope) => {
                            $scope.getStatus = (action) => {
                                return quickActionsService.settings[action.id].enabled;
                            };
                        }
                    }
                ];

                $ctrl.sortQuickActions = (qa) => {
                    return quickActionsService.settings[qa.id].position;
                };

                $ctrl.onItemsUpdate = () => {
                    quickActionsService.quickActions.forEach((qa, index) => {
                        quickActionsService.settings[qa.id].position = index;
                    });

                    quickActionsService.saveQuickActionSettings();
                };

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {
                        quickActionsService.quickActions.forEach((qa, index) => {
                            quickActionsService.settings[qa.id].position = index;
                        });

                        quickActionsService.saveQuickActionSettings();
                    }
                };

                $ctrl.createQuickActionMenuOptions = (action) => {
                    const isEnabled = quickActionsService.settings[action.id].enabled;
                    const quickActionMenuOptions = [
                        {
                            html: `<a href ><i class="fal fa-toggle-off mr-4"></i> ${isEnabled ? "Disable" : "Enable"} Quick Action</a>`,
                            click: () => {
                                quickActionsService.settings[action.id].enabled = !quickActionsService.settings[action.id].enabled;
                                quickActionsService.saveQuickActionSettings();
                            }
                        }
                    ];

                    if (action.type === "custom") {
                        quickActionMenuOptions.push(
                            {
                                html: `<a href ><i class="far fa-edit mr-4"></i> Edit Quick Action</a>`,
                                click: () => {
                                    $ctrl.quickActionsService.showAddOrEditCustomQuickActionModal(action);
                                }
                            },
                            {
                                html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt mr-4"></i> Delete</a>`,
                                click: () => {
                                    $ctrl.quickActionsService.deleteCustomQuickAction(action.id);
                                }
                            }
                        );
                    }

                    return quickActionMenuOptions;
                };
            }
        });
}());