"use strict";

(function() {
    const { ipcRenderer } = require("electron");

    // Info on ag-grid
    //https://www.ag-grid.com/javascript-grid-data-update/

    angular
        .module("firebotApp")
        .controller("viewersController", function(
            $scope,
            $timeout,
            $interval,
            viewersService,
            ngToast,
            connectionService,
            utilityService,
            settingsService,
            backendCommunicator,
            $q
        ) {
            //This handles the Viewers tab

            let gridOptions = viewersService.gridOptions;
            let columnsPreferences = settingsService.getViewerColumnPreferences();
            $scope.isViewerDbOn = viewersService.isViewerDbOn;
            gridOptions.columnDefs = viewersService.getColumnDefsforPrefs(
                columnsPreferences
            );
            $scope.gridOptions = gridOptions;

            // Send request to main process to get all of our rows.
            function updateRowData() {
                if (!viewersService.isViewerDbOn()) {
                    return;
                }

                ipcRenderer.send("request-viewer-db");
            }

            // Refresh the viewer table on button click.
            $scope.refreshViewerTable = function() {
                if (!viewersService.isViewerDbOn()) {
                    return;
                }

                updateRowData();

                ngToast.create({
                    className: "success",
                    content: "Success!"
                });
            };

            // Open edit columns modal.
            $scope.openEditColumnsModal = function() {
                utilityService.showModal({
                    component: "editColumnsModal",
                    size: "sm",
                    resolveObj: {
                        columnPrefs: () => columnsPreferences
                    },
                    closeCallback: resp => {
                        viewersService.setColumns(resp.preferences);
                        columnsPreferences = resp.preferences;

                        settingsService.setViewerColumnPreferences(resp.preferences);

                        // Refresh Database here
                        updateRowData();
                    }
                });
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
                    dataField: "username"
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
                let order = user[$scope.order.field];
                return order;
            };

            // Receives table data from main process.
            ipcRenderer.on("viewer-db-response", function(event, rows) {
                if (!viewersService.isViewerDbOn()) {
                    return;
                }

                /*$scope.gridOptions.api.setRowData(rows);

                $timeout(function() {
                    if ($scope.gridOptions.api) {
                        $scope.gridOptions.api.sizeColumnsToFit();
                    }
                }, 500);*/
            });

            // Update table rows when first visiting the page.
            if (viewersService.isViewerDbOn()) {
                updateRowData();
            }

            // show alert that you need to be connected to chat for stuff to work.
            if (
                !connectionService.connectedToChat &&
        !viewersService.sawWarningAlert &&
        viewersService.isViewerDbOn()
            ) {
                viewersService.sawWarningAlert = true;
                ngToast.create({
                    content:
            "A chat connection is required for many systems here to work.",
                    dismissButton: true,
                    timeout: 3000
                });
            }
        });
}());
