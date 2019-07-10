"use strict";

const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");

let db;

function loadQuoteDatabase() {
    let path = profileManager.getPathInProfile("db/quotes.db");
    db = new Datastore({ filename: path });
    db.loadDatabase(err => {
        if (err) {
            logger.error("Error Loading Database: ", err.message);
            logger.debug("Failed Database Path: ", path);
        }
    });
}

function getNextQuoteId() {
    return new Promise((resolve, reject) => {

        db.update(
            { _id: '__autoid__' },
            { $inc: { seq: 1 } },
            { upsert: true, returnUpdatedDocs: true },
            function (err, affected, autoid) {
                if (err) {
                    resolve(null);
                }
                resolve(autoid.seq);
            }
        );

        /*db.count({}, function (err, count) {
            if (err) {
                resolve(null);
            } else {
                resolve(count + 1);
            }
        });*/
    });
}

function addQuote(quote) {
    return new Promise(async (resolve, reject) => {

        let newQuoteId = await getNextQuoteId();
        if (newQuoteId == null) {
            logger.error("Unable to add quote as we could not generate a new ID");
            return reject();
        }

        //should we have both? or just the first
        quote._id = newQuoteId;
        quote.id = newQuoteId;

        db.insert(quote, err => {
            if (err) {
                logger.error("QuoteDB: Error adding quote: ", err.message);
                return reject();
            }

            resolve(newQuoteId);
        });
    });
}

function removeQuote(quoteId) {
    return new Promise((resolve, reject) => {
        db.remove({ _id: quoteId }, {}, function (err, numRemoved) {
            if (err) {
                logger.warn("Error while removing quote", err);
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

function getRandomQuoteByWord(searchTerm) {
    return new Promise((resolve) => {
        db.find({ $where: function () {
            return this.text.indexOf(searchTerm) !== -1;
        }}, function (err, docs) {
            if (err) {
                return resolve(false);
            }

            let doc = docs[Math.floor(Math.random() * docs.length)];
            return resolve(doc);
        });
    });
}

function getRandomQuote() {
    return new Promise((resolve) => {
        db.count({}, function (err, count) {
            count = count - 1;
            if (!err && count > 0) {
                let skipCount = Math.floor(Math.random() * count);
                db.find({
                    $where: function () {
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

exports.addQuote = addQuote;
exports.removeQuote = removeQuote;
exports.getQuote = getQuote;
exports.getRandomQuote = getRandomQuote;
exports.getRandomQuoteByWord = getRandomQuoteByWord;
exports.loadQuoteDatabase = loadQuoteDatabase;