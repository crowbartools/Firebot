"use strict";

(function() {
    const xlsx = require("node-xlsx").default;
    const fs = require("fs");
    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("importService", function() {
            const service = {};

            const getSlcbQuoteDateFormat = (quotes) => {
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

            const splitSlcbQuotes = (quotes) => {
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

            const mapSlcbViewers = (data) => {
                let i = 0;
                return data.map(v => {
                    i++;

                    return {
                        id: i,
                        name: v[0],
                        rank: v[1],
                        currency: v[2],
                        viewHours: v[3]
                    };
                });
            };

            const mapSlcbRanks = (viewers) => {
                const viewerRanks = viewers.map(message => message.rank);
                const ranks = viewerRanks.reduce((allRanks, rank) => {
                    if (!allRanks.includes(rank) && rank !== "Unranked") {
                        allRanks.push(rank);
                    }

                    return allRanks;
                }, []);

                return ranks;
            };

            service.parseStreamlabsChatbotData = (filepath) => {
                const data = {};
                const file = xlsx.parse(fs.readFileSync(filepath));

                file.forEach(f => {
                    f.data.shift();
                    switch (f.name) {
                        case "Quotes": {
                            const quotes = splitSlcbQuotes(f.data);
                            const dateFormat = getSlcbQuoteDateFormat(quotes);

                            quotes.forEach(q => q.createdAt = moment(q.createdAt, dateFormat).toISOString());

                            data.quotes = quotes;

                            break;
                        }
                        case "Points":
                        case "Currency":
                            data.viewers = mapSlcbViewers(f.data);
                            data.ranks = mapSlcbRanks(data.viewers);
                            break;
                    }

                });

                return data;
            };

            service.parseMixItUpData = (filepath, dataType) => {
                if (dataType === "quotes") {
                    const data = {};
                    //split the file into lines either \r\n or \n
                    const file = fs.readFileSync(filepath, { encoding: "utf8" }).split(/\r?\n/);
                    const header = file.shift();
                    if (header !== "#	Quote	Game	Date/Time") {
                        return data;
                    }
                    //remove any empty lines
                    file.forEach((line, index) => {
                        if (line === "") {
                            file.splice(index, 1);
                        }
                    });
                    //split the file into quotes
                    const quotes = file.map(q => {
                        const splittedQuote = q.split("\t");
                        return {
                            _id: splittedQuote[0],
                            text: splittedQuote[1],
                            originator: "",
                            creator: "",
                            game: splittedQuote[2],
                            createdAt: splittedQuote[3]
                        };
                    });
                    //set the quotes property on the data object
                    data.quotes = quotes;
                    //return the data object
                    return data;
                }
            };

            return service;
        });
}());