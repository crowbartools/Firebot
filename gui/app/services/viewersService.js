"use strict";
(function() {
  //This handles viewer lists.
  const { ipcRenderer } = require("electron");

  angular.module("firebotApp").factory("viewersService", function() {
    let service = {};

    service.gridOptions = {
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


    return service;
  });
})();
