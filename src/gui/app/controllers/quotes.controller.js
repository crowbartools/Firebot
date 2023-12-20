"use strict";

(function() {

    angular
        .module("firebotApp")
        .controller("quotesController", function($scope, quotesService, utilityService) {

            $scope.showAddOrEditQuoteModal = (quote) => {
                utilityService.showModal({
                    component: "addOrEditQuoteModal",
                    backdrop: false,
                    resolveObj: {
                        quote: () => quote
                    },
                    closeCallback: (data) => {
                        const {action, quote} = data;
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

            $scope.showImportQuotesModal = () => {
                utilityService.showModal({
                    component: "importQuotesModal",
                    size: "lg"
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
                    headerStyles: {
                        'padding-right': '3px'
                    },
                    cellStyles: {
                        'padding-right': '3px'
                    },
                    sortable: true,
                    cellTemplate: `{{data._id}}`,
                    cellController: () => {}
                },
                {
                    name: "QUOTE",
                    icon: "fa-quote-right",
                    dataField: "text",
                    headerStyles: {
                        'width': '65%',
                        'padding': '0px 3px'
                    },
                    cellStyles: {
                        'width': '65%',
                        'padding': '5px 3px'
                    },
                    sortable: true,
                    cellTemplate: `{{data.text}}`,
                    cellController: () => {}
                },
                {
                    name: "AUTHOR",
                    icon: "fa-user",
                    dataField: "originator",
                    headerStyles: {
                        'padding': '0px 3px'
                    },
                    cellStyles: {
                        'padding': '0px 3px'
                    },
                    sortable: true,
                    cellTemplate: `{{data.originator}}`,
                    cellController: () => {}
                },
                {
                    name: "DATE",
                    icon: "fa-calendar",
                    dataField: "createdAt",
                    sortable: true,
                    headerStyles: {
                        'padding': '0px 3px'
                    },
                    cellStyles: {
                        'padding': '0px 3px'
                    },
                    cellTemplate: `{{data.createdAt | prettyDate}}`,
                    cellController: () => {}
                },
                {
                    name: "CATEGORY/GAME",
                    icon: "fa-gamepad-alt",
                    dataField: "game",
                    sortable: true,
                    headerStyles: {
                        'width': '175px',
                        'padding': '0px 3px'
                    },
                    cellStyles: {
                        'width': '175px',
                        'padding': '0px 3px'
                    },
                    cellTemplate: `<div style="width:175px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{data.game || "Unknown Category/Game"}}</div>`,
                    cellController: () => {}
                },
                {
                    headerStyles: {
                        'width': '15px',
                        'padding-left': '3px'
                    },
                    cellStyles: {
                        'width': '15px',
                        'padding-left': '3px'
                    },
                    sortable: false,
                    cellTemplate: `<i class="fal fa-chevron-right"></i>`,
                    cellController: () => {}
                }
            ];
        });
}());
