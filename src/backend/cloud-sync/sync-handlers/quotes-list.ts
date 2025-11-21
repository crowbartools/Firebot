import { QuoteManager } from "../../quotes/quote-manager";

export async function getQuoteListForSync() {
    const quotes = await QuoteManager.getAllQuotes();
    const quotesData = {
        'quotes': quotes
    };

    if (quotesData.quotes == null) {
        return null;
    }

    return quotesData;
}