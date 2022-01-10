"use strict";

(function() {
    const xlsx = require("node-xlsx").default;
    const fs = require("fs-extra");
    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("importService", function() {
            let service = {};

            const getQuoteDateFormat = (quotes) => {
                let dateFormat = null;

                quotes.forEach(q => {
                    const dateArray = q.createdAt.split("-");

                    if (parseInt(dateArray[0]) > 12) {
                        dateFormat = "DD-MM-YYYY";
                        return false;
                    } else if (parseInt(dateArray[1]) > 12) {
                        dateFormat = "MM-DD-YYYY";
                        return false;
                    }
                });

                return dateFormat;
            };

            const getSplittedQuotes = (quotes) => {
                return quotes.map(q => {
                    const splittedQuote = q[1].split("[").map(sq => sq.replace("]", "").trim());

                    if (splittedQuote.length > 3) {
                        splittedQuote[0] = splittedQuote.slice(0, splittedQuote.length - 2).join(" ");
                    }

                    return {
                        _id: q[0] + 1,
                        text: splittedQuote[0],
                        originator: "",
                        creator: "",
                        game: splittedQuote[splittedQuote.length - 2],
                        createdAt: splittedQuote[splittedQuote.length - 1]
                    };
                });
            };

            service.parseStreamlabsChatbotData = (filepath) => {
                const data = {};
                const file = xlsx.parse(fs.readFileSync(filepath));

                file.forEach(f => {
                    if (f.name === "Quotes") {
                        f.data.shift();

                        const quotes = getSplittedQuotes(f.data);
                        const dateFormat = getQuoteDateFormat(quotes);

                        quotes.forEach(q => q.createdAt = moment(q.createdAt, dateFormat).toISOString());

                        data.quotes = quotes;
                    }
                });



                return data;
            };

            return service;
        });
}());