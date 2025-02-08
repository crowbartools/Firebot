"use strict";

(function() {
    angular.module("firebotApp")
        .component("editUserAllowlistModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit User Allowlist</h4>
            </div>
            <div class="modal-body">
                <p class="muted" style="margin-bottom:10px;">Users on this list will automatically be allowed to post URLs in chat.</p>
                <div style="margin: 0 0 25px;display: flex;flex-direction: row;">

                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle" type="button" id="add-options" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            <span class="dropdown-text"><i class="fas fa-plus-circle"></i> Add User(s)</span>
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="add-options">
                            <li role="menuitem" ng-click="$ctrl.addUser()"><a href style="padding-left: 10px;"><i class="fad fa-plus-circle" style="margin-right: 5px;"></i> Add single user</a></li>
                            <li role="menuitem" ng-click="$ctrl.showImportModal()"><a href style="padding-left: 10px;"><i class="fad fa-file-import" style="margin-right: 5px;"></i> Import from .txt file <tooltip text="'Import a list of users from a txt file'"></tooltip></a></li>
                        </ul>
                    </div>

                    <div style="display: flex;flex-direction: row;justify-content: space-between;margin-left: auto;">
                        <searchbar placeholder-text="Search users..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>
                </div>
                <div>
                    <sortable-table
                        table-data-set="$ctrl.cms.chatModerationData.userAllowlist"
                        headers="$ctrl.userHeaders"
                        query="$ctrl.search"
                        clickable="false"
                        starting-sort-field="createdAt"
                        sort-initially-reversed="true"
                        page-size="5"
                        no-data-message="No allowed users have been saved.">
                    </sortable-table>
                </div>
            </div>
            <div class="modal-footer">
                <button ng-show="$ctrl.cms.chatModerationData.userAllowlist.length > 0" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.deleteAllUsers()">Delete All Allowed Users</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(chatModerationService, utilityService) {
                const $ctrl = this;

                $ctrl.search = "";

                $ctrl.cms = chatModerationService;

                $ctrl.$onInit = function() {
                // When the component is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
                };

                $ctrl.userHeaders = [
                    {
                        name: "USER",
                        icon: "fa-user",
                        dataField: "text",
                        headerStyles: {
                            'width': '375px'
                        },
                        sortable: true,
                        cellTemplate: `{{data.text}}`,
                        cellController: () => {}
                    },
                    {
                        name: "ADDED AT",
                        icon: "fa-calendar",
                        dataField: "createdAt",
                        sortable: true,
                        cellTemplate: `{{data.createdAt | prettyDate}}`,
                        cellController: () => {}
                    },
                    {
                        headerStyles: {
                            'width': '15px'
                        },
                        cellStyles: {
                            'width': '15px'
                        },
                        sortable: false,
                        cellTemplate: `<i class="fal fa-trash-alt clickable" style="color:#ff3737;" ng-click="clicked()" uib-tooltip="Delete" tooltip-append-to-body="true"></i>`,
                        cellController: ($scope, chatModerationService) => {
                            $scope.clicked = () => {
                                chatModerationService.removeAllowedUserByText($scope.data.text);
                            };
                        }
                    }
                ];

                $ctrl.addUser = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Add allowed User",
                            saveText: "Add",
                            inputPlaceholder: "Enter allowed User",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    if (value == null || value.trim().length < 1 || value.trim().length > 359) {
                                        resolve(false);
                                    } else if (chatModerationService.chatModerationData.userAllowlist
                                        .some(u => u.text === value.toLowerCase())) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Allowed user can't be empty and can't already exist."

                        },
                        (newUser) => {
                            chatModerationService.addAllowedUsers([newUser.trim()]);
                        });
                };

                $ctrl.showImportModal = () => {
                    utilityService.showModal({
                        component: "txtFileWordImportModal",
                        size: 'sm',
                        resolveObj: {},
                        closeCallback: async (data) => {
                            const success = await chatModerationService.importUserAllowlist(data);

                            if (!success) {
                                utilityService.showErrorModal("There was an error importing the user allowlist. Please check the log for more info.");
                            }

                            return success;
                        }
                    });
                };

                $ctrl.deleteAllUsers = function() {
                    utilityService.showConfirmationModal({
                        title: "Delete All Allowed Users",
                        question: `Are you sure you want to delete all allowed users?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then((confirmed) => {
                        if (confirmed) {
                            chatModerationService.removeAllAllowedUsers();
                        }
                    });
                };
            }
        });
}());