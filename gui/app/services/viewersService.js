"use strict";
(function() {
  //This handles viewer lists.
  const { ipcRenderer } = require("electron");

  angular
    .module("firebotApp")
    .factory("viewersService", function(logger, settingsService) {
      let service = {};

      // Check to see if the DB is turned on or not.
      service.isViewerDbOn = function() {
        return settingsService.getViewerDB();
      };

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

      const defaultColDefs = [
        { headerName: "UserId", field: "_id", hide: true, editable: false },
        {
          headerName: "Username",
          field: "username",
          sort: "desc",
          editable: false
        }
      ];

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
          }
        ],
        rowData: [],
        pagination: true,
        paginationAutoPageSize: true,
        enableSorting: true,
        enableFilter: true,
        enableColResize: true,
        suppressMenuHide: true,
        defaultColDef: {
          editable: true
        },
        onGridReady: function(params) {
          params.api.sizeColumnsToFit();
        },
        onCellValueChanged: function(event) {
          onCellChanged(event);
        }
      };

      // Definitions of all of the fields that we allow to be shown in the UI.
      service.fieldDefs = {
        lastSeen: {
          headerName: "Last Seen",
          field: "lastSeen",
          editable: true
        },
        minutesInChannel: {
          headerName: "View Time (min)",
          field: "minutesInChannel",
          editable: false
        },
        joinDate: {
          headerName: "Join Date",
          field: "joinDate",
          editable: true
        },
        mixplayInteractions: {
          headerName: "Mixplay Interactions",
          field: "mixplayInteractions",
          editable: true
        },
        chatMessages: {
          headerName: "Chat Messages",
          field: "chatMessages",
          editable: true
        }
      };

      /*
     Example columnPrefs:
     {
       lastSeen: true,
       joinDate: false,
       minutesInChannel: true
     }
    */
      service.setColumns = function(columnPrefs) {
        // copy over default defs
        let customColumnDefs = service.getColumnDefsforPrefs(columnPrefs);

        service.gridOptions.api.setColumnDefs(customColumnDefs);

        // get the grid to space out its columns
        service.gridOptions.api.refreshView();
      };

      service.getColumnDefsforPrefs = function(columnPrefs) {
        let customColumnDefs = JSON.parse(JSON.stringify(defaultColDefs));

        if (columnPrefs.lastSeen) {
          customColumnDefs.push(service.fieldDefs.lastSeen);
        }

        if (columnPrefs.joinDate) {
          customColumnDefs.push(service.fieldDefs.joinDate);
        }

        if (columnPrefs.minutesInChannel) {
          customColumnDefs.push(service.fieldDefs.minutesInChannel);
        }

        if (columnPrefs.mixplayInteractions) {
          customColumnDefs.push(service.fieldDefs.mixplayInteractions);
        }

        if (columnPrefs.chatMessages) {
          customColumnDefs.push(service.fieldDefs.chatMessages);
        }

        return customColumnDefs;
      };

      service.sawWarningAlert = false;

      return service;
    });
})();
