"use strict";

const request = require("request");
const logger = require("../../../../logwrapper");
const Fuse = require("fuse.js");

let steamCache = [];

function cacheSteamLibrary() {
    return new Promise(resolve => {

        if (steamCache.length > 0) {
            logger.debug('Steam library is still cached. No need to pull again.');
            return resolve(true);
        }

        logger.debug('Refreshing steam library cache.');
        let appListUrl = "https://api.steampowered.com/ISteamApps/GetAppList/v0002/";
        request(appListUrl, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                let parsedBody = JSON.parse(body);
                if (parsedBody && parsedBody.applist && parsedBody.applist.apps) {
                    steamCache = parsedBody.applist.apps;
                }
                return resolve(true);
            }

            logger.error("Unable to get steam library from steam API.");
            return resolve(false);
        });
    });
}

async function getAppIdFromSteamCache(requestedGame) {
    // Try to cache library if we don't have one yet.
    if (steamCache.length === 0) {
        let cacheSuccess = await cacheSteamLibrary();
        if (!cacheSuccess) {
            return null;
        }
    }

    // Now, let's search the app list and get the closest result.
    let searchOptions = {
        keys: ['name'],
        id: 'appid'
    };
    let fuse = new Fuse(steamCache, searchOptions);

    let search = fuse.search(requestedGame);
    if (search.length > 0) {
        return search[0];
    }

    return null;
}

function getSteamAppDetails(appId) {
    return new Promise(resolve => {
        const appDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

        request(appDetailsUrl, function(error, response, body) {
            if (!error && response.statusCode === 200 && body) {
                let parsedBody = JSON.parse(body);
                if (parsedBody) {
                    let appData = parsedBody[appId];
                    if (appData && appData.success && appData.data) {
                        return resolve(appData.data);
                    }
                }
            }
            resolve(null);
        });
    });
}


async function getSteamGameDetails(requestedGame) {

    let appId = await getAppIdFromSteamCache(requestedGame);
    if (appId == null || appId === "") {
        logger.debug('Could not retrieve app id for steam search.');
        return null;
    }

    const foundGame = await getSteamAppDetails(appId);

    if (foundGame == null) {
        logger.error("Unable to get game from steam api.");
        return null;
    }

    let gameDetails = {
        name: foundGame.name || "Unknown Name",
        price: null,
        score: null,
        releaseDate: null,
        url: `https://store.steampowered.com/app/${appId}`
    };

    if (foundGame.price_overview) {
        gameDetails.price = foundGame.price_overview.final_formatted;
    }

    if (foundGame.metacritic) {
        gameDetails.score = foundGame.metacritic.score;
    }

    if (foundGame.release_date) {
        gameDetails.releaseDate = foundGame.release_date.date;
    }

    return gameDetails;
}

exports.cacheSteamLibrary = cacheSteamLibrary;
exports.getSteamGameDetails = getSteamGameDetails;
