"use strict";
(function() {

    angular
        .module("firebotApp")
        .factory("quotesService", function(backendCommunicator, $q) {
            let service = {};

            service.quotes = [];

            service.fetchQuotes = function() {
                $q.when(backendCommunicator.fireEventAsync("get-all-quotes"))
                    .then(quotes => {
                        service.quotes = quotes;
                    });
            };

            service.addQuote = (quote) => {
                backendCommunicator.fireEvent("add-quote", quote);
            };

            service.updateQuote = (quote) => {
                let index = service.quotes.findIndex(q => q._id === quote._id);
                if (index > -1) {
                    service.quotes[index] = quote;
                    backendCommunicator.fireEvent("update-quote", quote);
                }
            };

            service.deleteQuote = (quoteId) => {
                let index = service.quotes.findIndex(q => q._id === quoteId);
                if (index > -1) {
                    service.quotes.splice(index, 1);
                    backendCommunicator.fireEvent("delete-quote", quoteId);
                }
            };

            backendCommunicator.on("quotes-update", () => {
                service.fetchQuotes();
            });

            return service;
        });
}());
