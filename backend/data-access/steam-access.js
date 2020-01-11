"use strict";

const request = require("request");
const logger = require("../logwrapper");
const Fuse = require("fuse.js");

let steamCache = [];

async function cacheSteamLibrary() {
    return new Promise(function(resolve, reject) {
        logger.debug('Should we refresh the steam library cache?');
        if (steamCache.length > 0) {
            logger.debug('Steam library is still cached. No need to pull again.');
            return resolve(false);
        }

        logger.debug('Refreshing steam library cache.');
        let steamAPI = "https://api.steampowered.com/ISteamApps/GetAppList/v0002/";
        request(steamAPI, async function(error, response, body) {
            if (!error && response.statusCode === 200) {
                steamCache = JSON.parse(body);
                return resolve(true);
            }

            logger.error("Unable to get steam library from steam API.");
            return resolve(false);
        });
    });
}

async function getAppIdFromSteamCache(requestedGame) {
    return new Promise(async function(resolve, reject) {
        // Try to cache library if we don't have one yet.
        if (steamCache.length === 0) {
            let cached = await cacheSteamLibrary();
            // If we get false, stop. This means something failed.
            if (cached === false) {
                return resolve(false);
            }
        }

        // Now, let's search the app list and get the closest result.
        let steamApps = steamCache["applist"]["apps"];
        let searchOptions = {
            keys: ['name'],
            id: 'appid'
        };
        let fuse = new Fuse(steamApps, searchOptions);
        let search = fuse.search(requestedGame);
        if (search.length > 0) {
            return resolve(search[0]);
        }

        return resolve(false);
    });
}

async function getSteamGameDetails(requestedGame) {
    return new Promise(async function(resolve, reject) {
        let appId = await getAppIdFromSteamCache(requestedGame);
        if (appId === false) {
            logger.debug('Could not retrieve app id for steam search.');
            return resolve(false);
        }

        let steamAPI = "https://store.steampowered.com/api/appdetails?appids=" + appId;
        request(steamAPI, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                body = JSON.parse(body);
                let foundGame = body[appId].data;
                let gameDetails = {
                    name: foundGame.name,
                    price: "N/A",
                    score: "N/A",
                    releaseDate: "N/A",
                    url: "https://store.steampowered.com/app/" + appId
                };

                // TODO: Sometimes these fields are included and sometimes not...
                // TODO: What is the best way to check these?

                if (foundGame.price_overview !== null) {
                    gameDetails.price = foundGame.price_overview.final_formatted;
                }

                if (foundGame.metacritic != null) {
                    gameDetails.score = foundGame.metacritic.score;
                }

                if (foundGame.release_date != null) {
                    gameDetails.releaseDate = foundGame.release_date.date;
                }

                return resolve(gameDetails);
            }

            logger.error("Unable to get steam library from steam API.");
            return resolve(false);
        });
    });
}

exports.cacheSteamLibrary = cacheSteamLibrary;
exports.getSteamGameDetails = getSteamGameDetails;
