import { RestrictionType } from "../../../types/restrictions";
import accountAccess from "../../common/account-access";
import connectionManager from "../../common/connection-manager";

type RestrictionData = {
    perUserLimit?: number;
    globalLimit?: number;
}

type CommandUsages = {
    globalUsages: number;
    perUserUsages: Record<string, number>;
}

let usageCache: Record<string, CommandUsages> = {};

// clear cache when stream changes
connectionManager.on("streamerOnlineChange", () => {
    usageCache = {};
});

function getUsages(commandId: string): CommandUsages {
    const usages = usageCache[commandId];

    return usages ?? { globalUsages: 0, perUserUsages: {} };
}

function incrementUsages(commandId: string, userId: string) {
    const usages = getUsages(commandId);

    usages.globalUsages += 1;
    usages.perUserUsages[userId] = (usages.perUserUsages[userId] ?? 0) + 1;

    usageCache[commandId] = usages;
}

const limitPerStreamRestriction: RestrictionType<RestrictionData> = {
    definition: {
        id: "limit-per-stream",
        name: "Limit Per Stream",
        description: "Limit the number of times a command can be used in a stream.",
        triggers: ["command"]
    },
    optionsTemplate: `
        <div>
            <div class="modal-subheader" style="padding: 0 0 4px 0">
                Global Limit
            </div>
            <firebot-input
              placeholder-text="Enter number"
              input-type="number"
              disable-variables="true"
              model="restriction.globalLimit"
            />
            <div class="modal-subheader" style="padding: 0 0 4px 0; margin-top: 8px">
                Per User Limit
            </div>
            <firebot-input
              placeholder-text="Enter number"
              input-type="number"
              disable-variables="true"
              model="restriction.perUserLimit"
            />
        </div>
    `,
    optionsValueDisplay: (restriction) => {
        const limits: string[] = [];
        if (restriction.perUserLimit) {
            limits.push(`Per User: ${restriction.perUserLimit}`);
        }
        if (restriction.globalLimit) {
            limits.push(`Global: ${restriction.globalLimit}`);
        }
        if (limits.length === 0) {
            return "No Limits Set";
        }
        return limits.join(", ");
    },
    predicate: async (triggerData, restrictionData) => {
        return new Promise((resolve, reject) => {
            const streamer = accountAccess.getAccounts().streamer;

            if (!streamer.loggedIn) {
                return reject("Streamer account is not logged in.");
            }

            const username = triggerData.metadata.username;
            if (!username) {
                return reject("Trigger data does not have a username.");
            }

            const commandId = triggerData.metadata.command?.id;
            if (!commandId) {
                return reject("Only command triggers are supported.");
            }

            const isOnline = connectionManager.streamerIsOnline();

            if (!isOnline) {
                return reject("Streamer is not live.");
            }

            const { perUserLimit, globalLimit } = restrictionData;

            const usages = getUsages(commandId);

            if (globalLimit && usages.globalUsages >= globalLimit) {
                return reject("Global per stream limit reached.");
            }

            if (perUserLimit && (usages.perUserUsages[username] ?? 0) >= perUserLimit) {
                return reject("You reached your per stream limit.");
            }

            return resolve(true);
        });
    },
    onSuccessful: async (triggerData) => {
        const commandId = triggerData.metadata.command?.id;
        if (!commandId) {
            return;
        }

        const username = triggerData.metadata.username;
        if (!username) {
            return;
        }

        incrementUsages(commandId, username);
    }
};

module.exports = limitPerStreamRestriction;