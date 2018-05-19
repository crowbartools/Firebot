"use strict";

(function() {
  const { ipcRenderer } = require("electron");

  // Info on ag-grid
  //https://www.ag-grid.com/javascript-grid-data-update/

  angular
    .module("firebotApp")
    .controller("viewersController", function($scope, viewersService) {
      //This handles the Viewers tab

      $scope.gridOptions = {
        columnDefs: [
          { headerName: "Username", field: "username" },
          { headerName: "Last Seen", field: "lastSeen" }
        ],
        rowData: [],
        pagination: true,
        paginationAutoPageSize: true,
          enableSorting: true,
          enableFilter: true
      };

      function updateRowData() {
        ipcRenderer.send("request-viewer-db");
      }

      ipcRenderer.on("viewer-db-response", function(event, rows) {
        $scope.gridOptions.api.setRowData(rows);
      });

      updateRowData();
    });
})();
