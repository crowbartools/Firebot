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
                    breadcrumbName: "Add/Edit Custom Role",
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

            $scope.rankLadderHeaders = [
                {
                    name: "NAME",
                    icon: "fa-tag",
                    dataField: "name",
                    sortable: true,
                    cellTemplate: `{{data.name}}`
                },
                {
                    name: "MODE",
                    icon: "fa-bring-forward",
                    cellTemplate: `{{data.mode | capitalize}}`
                },
                {
                    name: "RANKS",
                    icon: "fa-medal",
                    cellTemplate: `{{data.ranks.length}}`
                }
            ];

            $scope.rankLadderMenuOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function () {
                            viewerRanksService.showAddOrEditRankLadderModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            viewerRanksService.duplicateRankLadder(item.id);
                        }
                    },
                    ...(item.mode === "auto" ?
                        [{
                            html: `<a href ><i class="far fa-calculator" style="margin-right: 10px;"></i> Recalculate Ranks</a>`,
                            click: function () {
                                viewerRanksService.showRecalculateRanksModal(item);
                            }
                        }
                        ] : []
                    ),
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Rank Ladder",
                                    question: `Are you sure you want to delete the Rank Ladder "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        viewerRanksService.deleteRankLadder(item.id);
                                    }
                                });

                        },
                        compile: true
                    }
                ];

                return options;
            };
        });
})();
