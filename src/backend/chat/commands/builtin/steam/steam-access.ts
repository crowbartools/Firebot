import Fuse from "fuse.js";

import logger from "../../../../logwrapper";

interface SteamCacheItem {
    appid: number;
    name: string;
}

interface SteamAppList {
    applist: {
        apps: SteamCacheItem[]
    }
}

interface SteamAppDetails {
    name: string;
    short_description: string;
    price_overview: {
        currency: string;
        initial: number;
        final: number;
        discount_percent: number;
        initial_formatted: string;
        final_formatted: string;
    };
    metacritic: {
        score: number;
        url: string;
    };
    release_date: {
        coming_soon: boolean;
        date: string;
    };
}

interface SteamAppResponse {
    [appId: string]: {
        success: boolean;
        data?: Partial<SteamAppDetails>;
    };
}

interface FirebotSteamGameDetails {
    name: string;
    shortDescription?: string;
    price: string;
    score: number;
    releaseDate: string;
    url: string;
}

class SteamCacheManager {
    private _steamCache: SteamCacheItem[] = [];

    async cacheSteamLibrary(): Promise<boolean> {
        if (this._steamCache.length > 0) {
            logger.debug('Steam library is still cached. No need to pull again.');
            return false;
        }

        logger.debug('Refreshing Steam library cache');
        const url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/";
        try {
            const response = await (await fetch(url)).json() as SteamAppList;

            if (response?.applist?.apps != null) {
                this._steamCache = response.applist.apps;
                return true;
            }

            return false;
        } catch (error) {
            logger.error("Unable to get Steam library from Steam API.", error.message);
            return false;
        }
    }

    async getSteamGameDetails(requestedGame: string, defaultCurrency?: string) {
        const appId = await this.getAppIdFromSteamCache(requestedGame);
        if (appId == null) {
            logger.debug('Could not retrieve app id for Steam search.');
            return null;
        }

        const foundGame = await this.getSteamAppDetails(appId, defaultCurrency);
        if (foundGame == null) {
            logger.error("Unable to get game from Steam API.");
            return null;
        }

        const gameDetails: FirebotSteamGameDetails = {
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
    }

    private async getAppIdFromSteamCache(requestedGame: string): Promise<number> {
        // Try to cache library if we don't have one yet.
        if (this._steamCache.length === 0) {
            const cacheSuccess = await this.cacheSteamLibrary();

            if (!cacheSuccess) {
                return null;
            }
        }

        // Now, let's search the app list and get the closest result.
        const searchOptions = {
            keys: ['name'],
            id: 'appid'
        };
        const fuse = new Fuse(this._steamCache, searchOptions);

        const search = fuse.search(requestedGame);
        return search[0]?.item?.appid;
    }

    private async getSteamAppDetails(appId: number, defaultCurrency?: string): Promise<Partial<SteamAppDetails>> {
        let url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

        if (defaultCurrency != null && defaultCurrency !== "") {
            url = `${url}&currency=${defaultCurrency}`;
        }

        try {
            const response = await (await fetch(url)).json() as SteamAppResponse;

            if (response) {
                const appData = response[appId];

                if (appData?.success === true && appData?.data) {
                    return appData.data;
                }
            }

            return null;
        } catch (error) {
            logger.error("Unable to get app details from Steam API.", error.message);
            return null;
        }
    }
}

const steamCacheManager = new SteamCacheManager();

export = steamCacheManager;