import { AccountAccess } from "../../../../common/account-access";
import logger from "../../../../logwrapper";

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

class SteamManager {
    async getSteamGameDetails(requestedGame: string, countryCode?: string) {
        const appId = await this.getAppIdFromGameName(requestedGame);
        if (appId == null) {
            logger.debug('Could not retrieve app id for Steam search.');
            return null;
        }

        const foundGame = await this.getSteamAppDetails(appId, countryCode);
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

    private async getAppIdFromGameName(gameName: string): Promise<number> {
        const streamer = AccountAccess.getAccounts().streamer;

        if (!streamer?.loggedIn) {
            return null;
        }
        try {
            const response = await fetch(`https://api.crowbar.tools/v1/steam/find-app-id?search=${encodeURIComponent(gameName)}`, {
                method: "GET",
                headers: {
                    'User-Agent': 'Firebot V5 - https://firebot.app',
                    'Authorization': `Bearer ${streamer.auth.access_token}`
                }
            });

            if (response?.ok) {
                const data = await response.json() as { appId: number | null };
                return data.appId;
            }
        } catch (error) {
            logger.error('Steam app ID fetch failed.', (error as Error).message);
        }

        return null;
    }

    private async getSteamAppDetails(appId: number, countryCode?: string): Promise<Partial<SteamAppDetails>> {
        let url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

        if (countryCode != null && countryCode !== "") {
            url = `${url}&cc=${countryCode}`;
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

const steamCacheManager = new SteamManager();

export = steamCacheManager;