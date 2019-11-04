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

function addQuote(quote) {
    return new Promise(async (resolve, reject) => {

        let newQuoteId = await getNextQuoteId();
        if (newQuoteId == null) {
            logger.error("Unable to add quote as we could not generate a new ID");
            return reject();
        }

        quote._id = newQuoteId;

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
    return new Promise(resolve => {
        db.remove({ _id: quoteId }, {}, function (err) {
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
            let quoteText = this.text;
            if (quoteText != null) {
                return this.text.indexOf(searchTerm) !== -1;
            }
            return false;
        }}, function (err, docs) {
            if (err) {
                logger.debug(err);
                return resolve(null);
            }
            let doc = docs[Math.floor(Math.random() * docs.length)];
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
                let skipCount = Math.floor(Math.random() * count);
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
    return new Promise((resolve) => {
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

exports.addQuote = addQuote;
exports.removeQuote = removeQuote;
exports.getQuote = getQuote;
exports.getRandomQuote = getRandomQuote;
exports.getRandomQuoteByWord = getRandomQuoteByWord;
exports.loadQuoteDatabase = loadQuoteDatabase;
exports.getAllQuotes = getAllQuotes;