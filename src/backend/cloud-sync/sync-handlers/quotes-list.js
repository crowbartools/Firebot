"use strict";

const quoteManager = require("../../quotes/quotes-manager");

async function getQuoteListForSync() {
    const quotes = await quoteManager.getAllQuotes();
    const quotesData = {
        'quotes': quotes
    };

    if (quotesData.quotes == null) {
        return null;
    }

    return quotesData;
}

exports.getQuoteListForSync = getQuoteListForSync;