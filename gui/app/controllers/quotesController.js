"use strict";

(function() {

    angular
        .module("firebotApp")
        .controller("quotesController", function($scope, quotesService, utilityService) {

            $scope.showAddOrEditQuoteModal = (quote) => {
                utilityService.showModal({
                    component: "addOrEditQuoteModal",
                    backdrop: true,
                    resolveObj: {
                        quote: () => quote
                    },
                    closeCallback: (data) => {
                        let {action, quote} = data;
                        switch (action) {
                        case "add":
                            quotesService.addQuote(quote);
                            break;
                        case "update":
                            quotesService.updateQuote(quote);
                            break;
                        case "delete":
                            if (quote != null) {
                                quotesService.deleteQuote(quote._id);
                            }
                            break;
                        }
                    }
                });
            };

            $scope.quoteRowClicked = (quote) => {
                $scope.showAddOrEditQuoteModal(quote);
            };

            $scope.qs = quotesService;

            quotesService.fetchQuotes();

            $scope.quoteSerach = "";

            $scope.headers = [
                {
                    name: "ID",
                    icon: "fa-id-badge",
                    dataField: "_id",
                    headerStyles: {},
                    sortable: true,
                    cellTemplate: `{{data._id}}`,
                    cellController: () => {}
                },
                {
                    name: "QUOTE",
                    icon: "fa-quote-right",
                    dataField: "text",
                    headerStyles: {
                        'width': '65%'
                    },
                    cellStyles: {
                        'width': '65%',
                        'padding': '5px 10px 5px 0'
                    },
                    sortable: true,
                    cellTemplate: `{{data.text}}`,
                    cellController: () => {}
                },
                {
                    name: "AUTHOR",
                    icon: "fa-user",
                    dataField: "originator",
                    headerStyles: {},
                    sortable: true,
                    cellTemplate: `{{data.originator}}`,
                    cellController: () => {}
                },
                {
                    name: "DATE",
                    icon: "fa-calendar",
                    dataField: "createdAt",
                    sortable: true,
                    cellTemplate: `{{data.createdAt | prettyDate}}`,
                    cellController: () => {}
                },
                {
                    name: "GAME",
                    icon: "fa-gamepad-alt",
                    dataField: "game",
                    sortable: true,
                    headerStyles: {
                        'width': '175px'
                    },
                    cellStyles: {
                        'width': '175px'
                    },
                    cellTemplate: `<div style="width:175px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{data.game || "Unknown Game"}}</div>`,
                    cellController: () => {}
                },
                {
                    headerStyles: {
                        'width': '15px'
                    },
                    cellStyles: {
                        'width': '15px'
                    },
                    sortable: false,
                    cellTemplate: `<i class="fal fa-chevron-right"></i>`,
                    cellController: () => {}
                }
            ];
        });
}());
