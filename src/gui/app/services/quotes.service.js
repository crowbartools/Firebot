"use strict";
(function() {

    angular
        .module("firebotApp")
        .factory("quotesService", function(backendCommunicator, $q, ngToast) {
            const service = {};

            service.quotes = [];

            service.fetchQuotes = function() {
                $q.when(backendCommunicator.fireEventAsync("get-all-quotes"))
                    .then((quotes) => {
                        service.quotes = quotes;
                    });
            };

            service.addQuote = (quote) => {
                backendCommunicator.fireEvent("add-quote", quote);
            };

            service.updateQuote = (quote) => {
                const index = service.quotes.findIndex(q => q._id === quote._id);
                if (index > -1) {
                    service.quotes[index] = quote;
                    backendCommunicator.fireEvent("update-quote", quote);
                }
            };

            service.deleteQuote = (quoteId) => {
                const index = service.quotes.findIndex(q => q._id === quoteId);
                if (index > -1) {
                    service.quotes.splice(index, 1);
                    backendCommunicator.fireEvent("delete-quote", quoteId);
                }
            };

            service.exportQuotesToFile = async () => {
                const dialogResponse = await backendCommunicator.fireEventAsync("show-save-dialog", {
                    options: {
                        buttonLabel: "Save",
                        title: "Export Quotes",
                        filters: [
                            { name: "CSV File", extensions: ['csv'] }
                        ],
                        properties: ["showOverwriteConfirmation", "createDirectory"]
                    }
                });

                if (!dialogResponse.canceled) {
                    const success = await backendCommunicator.fireEventAsync("quotes:export-quotes-to-file",
                        dialogResponse.filePath
                    );

                    if (success) {
                        ngToast.create({
                            className: 'success',
                            content: 'Quotes exported!'
                        });
                    } else {
                        ngToast.create({
                            className: 'error',
                            content: 'Failed to export quotes'
                        });
                    }
                }
            };

            backendCommunicator.on("quotes-update", () => {
                service.fetchQuotes();
            });

            return service;
        });
}());
