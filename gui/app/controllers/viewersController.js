"use strict";

(function() {

    angular
        .module("firebotApp")
        .controller("viewersController", function($scope, viewersService, currencyService, utilityService) {
            //This handles the Viewers tab

            $scope.showUserDetailsModal = (userId) => {
                let closeFunc = () => {
                    viewersService.updateViewer(userId);
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

            // Update table rows when first visiting the page.
            if (viewersService.isViewerDbOn()) {
                viewersService.updateViewers();
            }

            $scope.pagination = {
                currentPage: 1,
                pageSize: 10
            };

            $scope.getRangeMin = function() {
                return 1 + $scope.pagination.pageSize * ($scope.pagination.currentPage - 1);
            };

            $scope.getRangeMax = function(filteredLength) {
                let max = $scope.pagination.pageSize * $scope.pagination.currentPage;
                return max <= filteredLength ? max : filteredLength;
            };

            $scope.viewerSearch = "";

            $scope.vs = viewersService;

            $scope.getViewTimeDisplay = (minutesInChannel) => {
                return minutesInChannel < 60 ? 'Less than an hour' : Math.round(minutesInChannel / 60);
            };

            $scope.headers = [
                {
                    name: "USERNAME",
                    icon: "fa-user",
                    dataField: "username",
                    styles: {
                        'min-width': '125px'
                    }
                },
                {
                    name: "JOIN DATE",
                    icon: "fa-sign-in",
                    dataField: "joinDate"
                },
                {
                    name: "LAST SEEN",
                    icon: "fa-eye",
                    dataField: "lastSeen"
                },
                {
                    name: "VIEW TIME (hours)",
                    icon: "fa-tv",
                    dataField: "minutesInChannel"
                },
                {
                    name: "MIXPLAY INTERACTIONS",
                    icon: "fa-gamepad",
                    dataField: "mixplayInteractions"
                },
                {
                    name: "CHAT MESSAGES",
                    icon: "fa-comments",
                    dataField: "chatMessages"
                }
            ];

            $scope.currencies = currencyService.getCurrencies();

            for (let currency of $scope.currencies) {
                $scope.headers.push({
                    name: currency.name.toUpperCase(),
                    icon: "fa-money-bill",
                    dataField: "currency." + currency.id
                });
            }

            $scope.order = {
                field: 'username',
                reverse: false
            };

            $scope.isOrderField = function(field) {
                return field === $scope.order.field;
            };

            $scope.setOrderField = function(field) {
                if ($scope.order.field !== field) {
                    $scope.order.reverse = false;
                    $scope.order.field = field;
                } else {
                    $scope.order.reverse = !$scope.order.reverse;
                }
            };

            $scope.dynamicOrder = function(user) {
                let order;
                let field = $scope.order.field;
                if (field.startsWith("currency.")) {
                    let currencyId = field.replace("currency.", "");
                    order = user.currency[currencyId];
                } else {
                    order = user[$scope.order.field];
                }
                return order;
            };
        });
}());
