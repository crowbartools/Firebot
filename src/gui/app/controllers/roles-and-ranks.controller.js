"use strict";
(function() {
    // This handles the Groups tab

    angular
        .module("firebotApp")
        .controller("rolesAndRanksController", function($scope, utilityService, viewerRolesService, viewerRanksService) {

            $scope.activeTab = 0;

            /**
             * Roles
             */

            $scope.viewerRolesService = viewerRolesService;

            $scope.showAddOrEditCustomRoleModal = function(role) {

                utilityService.showModal({
                    component: "addOrEditCustomRoleModal",
                    size: "sm",
                    resolveObj: {
                        role: () => role
                    },
                    closeCallback: (resp) => {
                        const { action, role } = resp;

                        switch (action) {
                            case "save":
                                viewerRolesService.saveCustomRole(role);
                                break;
                            case "delete":
                                viewerRolesService.deleteCustomRole(role.id);
                                break;
                        }
                    }
                });
            };

            /**
             * Ranks
             */
            $scope.viewerRanksService = viewerRanksService;

            $scope.rankTrackHeaders = [
                {
                    name: "NAME",
                    icon: "fa-tag",
                    dataField: "name",
                    sortable: true,
                    cellTemplate: `{{data.name}}`
                },
                {
                    name: "TYPE",
                    icon: "fa-bring-forward",
                    cellTemplate: `{{data.type | capitalize}}`
                },
                {
                    name: "RANKS",
                    icon: "fa-medal",
                    cellTemplate: `{{data.ranks.length}}`
                }
            ];

            $scope.showAddOrEditRankTrackModal = function(track) {
            };

            $scope.rankTrackMenuOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function () {
                            $scope.showAddOrEditRankTrackModal(item);
                        }
                    },
                    {
                        html: `<a href><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${item.enabled ? "Disable Rank Track" : "Enable Rank Track"}</a>`,
                        click: function () {
                            item.enabled = !item.enabled;
                            viewerRanksService.saveRankTrack(item);
                        },
                        compile: true
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            viewerRanksService.duplicateRankTrack(item.id);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Rank Track",
                                    question: `Are you sure you want to delete the Rank Track "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        viewerRanksService.deleteRankTrack(item.id);
                                    }
                                });

                        },
                        compile: true
                    }
                ];

                return options;
            };
        });
}());
