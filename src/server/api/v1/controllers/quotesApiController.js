"use strict";

const quotesManager = require("../../../../backend/quotes/quotes-manager");
const moment = require("moment");

function validateQuoteId(quoteId, res) {
    if (quoteId == null) {
        res.status(400).send({
            status: "error",
            message: "No quoteId provided"
        });
        return false;
    }

    quoteId = parseInt(quoteId);
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
function formatQuote(quote) {
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
function validateQuote(quote) {
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

exports.getQuotes = async function(req, res) {
    const quotes = await quotesManager.getAllQuotes();

    const formattedQuotes = quotes.map(q => {
        return formatQuote(q);
    });

    res.json(formattedQuotes);
};

exports.getQuote = async function(req, res) {
    let { quoteId } = req.params;

    quoteId = validateQuoteId(quoteId, res);
    if (!quoteId) {
        return;
    }

    const quote = await quotesManager.getQuote(quoteId);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${quoteId} not found`
        });
    }

    res.json(formatQuote(quote));
};

exports.postQuote = async function(req, res) {
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
};

exports.putQuote = async function(req, res) {
    let { quoteId } = req.params;
    const quotePut = req.body;

    quoteId = validateQuoteId(quoteId, res);
    if (!quoteId) {
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
    let quote = await quotesManager.getQuote(quoteId);

    // If no existing quote, create new
    if (quote == null) {
        const newQuote = {
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

exports.patchQuote = async function(req, res) {
    let { quoteId } = req.params;
    const quotePatch = req.body;

    quoteId = validateQuoteId(quoteId, res);
    if (!quoteId) {
        return;
    }

    let quote = await quotesManager.getQuote(quoteId);

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
        quote = await quotesManager.updateQuote(quote);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error updating quote ${quoteId}: ${e}`
        });
    }

    return res.json(formatQuote(quote));
};

exports.deleteQuote = async function(req, res) {
    let { quoteId } = req.params;

    quoteId = validateQuoteId(quoteId, res);
    if (!quoteId) {
        return;
    }

    const quote = await quotesManager.getQuote(quoteId);

    if (quote == null) {
        return res.status(404).send({
            status: "error",
            message: `Quote ${quoteId} not found`
        });
    }

    await quotesManager.removeQuote(quoteId);

    return res.status(204).send();
};