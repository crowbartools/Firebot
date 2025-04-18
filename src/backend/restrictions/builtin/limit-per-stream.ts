import { Trigger } from "../../../types/triggers";
import { RestrictionType } from "../../../types/restrictions";
import accountAccess from "../../common/account-access";
import connectionManager from "../../common/connection-manager";
import frontendCommunicator from "../../common/frontend-communicator";

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

function getCommandKey(trigger: Trigger, inherited: boolean) {
    const commandId = trigger.metadata.command?.id;
    const subcommandId = trigger.metadata.userCommand?.subcommandId;
    if (inherited || !subcommandId) {
        return commandId;
    }
    return `${commandId}::${subcommandId}`;
}

function getUsages(commandKey: string): CommandUsages {
    const usages = usageCache[commandKey];

    return usages ?? { globalUsages: 0, perUserUsages: {} };
}

function incrementUsages(commandKey: string, userKey: string) {
    const usages = getUsages(commandKey);

    usages.globalUsages += 1;
    usages.perUserUsages[userKey] = (usages.perUserUsages[userKey] ?? 0) + 1;

    usageCache[commandKey] = usages;
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
    predicate: async (triggerData, restrictionData, inherited) => {
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

            const usages = getUsages(getCommandKey(triggerData, inherited));

            if (globalLimit && usages.globalUsages >= globalLimit) {
                return reject("Global per-stream limit reached.");
            }

            if (perUserLimit && (usages.perUserUsages[username] ?? 0) >= perUserLimit) {
                return reject("You reached your per-stream limit.");
            }

            return resolve(true);
        });
    },
    onSuccessful: async (triggerData, _, inherited) => {
        const commandId = triggerData.metadata.command?.id;
        if (!commandId) {
            return;
        }

        const username = triggerData.metadata.username;
        if (!username) {
            return;
        }

        incrementUsages(getCommandKey(triggerData, inherited), username);
    }
};

frontendCommunicator.on("reset-all-per-stream-command-usages", () => {
    usageCache = {};
});

frontendCommunicator.on("reset-per-stream-usages-for-command", (commandId: string) => {
    if (!commandId) {
        return;
    }
    // remove all usages for base command and subcommands
    const commandKeys = Object.keys(usageCache).filter(key => key.startsWith(commandId));
    commandKeys.forEach(key => delete usageCache[key]);
});

module.exports = limitPerStreamRestriction;