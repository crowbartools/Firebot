import quotesManager from "../../../../backend/quotes/quotes-manager";
import moment from "moment";
import { Request, Response } from "express";
// Adding this here cause I'm not sure if it needs to be in the type def or not.
type Quote = {
    _id: string;
    text: string;
    originator: string;
    creator: string;
    game: string;
    createdAt: string;
}

function validateQuoteId(quoteId: string | number, res: Response) {
    if (quoteId == null) {
        res.status(400).send({
            status: "error",
            message: "No quoteId provided"
        });
        return false;
    }

    quoteId = parseInt(quoteId.toString());
    if (isNaN(quoteId)) {
        res.status(400).send({
            status: "error",
            message: "Invalid quoteId provided"
        });
        return false;
    }

    return quoteId;
}

// Formats a quote for API output
function formatQuote(quote: Quote) {
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
function validateQuote(quote: { text?: string; creator?: string; }) {
    quote = quote ?? {};
    const validationErrors = [];

    if (!(quote.text?.length > 0)) {
        validationErrors.push("Missing quote text");
    }

    if (!(quote.creator?.length > 0)) {
        validationErrors.push("Missing quote creator");
    }

    return validationErrors;
}

export async function getQuotes(req: Request, res: Response): Promise<Response> {
    const quotes = await quotesManager.getAllQuotes();

    const formattedQuotes = quotes.map((q:Quote) => {
        return formatQuote(q);
    });

    return res.json(formattedQuotes);
}

export async function getQuote(req: Request, res: Response): Promise<Response> {
    const { quoteId } = req.params;

    const id = validateQuoteId(quoteId, res);
    if (!id) {
        return;
    }

    const quote = await quotesManager.getQuote(id);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${id} not found`
        });
    }

    return res.json(formatQuote(quote));
}

export async function postQuote(req: Request, res: Response): Promise<Response> {
    // Make sure the new quote is valid
    const validationErrors = validateQuote(req.body);

    if (validationErrors.length > 0) {
        return res.status(400).send({
            status: "error",
            message: validationErrors.join("; ")
        });
    }

    try {
        const quotePost = {
            text: req.body.text,
            originator: req.body.originator.replace(/@/g, ""),
            creator: req.body.creator.replace(/@/g, ""),
            game: req.body.game,
            createdAt: moment().toISOString()
        };

        const newQuoteId = await quotesManager.addQuote(quotePost);
        const newQuote = formatQuote(await quotesManager.getQuote(newQuoteId));

        return res.status(201).send(newQuote);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error creating quote: ${e}`
        });
    }
}

export async function putQuote(req: Request, res: Response): Promise<Response> {
    const { quoteId } = req.params;
    const quotePut = req.body;

    const id = validateQuoteId(quoteId, res);
    if (!id) {
        return;
    }

    // Make sure the new quote is valid
    const validationErrors = validateQuote(req.body);

    if (validationErrors.length > 0) {
        return res.status(400).send({
            status: "error",
            message: validationErrors.join("; ")
        });
    }

    // Check for an existing quote with that ID
    let quote = await quotesManager.getQuote(id);

    // If no existing quote, create new
    if (quote == null) {
        const newQuote = {
            _id: id,
            text: quotePut.text,
            originator: quotePut.originator.replace(/@/g, ""),
            creator: quotePut.creator.replace(/@/g, ""),
            game: quotePut.game,
            createdAt: ""
        };

        if (quotePut.createdAt && quotePut.createdAt != null && quotePut.createdAt !== "") {
            newQuote.createdAt = moment(quotePut.createdAt).toISOString();
        } else {
            newQuote.createdAt = moment().toISOString();
        }

        const newQuoteId = await quotesManager.addQuote(newQuote);
        quote = await quotesManager.getQuote(newQuoteId);

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
            quote = await quotesManager.updateQuote(quote);
        } catch (e) {
            return res.status(500).send({
                status: "error",
                message: `Error storing quote ${id}: ${e}`
            });
        }
    }

    if (quote == null) {
        return res.status(500).send({
            status: "error",
            message: `Error storing quote ${id}`
        });
    }

    return res.status(201).send(formatQuote(quote));
}

export async function patchQuote(req: Request, res: Response): Promise<Response> {
    const { quoteId } = req.params;
    const quotePatch = req.body;

    const id = validateQuoteId(quoteId, res);
    if (!id) {
        return;
    }

    let quote = await quotesManager.getQuote(id);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${id} not found`
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
        quote = await quotesManager.updateQuote(quote);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error updating quote ${id}: ${e}`
        });
    }

    return res.status(201).json(formatQuote(quote));
}

export async function deleteQuote(req: Request, res: Response): Promise<Response> {
    const { quoteId } = req.params;

    const id = validateQuoteId(quoteId, res);
    if (!id) {
        return;
    }

    const quote = await quotesManager.getQuote(id);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${id} not found`
        });
    }

    await quotesManager.removeQuote(id);

    return res.status(204).send();
}