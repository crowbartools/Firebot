import * as commandList from "./sync-handlers/command-list";
import * as quoteList from "./sync-handlers/quotes-list";
import { AccountAccess } from "../common/account-access";
import { SettingsManager } from "../common/settings-manager";
import rankManager from "../ranks/rank-manager";
import { ReplaceVariableManager } from "../variables/replace-variable-manager";
import { SortTagManager } from "../sort-tags/sort-tag-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

interface ProfileSyncData {
    username: string;
    userRoles: string[];
    profilePage: "commands" | "quotes";
}

export async function sync<T = unknown>(jsonData: T): Promise<string> {
    const streamer = AccountAccess.getAccounts().streamer;

    if (!streamer?.loggedIn) {
        return null;
    }

    try {
        const response = await fetch(`https://api.crowbar.tools/v1/data-bin`, {
            method: "POST",
            body: JSON.stringify(jsonData),
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Authorization': `Bearer ${streamer.auth.access_token}`
            }
        });

        if (response?.ok) {
            const data = await response.json() as { key: string };
            logger.debug(`DataBin key: ${data.key}`);
            return data.key;
        } else if (response?.status === 429) {
            logger.error('DataBin rate limit exceeded.');
            frontendCommunicator.send(
                "error",
                "DataBin rate limit exceeded."
            );
        }
    } catch (error) {
        logger.error('DataBin sync failed.', (error as Error).message);
    }

    return null;
};

export async function getData<T = unknown>(shareCode: string): Promise<T> {
    try {
        const response = await fetch(`https://api.crowbar.tools/v1/data-bin/${shareCode}`, {
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app'
            }
        });

        if (response?.ok) {
            return await response.json() as T;
        }
    } catch { }

    return null;
};

export async function syncProfileData(profileSyncData: ProfileSyncData): Promise<string> {
    const streamer = AccountAccess.getAccounts().streamer;

    if (!streamer?.loggedIn) {
        return null;
    }

    const commands = commandList.getCommandListForSync();
    const quotes = await quoteList.getQuoteListForSync();

    const completeSyncJSON: Record<string, unknown> = {
        "owner": streamer.username,
        "chatter": profileSyncData.username,
        "profilePage": profileSyncData.profilePage,
        "commands": commands,
        "sortTags": SortTagManager.getSortTagsForContext("commands"),
        "variables": ReplaceVariableManager.getReplaceVariables().map(v => v.definition),
        "ranks": rankManager.getAllItems(),
        "quotes": quotes,
        "allowQuoteCSVDownloads": SettingsManager.getSetting("AllowQuoteCSVDownloads")
    };

    try {
        const response = await fetch("https://api.crowbar.tools/v1/profile-data/", {
            method: "PUT",
            body: JSON.stringify(completeSyncJSON),
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${streamer.auth.access_token}`
            }
        });

        if (response?.ok) {
            return streamer.username;
        } else if (response?.status === 429) {
            logger.error('DataBin rate limit exceeded.');
            frontendCommunicator.send(
                "error",
                "DataBin rate limit exceeded."
            );
        }

        logger.error('DataBin sync failed.', await response.json());
    } catch (error) {
        logger.error('DataBin sync failed.', (error as Error).message);
    }

    return streamer.username;
}

frontendCommunicator.onAsync("sync-profile-data-to-crowbar-api", () => {
    return syncProfileData({
        username: undefined,
        userRoles: [],
        profilePage: "commands"
    });
});