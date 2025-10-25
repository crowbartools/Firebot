import { TypedEmitter } from "tiny-typed-emitter";

import type { FirebotAccount } from "../../types/accounts";

import { ProfileManager } from "./profile-manager";
import frontendCommunicator from "./frontend-communicator";
import logger from "../logwrapper";

type AccountType = "streamer" | "bot";

type AccountCache = {
    [accountType in AccountType]: FirebotAccount;
};

interface AccountAuthUpdateEvent {
    accountType: AccountType;
    account: FirebotAccount;
}

type Events = {
    "account-update": (cache: AccountCache) => void;
    "account-auth-update": (event: AccountAuthUpdateEvent) => void;
};

class AccountAccess extends TypedEmitter<Events> {
    private _cache: AccountCache = {
        streamer: {
            username: "Streamer",
            loggedIn: false
        },
        bot: {
            username: "Bot",
            loggedIn: false
        }
    };
    private _accountTokenIssueFlags: Partial<Record<AccountType, boolean>> = {};
    private _readyResolve: (value?: unknown) => void;

    readyPromise = new Promise((resolve) => {
        this._readyResolve = resolve;
    });

    constructor() {
        super();

        frontendCommunicator.on("accounts:get-accounts", () => {
            logger.debug("got 'get accounts' request");
            return this._cache;
        });

        frontendCommunicator.on("accounts:logout-account", (accountType: AccountType) => {
            logger.debug("got logout request for", accountType);
            this.removeAccount(accountType);
        });
    }

    getAccounts(): AccountCache {
        return this._cache;
    }

    streamerTokenIssue(): boolean {
        return this._accountTokenIssueFlags["streamer"];
    }

    botTokenIssue(): boolean {
        return this._accountTokenIssueFlags["bot"];
    }

    private sendAccountUpdate() {
        frontendCommunicator.send("accounts:account-update", this._cache);
        this.emit("account-update", this._cache);
    }

    private sendAccountAuthUpdate(accountType: AccountType) {
        this.emit(`account-auth-update`, {
            accountType,
            account: this._cache[accountType]
        });
    }

    /**
     * Updates a streamer account object with various settings
     */
    updateStreamerAccountSettings(streamerAccount: FirebotAccount): FirebotAccount {
        if (streamerAccount == null || streamerAccount.channelId == null) {
            return null;
        }

        return streamerAccount;
    }

    private saveAccountDataToFile(accountType: AccountType) {
        const authDb = ProfileManager.getJsonDbInProfile("/auth-twitch");
        const account = this._cache[accountType];
        try {
            authDb.push(`/${accountType}`, account);
        } catch (error) {
            if ((error as Error).name === 'DatabaseError') {
                logger.error(`Error saving ${accountType} account settings`, error);
            }
        }
    }

    /**
     * Loads account data from file into memory
     * @param emitUpdate If an account update event should be emitted
     */
    loadAccountData(emitUpdate = true) {
        const authDb = ProfileManager.getJsonDbInProfile("/auth-twitch");
        try {
            const dbData = authDb.getData("/") as AccountCache,
                streamer = dbData.streamer,
                bot = dbData.bot;

            if (streamer != null && streamer.auth != null) {
                streamer.loggedIn = true;

                const updatedStreamer = this.updateStreamerAccountSettings(streamer);
                if (updatedStreamer != null) {
                    this._cache.streamer = updatedStreamer;
                    this.saveAccountDataToFile("streamer");
                } else {
                    this._cache.streamer = streamer;
                }
            }

            if (bot != null && bot.auth != null) {
                bot.loggedIn = true;
                this._cache.bot = bot;
            }
        } catch {
            logger.warn("Couldn't update auth cache");
        }

        if (emitUpdate) {
            this.sendAccountUpdate();
        }

        if (this._readyResolve) {
            this._readyResolve();
            this._readyResolve = null;
        }
    }
    /**
     * Update and save data for an account
     * @param accountType The type of account
     * @param account The account
     */
    updateAccount(
        accountType: AccountType,
        account: FirebotAccount,
        emitGeneralUpdate = true,
        emitAuthUpdateEvent = false
    ): void {
        if ((accountType !== "streamer" && accountType !== "bot") || account == null) {
            return;
        }

        // reset token issue flag
        this._accountTokenIssueFlags[accountType] = false;

        // don't let streamer and bot be the same
        const otherAccount = accountType === "streamer"
            ? this._cache.bot
            : this._cache.streamer;

        if (otherAccount != null && otherAccount.loggedIn) {
            if (otherAccount.userId === account.userId) {
                frontendCommunicator.send("error", "You cannot sign into the same user for both Streamer and Bot accounts. The bot account should be a separate Twitch user. If you don't have a separate user, simply don't use the Bot account feature as it is not required.");
                return;
            }
        }

        account.loggedIn = true;

        this._cache[accountType] = account;

        this.saveAccountDataToFile(accountType);

        if (emitGeneralUpdate) {
            this.sendAccountUpdate();
        }

        if (emitAuthUpdateEvent) {
            this.sendAccountAuthUpdate(accountType);
        }
    }

    removeAccount(accountType: AccountType): void {
        if (accountType !== "streamer" && accountType !== "bot") {
            return;
        }

        const authDb = ProfileManager.getJsonDbInProfile("/auth-twitch");
        try {
            authDb.delete(`/${accountType}`);
        } catch (error) {
            if ((error as Error).name === 'DatabaseError') {
                logger.error(`Error removing ${accountType} account settings`, error);
            }
        }

        this._cache[accountType] = {
            username: accountType === "streamer" ? "Streamer" : "Bot",
            loggedIn: false
        };
        this.sendAccountUpdate();
    }

    setAccountTokenIssue(accountType: AccountType) {
        if (accountType === "streamer" || accountType === "bot") {
            this._accountTokenIssueFlags[accountType] = true;
        } else {
            throw new Error("invalid account type");
        }

        frontendCommunicator.send("accounts:invalidate-accounts", {
            streamer: this.streamerTokenIssue(),
            bot: this.botTokenIssue()
        });
    }
}

const accountAccess = new AccountAccess();

export { accountAccess as AccountAccess };