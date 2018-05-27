"use strict";

(function() {
  const { ipcRenderer } = require("electron");

  // Info on ag-grid
  //https://www.ag-grid.com/javascript-grid-data-update/

  angular
    .module("firebotApp")
    .controller("viewersController", function(
      $scope,
      viewersService,
      ngToast,
      connectionService
    ) {
      //This handles the Viewers tab

      $scope.gridOptions = viewersService.gridOptions;

      // Send request to main process to get all of our rows.
      function updateRowData() {
        ipcRenderer.send("request-viewer-db");
      }

      // Refresh the viewer table on button click.
      $scope.refreshViewerTable = function() {
        updateRowData();

        ngToast.create({
          className: "success",
          content: "Success!"
        });
      };

      // Receives table data from main process.
      ipcRenderer.on("viewer-db-response", function(event, rows) {
        $scope.gridOptions.api.setRowData(rows);
      });

      // Update table rows when first visiting the page.
      updateRowData();

      if (!connectionService.connectedToChat) {
        ngToast.create({
          content:
            "A chat connection is required for many systems here to work.",
          dismissButton: true,
          dismissOnTimeout: false
        });
      }
    });
})();
