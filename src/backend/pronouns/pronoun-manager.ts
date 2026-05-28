import { app } from "electron";
import NodeCache from "node-cache";

import { Pronoun, UserPronoun } from "../../types";

import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

const PRONOUN_SERVICE_BASE_URL = "https://api.pronouns.alejo.io/v1/";

type UserPronounResponse = {
    channel_id: string;
    channel_login: string;
    pronoun_id: string;
    alt_pronoun_id?: string;
};

class FirebotPronounManager {
    private _appVersion = app.getVersion();
    private _pronounCache: Record<string, Pronoun> = { };
    private _userPronounCache = new NodeCache({
        stdTTL: 15 * 60
    });
    private _userNoPronounCache = new NodeCache({
        stdTTL: 15 * 60
    });

    constructor() {
        frontendCommunicator.onAsync("pronouns:get-user-pronouns", this.getUserPronouns);
    }

    private async callUrl(url: string): Promise<Response> {
        return await fetch(url, {
            headers: {
                "User-Agent": `Firebot/${this._appVersion}`
            }
        });
    }

    async cachePronouns(): Promise<void> {
        const url = `${PRONOUN_SERVICE_BASE_URL}pronouns`;

        try {
            const response = await this.callUrl(url);

            if (response.ok) {
                this._pronounCache = await response.json() as Record<string, Pronoun>;
            }
        } catch (error) {
            logger.error("Unable to cache pronoun definitions", error);
        }
    }

    async getUserPronouns(username: string, fallback: string = "they/them"): Promise<UserPronoun | undefined> {
        if (!!username?.length) {
            const cachedPronouns =  this._userPronounCache.get<UserPronoun>(username);

            if (cachedPronouns) {
                return cachedPronouns;
            } else if (this._userNoPronounCache[username] === true) {
                return;
            }

            const url = `${PRONOUN_SERVICE_BASE_URL}users/${username}?t=${new Date().getTime()}`;

            try {
                const response = await this.callUrl(url);

                if (response.ok) {
                    const pronouns = await response.json() as UserPronounResponse;
                    this._userPronounCache.set<UserPronoun>(username, {
                        primary: pronouns.pronoun_id,
                        secondary: pronouns.alt_pronoun_id
                    });
                    return this._userPronounCache.get<UserPronoun>(username);
                } else if (response.status === 404) {
                    logger.debug(`No pronouns set for ${username}`);
                    this._userNoPronounCache.set(username, true);
                }
            } catch (error) {
                logger.warn(`Unable to get pronouns for ${username}`, error);
            }
        }

        return !!fallback?.length
            ? { primary: fallback.replace("/", "") }
            : undefined;
    };

    async getUserFriendlyPronounString(username: string, fallback: string = "they/them", type: "subject" | "object" | "both" = "both") {
        const pronouns = await this.getUserPronouns(username, fallback);

        if (pronouns) {
            return this.getFriendlyPronounString(pronouns.primary, pronouns.secondary, type);
        }
    }

    getFriendlyPronounString(primary: string, secondary: string | undefined, type: "subject" | "object" | "both" = "both"): string | undefined {
        const primaryPronoun = this._pronounCache[primary];
        const secondaryPronoun = secondary?.length
            ? this._pronounCache[secondary]
            : undefined;

        if (primaryPronoun) {
            switch (type) {
                case "subject":
                    return primaryPronoun.subject;

                case "object":
                    return primaryPronoun.object;

                default:
                    if (primaryPronoun.singular === true && secondaryPronoun == null) {
                        return primaryPronoun.subject;
                    }

                    return `${primaryPronoun.subject}/${secondaryPronoun ? secondaryPronoun.subject : primaryPronoun.object}`;
            }
        }

        return;
    }
}

const pronounManager = new FirebotPronounManager();

export { pronounManager as FirebotPronounManager };