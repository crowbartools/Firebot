"use strict";
(function() {
  //This handles viewer lists.
  const { ipcRenderer } = require("electron");

  angular.module("firebotApp").factory("viewersService", function(logger) {
    let service = {};

    // This will cancel editing. Pass true to this to return cell to original value if it was edited.
    function stopEditing(cancel = false) {
      service.gridOptions.api.stopEditing(cancel);
    }

    // This is fired when a cells value is changed. Log the results and then send info to backend to update DB.
    function onCellChanged(event) {
      if (event != null) {
        let rowNode = service.gridOptions.api.getDisplayedRowAtIndex(
            event.rowIndex
          ),
          newValue = event.newValue,
          changePacket = {
            userId: rowNode.data._id,
            field: event.colDef.field,
            value: event.newValue
          };

        // Send new value to backend to apply changes.
        ipcRenderer.send("viewer-db-change", changePacket);

        logger.debug(
          "DB Cell Edited! UserId: " +
            rowNode.data._id +
            ", Change: " +
            event.colDef.field +
            " = " +
            event.newValue
        );
      }
    }

    // This manages the entire DB for the UI.
    // https://www.ag-grid.com
    // To add or remove rows, change here and also in /lib/userDatabase.js getRowsForUi();
    service.gridOptions = {
      columnDefs: [
        { headerName: "UserId", field: "_id", hide: true, editable: false },
        {
          headerName: "Username",
          field: "username",
          sort: "desc",
          editable: false
        },
        { headerName: "Last Seen (MM/DD/YY)", field: "lastSeen" }
      ],
      rowData: [],
      pagination: true,
      paginationAutoPageSize: true,
      enableSorting: true,
      enableFilter: true,
      defaultColDef: {
        editable: true
      },
      onGridReady: function(params) {
        params.api.sizeColumnsToFit();
      },
      onCellEditingStarted: function(event) {
        console.log("cellEditingStarted");
        onEditStart();
      },
      onCellValueChanged: function(event) {
        console.log("cellValueChanged");
        onCellChanged(event);
      }
    };

    return service;
  });
})();
