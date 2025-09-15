"use strict";

const Datastore = require("@seald-io/nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const frontendCommunicator = require("../common/frontend-communicator");

const EventEmitter = require("events");

const regExpEscape = input => input.replace(/[$^|.*+?(){}\\[\]]/g, '\\$&');

/**
 * @type Datastore
 */
let db;

async function loadQuoteDatabase() {
    const path = profileManager.getPathInProfile("db/quotes.db");
    db = new Datastore({ filename: path });
    try {
        await db.loadDatabaseAsync();
    } catch (err) {
        logger.error("Error Loading Database: ", err.message);
        logger.debug("Failed Database Path: ", path);
    }
}

function getCurrentQuoteId() {
    return new Promise(resolve => {
        db.find({ _id: '__autoid__' },
            function (err, autoid) {
                if (err) {
                    resolve(null);
                }
                resolve(autoid[0].seq);
            }
        );
    });
}

function getNextQuoteId() {
    return new Promise(resolve => {
        db.update(
            { _id: '__autoid__' },
            { $inc: { seq: 1 } },
            { upsert: true, returnUpdatedDocs: true },
            function (err, _, autoid) {
                if (err) {
                    resolve(null);
                }
                resolve(autoid.seq);
            }
        );
    });
}

function setQuoteIdIncrementer(number) {
    return new Promise(resolve => {
        db.update(
            { _id: '__autoid__' },
            { $set: { seq: number } },
            { upsert: true, returnUpdatedDocs: true },
            function (err, _, autoid) {
                if (err) {
                    resolve(null);
                }
                resolve(autoid.seq);
            }
        );
    });
}

function addQuote(quote) {
    return new Promise(async (resolve, reject) => {
        // If no/invalid ID is specified, get the next one
        if (!quote._id || isNaN(quote._id)) {
            const newQuoteId = await getNextQuoteId();
            if (newQuoteId == null) {
                logger.error("Unable to add quote as we could not generate a new ID");
                return reject();
            }

            quote._id = newQuoteId;

        // Otherwise, use the ID passed in
        } else {
            // If the specified ID is higher than the next autoincrement,
            // set the autoincrement to the new ID
            const highestQuoteId = await getCurrentQuoteId();
            if (highestQuoteId < quote._id) {
                await setQuoteIdIncrementer(quote._id);
            }
        }

        db.insert(quote, err => {
            if (err) {
                logger.error("QuoteDB: Error adding quote: ", err.message);
                return reject();
            }
            exports.events.emit("created-item", { quote });
            frontendCommunicator.send("quotes-update");
            resolve(quote._id);
        });
    });
}

const addQuotes = (quotes) => {
    return new Promise(async (resolve, reject) => {
        quotes.forEach(async q => {
            const newQuoteId = await getNextQuoteId();

            if (newQuoteId == null) {
                logger.error("Unable to add quote as we could not generate a new ID");
                return reject();
            }

            q._id = newQuoteId;
        });

        db.insert(quotes, err => {
            if (err) {
                logger.error("QuoteDB: Error adding quotes: ", err.message);
                return reject();
            }

            for (const quote of quotes) {
                exports.events.emit("created-item", { quote });
            }

            frontendCommunicator.send("quotes-update");
            resolve();
        });
    });
};

function updateQuote(quote, dontSendUiUpdateEvent = false) {
    return new Promise(async (resolve, reject) => {

        db.update({ _id: quote._id }, quote, err => {
            if (err) {
                logger.error("QuoteDB: Error updating quote: ", err.message);
                return reject();
            }

            exports.events.emit("updated-item", { quote });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }
            resolve(quote);
        });
    });
}


function removeQuote(quoteId, dontSendUiUpdateEvent = false) {
    return new Promise(resolve => {
        db.remove({ _id: quoteId }, {}, function (err) {
            if (err) {
                logger.warn("Error while removing quote", err);
            }

            exports.events.emit("deleted-item", { quote: { _id: quoteId } });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }
            resolve();
        });
    });
}

function getQuote(quoteId) {
    return new Promise((resolve) => {
        db.findOne({ _id: quoteId }, (err, doc) => {
            if (err) {
                return resolve(null);
            }
            return resolve(doc);
        });
    });
}

function getRandomQuoteByDate(dateConfig) {
    let regex = "^";
    if (dateConfig.year) {
        regex += dateConfig.year.toString().length === 2 ?
            `20${dateConfig.year}-` :
            `${dateConfig.year}-`;
    } else {
        regex += '\\d{4}-';
    }

    regex += dateConfig.month < 10 ? `${dateConfig.month.toString().padStart(2, "0")}-` : `${dateConfig.month}-`;
    regex += dateConfig.day < 10 ? `${dateConfig.day.toString().padStart(2, "0")}` : `${dateConfig.day}`;
    regex += "T";

    const datePattern = new RegExp(regex);

    return new Promise(resolve => {
        db.find(
            {createdAt: { $regex: datePattern}},
            function (err, docs) {
                if (err || !docs.length) {
                    resolve(null);
                }
                const doc = docs[Math.floor(Math.random() * docs.length)];
                return resolve(doc);
            });
    });
}

function getRandomQuoteByAuthor(author) {
    return new Promise(resolve => {
        db.find({originator: { $regex: new RegExp(`^${regExpEscape(author)}$`, 'i')}},
            // result handler
            function (err, docs) {

                // error or no docs: resolve to no result
                if (err || !docs.length) {
                    resolve(null);
                }

                // get a random doc from the list
                const doc = docs[Math.floor(Math.random() * docs.length)];

                // return the chosen doc
                return resolve(doc);
            });
    });
}

function getRandomQuoteByGame(gameSearch) {
    const gamePattern = new RegExp(`${regExpEscape(gameSearch)}`, 'i');
    return new Promise(resolve => {
        db.find(
            {game: { $regex: gamePattern}},
            function (err, docs) {
                if (err || !docs.length) {
                    resolve(null);
                }
                const doc = docs[Math.floor(Math.random() * docs.length)];
                return resolve(doc);
            });
    });
}

// searches quotes list for entries containing the specified text and returns a random entry from the matched items
function getRandomQuoteContainingText(text) {

    // convert text query into a regex
    const textPattern = new RegExp(`\\b${regExpEscape(text)}\\b`, 'i');

    // return a promise that is resolved once the db returns a result
    return new Promise(resolve => {
        db.find(

            // search the field 'text' using the text
            {text: { $regex: textPattern}},

            // result handler
            function (err, docs) {

                // error or no docs: resolve to no result
                if (err || !docs.length) {
                    resolve(null);
                }

                // get a random doc from the list
                const doc = docs[Math.floor(Math.random() * docs.length)];

                // return the chosen doc
                return resolve(doc);
            });
    });
}

function getRandomQuote() {
    return new Promise((resolve) => {
        db.count({}, function (err, count) {
            // we minus one here because we filter out our auto inc id field below
            count = count - 1;
            if (!err && count > 0) {
                const skipCount = Math.floor(Math.random() * count);
                db.find({
                    $where: function () {
                        //filter out our auto inc id field
                        return this._id !== "__autoid__";
                    }})
                    .skip(skipCount)
                    .limit(1)
                    .exec(function (err2, docs) {
                        if (!err2) {
                            return resolve(docs[0]);
                        }
                        return resolve(null);
                    });
            }
        });
    });
}

function getAllQuotes() {
    return new Promise(resolve => {
        db.find({
            $where: function () {
                //filter out our auto inc id field
                return this._id !== "__autoid__";
            }}, function (err, docs) {
            if (err) {
                return resolve(null);
            }

            return resolve(docs);
        });
    });
}

function updateQuoteId(quote, newId) {
    return new Promise(async resolve => {

        if (quote._id === newId) {
            return resolve(true);
        }

        await removeQuote(quote._id, true);

        quote._id = newId;
        db.insert(quote, err => {
            if (err) {
                logger.error("QuoteDB: Error adding quote: ", err.message);
                return resolve(false);
            }

            exports.events.emit("created-item", { quote });

            resolve(true);
        });
    });
}

async function recalculateQuoteIds() {
    if (db == null) {
        return;
    }

    const quotes = await getAllQuotes();
    if (quotes == null) {
        return;
    }

    let idCounter = 1;
    for (const quote of quotes) {
        await updateQuoteId(quote, idCounter);
        idCounter++;
    }

    await setQuoteIdIncrementer(idCounter - 1);

    db.persistence.compactDatafile();

    frontendCommunicator.send("quotes-update");
}


frontendCommunicator.on("add-quote", quote => {
    addQuote(quote).catch(() => {});
});

frontendCommunicator.on("add-quotes", quotes => {
    addQuotes(quotes).catch(() => {});
});

frontendCommunicator.on("update-quote", quote => {
    updateQuote(quote, true).catch(() => {});
});

frontendCommunicator.on("delete-quote", quoteId => {
    removeQuote(quoteId, true).catch(() => {});
});

frontendCommunicator.onAsync("get-all-quotes", async () => {
    const quotes = await getAllQuotes();
    return quotes || [];
});

frontendCommunicator.on("recalc-quote-ids", () => {
    recalculateQuoteIds();
});

/**
 * @type {import("tiny-typed-emitter").TypedEmitter<{
*    "created-item": (item: unknown) => void;
*    "deleted-item": (item: unknown) => void;
*    "updated-item": (item: unknown) => void;
*  }>}
*/
exports.events = new EventEmitter();

exports.addQuote = addQuote;
exports.removeQuote = removeQuote;
exports.updateQuote = updateQuote;
exports.getQuote = getQuote;
exports.getRandomQuote = getRandomQuote;
exports.getRandomQuoteContainingText = getRandomQuoteContainingText;
exports.getRandomQuoteByAuthor = getRandomQuoteByAuthor;
exports.getRandomQuoteByDate = getRandomQuoteByDate;
exports.getRandomQuoteByGame = getRandomQuoteByGame;
exports.loadQuoteDatabase = loadQuoteDatabase;
exports.getAllQuotes = getAllQuotes;