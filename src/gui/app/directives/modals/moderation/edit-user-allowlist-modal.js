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
                <p class="muted">Users on this list will automatically be allowed to post URLs in chat.</p>
                <div class="flex flex-row justify-between my-10">
                    <button class="btn btn-primary" type="button" aria-haspopup="true" ng-click="$ctrl.showViewerSearchModal()">
                        <span class="dropdown-text"><i class="fas fa-plus-circle"></i> Add User</span>
                    </button>

                    <div class="ml-auto">
                        <searchbar placeholder-text="Search users..." query="$ctrl.search" class="basis-250"></searchbar>
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
            controller: function(chatModerationService, utilityService, logger) {
                const $ctrl = this;

                $ctrl.search = "";

                $ctrl.cms = chatModerationService;

                $ctrl.userHeaders = [
                    {
                        name: "USER",
                        icon: "fa-user",
                        dataField: "username",
                        headerStyles: {
                            'width': '375px'
                        },
                        sortable: true,
                        cellTemplate: `{{data.displayName}}`,
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
                                chatModerationService.removeAllowedUserById($scope.data.id);
                            };
                        }
                    }
                ];

                $ctrl.showViewerSearchModal = () => {
                    utilityService.openViewerSearchModal(
                        {
                            label: "Add User",
                            saveText: "Add"
                        },
                        (user) => {
                            chatModerationService.addAllowedUser(user);
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