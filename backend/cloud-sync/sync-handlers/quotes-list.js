"use strict";

const quoteManager = require("../../quotes/quotes-manager");

async function getQuoteListForSync() {
    let quotes = await quoteManager.getAllQuotes();
    let quotesData = {
        'quotes': quotes
    };

    if (quotesData.quotes == null) {
        return null;
    }

    return quotesData;
}

exports.getQuoteListForSync = getQuoteListForSync;