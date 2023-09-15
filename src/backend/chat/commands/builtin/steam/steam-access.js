"use strict";

const axios = require("axios").default;
const logger = require("../../../../logwrapper");
const Fuse = require("fuse.js");

let steamCache = [];

const cacheSteamLibrary = async () => {
    if (steamCache.length > 0) {
        logger.debug('Steam library is still cached. No need to pull again.');
        return false;
    }

    logger.debug('Refreshing steam library cache.');
    const url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/";
    try {
        const response = (await axios.get(url)).data;

        if (response && response.applist && response.applist.apps) {
            steamCache = response.applist.apps;
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Unable to get steam library from steam API.", error.message);
        return false;
    }
};

const getAppIdFromSteamCache = async (requestedGame) => {
    // Try to cache library if we don't have one yet.
    if (steamCache.length === 0) {
        const cacheSuccess = await cacheSteamLibrary();

        if (!cacheSuccess) {
            return null;
        }
    }

    // Now, let's search the app list and get the closest result.
    const searchOptions = {
        keys: ['name'],
        id: 'appid'
    };
    const fuse = new Fuse(steamCache, searchOptions);

    const search = fuse.search(requestedGame);
    if (search.length > 0) {
        return search[0];
    }

    return null;
};

const getSteamAppDetails = async (appId) => {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

    try {
        const response = (await axios.get(url)).data;

        if (response) {
            const appData = response[appId];

            if (appData && appData.success && appData.data) {
                return appData.data;
            }
        }

        return null;
    } catch (error) {
        logger.error("Unable to get app details from steam API.", error.message);
        return null;
    }
};

const getSteamGameDetails = async (requestedGame) => {
    const appId = await getAppIdFromSteamCache(requestedGame);
    if (appId == null || appId === "") {
        logger.debug('Could not retrieve app id for steam search.');
        return null;
    }

    const foundGame = await getSteamAppDetails(appId);
    if (foundGame == null) {
        logger.error("Unable to get game from steam api.");
        return null;
    }

    const gameDetails = {
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

    if (foundGame.short_description) {
        gameDetails.shortDescription = foundGame.short_description;
    }

    return gameDetails;
};

exports.cacheSteamLibrary = cacheSteamLibrary;
exports.getSteamGameDetails = getSteamGameDetails;
