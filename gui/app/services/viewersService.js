"use strict";
(function() {
  //This handles viewer lists.
  const { ipcRenderer } = require("electron");
  const profileManager = require("../../lib/common/profile-manager.js");

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

      // Default Column Defs
      // These are columns that the user can't toggle and are always visible.
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
      service.gridOptions = {
        columnDefs: defaultColDefs,
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
      // Note: Dynamic fields (like currencies) get added into here on app launch.
      service.fieldDefs = {
        lastSeen: {
          headerName: "Last Seen",
          field: "lastSeen",
          editable: true,
          valueParser: function(params) {
            // convert to number
            return Number(params.newValue);
          }
        },
        minutesInChannel: {
          headerName: "View Time (min)",
          field: "minutesInChannel",
          editable: false,
          valueParser: function(params) {
            // convert to number
            return Number(params.newValue);
          }
        },
        joinDate: {
          headerName: "Join Date",
          field: "joinDate",
          editable: true,
          valueParser: function(params) {
            // convert to number
            return Number(params.newValue);
          }
        },
        mixplayInteractions: {
          headerName: "Mixplay Interactions",
          field: "mixplayInteractions",
          editable: true,
          valueParser: function(params) {
            // convert to number
            return Number(params.newValue);
          }
        },
        chatMessages: {
          headerName: "Chat Messages",
          field: "chatMessages",
          editable: true,
          valueParser: function(params) {
            // convert to number
            return Number(params.newValue);
          }
        }
      };

      // This will move our user selected column defs over to our ag-grid defs.
      service.setColumns = function(columnPrefs) {
        // copy over default defs
        let customColumnDefs = service.getColumnDefsforPrefs(columnPrefs);
        service.gridOptions.api.setColumnDefs(customColumnDefs);

        // get the grid to space out its columns
        service.gridOptions.api.refreshView();
      };

      // This checks our user selection to determine which column defs should be moved to ag-grid.
      service.getColumnDefsforPrefs = function(columnPrefs) {
        // Update all dynamic DB columns here.
        service.updateCurrencyDefs();

        // Now we can start pushing our user selected columns.
        let customColumnDefs = JSON.parse(JSON.stringify(defaultColDefs));

        // Cycle through user selected columns, find defs, pass defs to grid.
        Object.keys(columnPrefs).forEach(function(pref) {
          let setting = columnPrefs[pref];

          if (setting) {
            if (service.fieldDefs[pref] != null) {
              customColumnDefs.push(service.fieldDefs[pref]);
            }
          }
        });

        return customColumnDefs;
      };

      // Will go through our currencies and add them to our defs.
      service.updateCurrencyDefs = function() {
        let db = profileManager.getJsonDbInProfile("/currency/currency"),
          currencies = db.getData("/");

        Object.keys(currencies).forEach(function(currency) {
          currency = currencies[currency];

          service.fieldDefs["currency." + currency.id] = {
            headerName: currency.name,
            field: "currency." + currency.id,
            editable: true,
            valueParser: function(params) {
              // convert to number
              return Number(params.newValue);
            }
          };
        });
      };

      // This will delete a currency from our defs.
      // This is used when a user deletes currency from the currency page and ensures
      // We dont have a currency in our grid that no longer exists.
      service.deleteCurrencyDefs = function(currencyId) {
        delete service.fieldDefs[currencyId];
        settingsService.deleteFromViewerColumnPreferences(currencyId);
      };

      //////////////
      // Events

      // Sent from currencyDatabase.js when a currency is deleted.
      ipcRenderer.on("delete-currency-def", function(event, currencyId) {
        if (currencyId != null) {
          service.deleteCurrencyDefs(currencyId);
        }
      });

      // Did user see warning alert about connecting to chat first?
      service.sawWarningAlert = false;
      return service;
    });
})();
