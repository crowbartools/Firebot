"use strict";

(function() {

    angular
        .module("firebotApp")
        .controller("viewersController", function($route, $scope, viewersService, currencyService,
            utilityService, settingsService, viewerRolesService) {

            $scope.viewerRoles = {
                twitch: [
                    ...viewerRolesService.getTwitchRoles(),
                    ...viewerRolesService.getTeamRoles()
                ],
                firebot: viewerRolesService.getFirebotRoles(),
                custom: viewerRolesService.getCustomRoles()
            };

            $scope.viewers = viewersService.viewers;

            $scope.clearRoleFilter = () => {
                $scope.viewers = viewersService.viewers;
            };

            $scope.filterViewers = (role, roleType) => {
                $scope.clearRoleFilter();

                switch (roleType) {
                    case "twitch":
                        $scope.viewers = $scope.viewers.filter(v => v.twitchRoles.includes(role.id));
                        return;
                    case "custom":
                        $scope.viewers = $scope.viewers.filter(v => role.viewers.some(rv => rv.id == v._id));
                        return;
                    default:
                        $scope.clearRoleFilter();
                }
            };

            $scope.viewerTablePageSize = settingsService.getSetting("ViewerListPageSize");

            $scope.showUserDetailsModal = (userId) => {
                const closeFunc = () => {
                    viewersService.updateViewers();
                };
                utilityService.showModal({
                    component: "viewerDetailsModal",
                    backdrop: true,
                    resolveObj: {
                        userId: () => userId
                    },
                    closeCallback: closeFunc,
                    dismissCallback: closeFunc
                });
            };

            $scope.showImportViewersModal = () => {
                utilityService.showModal({
                    component: "importViewersModal",
                    closeCallback: () => {
                        $route.reload();
                    }
                });
            };

            $scope.viewerRowClicked = (data) => {
                $scope.showUserDetailsModal(data._id);
            };

            $scope.showViewerSearchModal = () => {
                utilityService.openViewerSearchModal(
                    {
                        label: "Viewer Search",
                        saveText: "Select"
                    },
                    (user) => {
                        $scope.showUserDetailsModal(user.id);
                    });
            };

            $scope.vs = viewersService;

            // Update table rows when first visiting the page.
            if (viewersService.isViewerDbOn()) {
                viewersService.updateViewers();
            }

            $scope.viewerSearch = "";

            $scope.headers = [
                {
                    headerStyles: {
                        'width': '50px'
                    },
                    sortable: false,
                    cellTemplate: `<img ng-src="{{data.twitch ? data.profilePicUrl : '../images/placeholders/default-profile-pic.png'}}"  style="width: 25px;height: 25px;border-radius: 25px;"/>`,
                    cellController: () => {}
                },
                {
                    name: "USERNAME",
                    icon: "fa-user",
                    dataField: "username",
                    headerStyles: {
                        'min-width': '125px'
                    },
                    sortable: true,
                    cellTemplate: `{{data.displayName || data.username}}<span ng-if="data.displayName && data.username.toLowerCase() !== data.displayName.toLowerCase()" class="muted"> ({{data.username}})</span>`,
                    cellController: () => {}
                },
                {
                    name: "JOIN DATE",
                    icon: "fa-sign-in",
                    dataField: "joinDate",
                    sortable: true,
                    cellTemplate: `{{data.joinDate | prettyDate}}`,
                    cellController: () => {}
                },
                {
                    name: "LAST SEEN",
                    icon: "fa-eye",
                    dataField: "lastSeen",
                    sortable: true,
                    cellTemplate: `{{data.lastSeen | prettyDate}}`,
                    cellController: () => {}
                },
                {
                    name: "VIEW TIME (hours)",
                    icon: "fa-tv",
                    dataField: "minutesInChannel",
                    sortable: true,
                    cellTemplate: `{{getViewTimeDisplay(data.minutesInChannel)}}`,
                    cellController: ($scope) => {
                        $scope.getViewTimeDisplay = (minutesInChannel) => {
                            return minutesInChannel < 60 ? 'Less than an hour' : Math.round(minutesInChannel / 60);
                        };
                    }
                },
                {
                    name: "CHAT MESSAGES",
                    icon: "fa-comments",
                    dataField: "chatMessages",
                    sortable: true,
                    cellTemplate: `{{data.chatMessages}}`,
                    cellController: () => {}
                }
            ];

            $scope.currencies = currencyService.getCurrencies();

            for (const currency of $scope.currencies) {
                $scope.headers.push({
                    name: currency.name.toUpperCase(),
                    icon: "fa-money-bill",
                    dataField: `currency.${currency.id}`,
                    sortable: true,
                    cellTemplate: `{{data.currency['${currency.id}']}}`,
                    cellController: () => {}
                });
            }

            $scope.headers.push({
                headerStyles: {
                    'width': '15px'
                },
                cellStyles: {
                    'width': '15px'
                },
                sortable: false,
                cellTemplate: `<i class="fal fa-chevron-right"></i>`,
                cellController: () => {}
            });
        });
}());
