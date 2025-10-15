import { Request, Response } from "express";
import moment from "moment";
import { FormattedQuote, Quote } from "../../../../types/quotes";
import { QuoteManager } from "../../../../backend/quotes/quote-manager";

function validateQuoteId(quoteId: string, res: Response): number {
    if (quoteId == null) {
        res.status(400).send({
            status: "error",
            message: "No quoteId provided"
        });
        return null;
    }

    const quoteIdNum = parseInt(quoteId);
    if (isNaN(quoteIdNum)) {
        res.status(400).send({
            status: "error",
            message: "Invalid quoteId provided"
        });
        return null;
    }

    return quoteIdNum;
}

// Formats a quote for API output
function formatQuote(quote: Quote): FormattedQuote {
    return {
        id: quote._id,
        text: quote.text,
        originator: quote.originator,
        creator: quote.creator,
        game: quote.game,
        createdAt: quote.createdAt
    };
}

// Validates that all required quote fields are present and valid
function validateQuote(quote: Partial<Quote>): string[] {
    quote = quote ?? {};
    const validationErrors: string[] = [];

    if (!(quote.text?.length > 0)) {
        validationErrors.push("Missing quote text");
    }

    if (!(quote.creator?.length > 0)) {
        validationErrors.push("Missing quote creator");
    }

    return validationErrors;
}

export const getQuotes = async function(req: Request, res: Response) {
    const quotes = await QuoteManager.getAllQuotes();

    const formattedQuotes = quotes.map((q) => {
        return formatQuote(q);
    });

    res.json(formattedQuotes);
};

export const getQuote = async function(req: Request, res: Response) {
    const quoteId = validateQuoteId(req.params.quoteId, res);
    if (!quoteId) {
        return;
    }

    const quote = await QuoteManager.getQuote(quoteId);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${quoteId} not found`
        });
    }

    res.json(formatQuote(quote));
};

export const postQuote = async function(req: Request, res: Response) {
    // Make sure the new quote is valid
    const body = req.body as Quote;
    const validationErrors = validateQuote(body);

    if (validationErrors.length > 0) {
        return res.status(400).send({
            status: "error",
            message: validationErrors.join("; ")
        });
    }

    try {
        const quotePost: Quote = {
            text: body.text,
            originator: body.originator.replace(/@/g, ""),
            creator: body.creator.replace(/@/g, ""),
            game: body.game,
            createdAt: moment().toISOString()
        };

        const newQuoteId = await QuoteManager.addQuote(quotePost);
        const newQuote = formatQuote(await QuoteManager.getQuote(newQuoteId));

        return res.status(201).send(newQuote);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error creating quote: ${e}`
        });
    }
};

export const putQuote = async function(req: Request, res: Response) {
    const quotePut = req.body as Quote;

    const quoteId = validateQuoteId(req.params.quoteId, res);
    if (!quoteId) {
        return;
    }

    // Make sure the new quote is valid
    const validationErrors = validateQuote(quotePut);

    if (validationErrors.length > 0) {
        return res.status(400).send({
            status: "error",
            message: validationErrors.join("; ")
        });
    }

    // Check for an existing quote with that ID
    let quote = await QuoteManager.getQuote(quoteId);

    // If no existing quote, create new
    if (quote == null) {
        const newQuote: Quote = {
            _id: quoteId,
            text: quotePut.text,
            originator: quotePut.originator.replace(/@/g, ""),
            creator: quotePut.creator.replace(/@/g, ""),
            game: quotePut.game
        };

        if (quotePut.createdAt && quotePut.createdAt != null && quotePut.createdAt !== "") {
            newQuote.createdAt = moment(quotePut.createdAt).toISOString();
        } else {
            newQuote.createdAt = moment().toISOString();
        }

        const newQuoteId = await QuoteManager.addQuote(newQuote);
        quote = await QuoteManager.getQuote(newQuoteId);

    // If existing quote ID, overwrite
    } else {
        quote.text = quotePut.text;
        quote.originator = quotePut.originator.replace(/@/g, "");
        quote.creator = quotePut.creator.replace(/@/g, "");
        quote.game = quotePut.game;

        if (quotePut.createdAt && quotePut.createdAt != null && quotePut.createdAt !== "") {
            quote.createdAt = moment(quotePut.createdAt).toISOString();
        }

        try {
            quote = await QuoteManager.updateQuote(quote);
        } catch (e) {
            return res.status(500).send({
                status: "error",
                message: `Error storing quote ${quoteId}: ${e}`
            });
        }
    }

    if (quote == null) {
        return res.status(500).send({
            status: "error",
            message: `Error storing quote ${quoteId}`
        });
    }

    return res.status(201).send(formatQuote(quote));
};

export const patchQuote = async function(req: Request, res: Response) {
    const quotePatch = req.body as Quote;

    const quoteId = validateQuoteId(req.params.quoteId, res);
    if (!quoteId) {
        return;
    }

    let quote = await QuoteManager.getQuote(quoteId);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${quoteId} not found`
        });
    }

    if (quotePatch.text?.length > 0) {
        quote.text = quotePatch.text;
    }

    if (quotePatch.originator?.length > 0) {
        quote.originator = quotePatch.originator.replace(/@/g, "");
    }

    if (quotePatch.creator?.length > 0) {
        quote.creator = quotePatch.creator.replace(/@/g, "");
    }

    if (quotePatch.game?.length > 0) {
        quote.game = quotePatch.game;
    }

    if (quotePatch.createdAt?.length > 0) {
        quote.createdAt = moment(quotePatch.createdAt).toISOString();
    }

    try {
        quote = await QuoteManager.updateQuote(quote);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error updating quote ${quoteId}: ${e}`
        });
    }

    return res.json(formatQuote(quote));
};

export const deleteQuote = async function(req: Request, res: Response) {
    const quoteId = validateQuoteId(req.params.quoteId, res);
    if (!quoteId) {
        return;
    }

    const quote = await QuoteManager.getQuote(quoteId);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${quoteId} not found`
        });
    }

    await QuoteManager.removeQuote(quoteId);

    return res.status(204).send();
};