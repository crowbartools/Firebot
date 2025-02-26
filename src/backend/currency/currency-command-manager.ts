import { SystemCommand } from "../../types/commands";
import currencyAccess, { Currency } from "./currency-access";
import currencyManager from "./currency-manager";
import commandManager from "../chat/commands/command-manager";
import viewerDatabase from "../viewers/viewer-database";
import logger from "../logwrapper";
import util from "../utility";

type CurrencyCommandRefreshRequestAction = "create" | "update" | "delete";

class CurrencyCommandManager {
    constructor() {
        currencyAccess.on("currencies:currency-created", (currency: Currency) => {
            this.refreshCurrencyCommands("create", currency);
        });

        currencyAccess.on("currencies:currency-updated", (currency: Currency) => {
            this.refreshCurrencyCommands("update", currency);
        });

        currencyAccess.on("currencies:currency-deleted", (currency: Currency) => {
            this.refreshCurrencyCommands("delete", currency);
        });
    }

    /**
     * Creates a command definition when given a currency name.
     */
    createCurrencyCommandDefinition(currency: Partial<Currency>): SystemCommand<{
        currencyBalanceMessageTemplate: string;
        whisperCurrencyBalanceMessage: boolean;
        addMessageTemplate: string;
        setMessageTemplate: string;
        removeMessageTemplate: string;
        addAllMessageTemplate: string;
        removeAllMessageTemplate: string;
    }> {
        const currencyId = currency.id,
            currencyName = currency.name,
            cleanName = currencyName.replace(/\s+/g, '-').toLowerCase(); // lowecase and replace spaces with dash.

        // Define our command.
        const commandManagement: SystemCommand<{
            currencyBalanceMessageTemplate: string;
            whisperCurrencyBalanceMessage: boolean;
            addMessageTemplate: string;
            setMessageTemplate: string;
            removeMessageTemplate: string;
            addAllMessageTemplate: string;
            removeAllMessageTemplate: string;
        }> = {
            definition: {
                id: `firebot:currency:${currencyId}`,
                name: `${currencyName} Management`,
                active: true,
                trigger: `!${cleanName}`,
                description: `Allows management of the "${currencyName}" currency`,
                autoDeleteTrigger: false,
                scanWholeMessage: false,
                currency: {
                    name: currencyName,
                    id: currencyId
                },
                cooldown: {
                    user: 0,
                    global: 0
                },
                baseCommandDescription: "See your balance",
                options: {
                    currencyBalanceMessageTemplate: {
                        type: "string",
                        title: "Currency Balance Message Template",
                        description: "How the currency balance message appears in chat.",
                        tip: "Variables: {user}, {currency}, {amount}",
                        default: `{user}'s {currency} total is {amount}`,
                        useTextArea: true
                    },
                    whisperCurrencyBalanceMessage: {
                        type: "boolean",
                        title: "Whisper Currency Balance Message",
                        default: false
                    },
                    addMessageTemplate: {
                        type: "string",
                        title: "Add Currency Message Template",
                        description: "How the !currency add message appears in chat.",
                        tip: "Variables: {user}, {currency}, {amount}",
                        default: `Added {amount} {currency} to {user}.`,
                        useTextArea: true
                    },
                    removeMessageTemplate: {
                        type: "string",
                        title: "Remove Currency Message Template",
                        description: "How the !currency remove message appears in chat.",
                        tip: "Variables: {user}, {currency}, {amount}",
                        default: `Removed {amount} {currency} from {user}.`,
                        useTextArea: true
                    },
                    addAllMessageTemplate: {
                        type: "string",
                        title: "Add All Currency Message Template",
                        description: "How the !currency addall message appears in chat.",
                        tip: "Variables: {currency}, {amount}",
                        default: `Added {amount} {currency} to everyone!`,
                        useTextArea: true
                    },
                    removeAllMessageTemplate: {
                        type: "string",
                        title: "Remove All Currency Message Template",
                        description: "How the !currency removeall message appears in chat.",
                        tip: "Variables: {currency}, {amount}",
                        default: `Removed {amount} {currency} from everyone!`,
                        useTextArea: true
                    },
                    setMessageTemplate: {
                        type: "string",
                        title: "Set Currency Message Template",
                        description: "How the !currency set message appears in chat.",
                        tip: "Variables: {user}, {currency}, {amount}",
                        default: `Set {user}'s {currency} to {amount} !`,
                        useTextArea: true
                    }
                },
                subCommands: [
                    {
                        id: "viewer-currency",
                        arg: "@\\w+",
                        regex: true,
                        usage: "@username",
                        description: "Gets the currency of the specified user",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        arg: "add",
                        usage: "add [@user] [amount]",
                        description: "Adds currency for a given user.",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        arg: "remove",
                        usage: "remove [@user] [amount]",
                        description: "Removes currency for a given user.",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        arg: "give",
                        usage: "give [@user] [amount]",
                        description: "Gives currency from one user to another user."
                    },
                    {
                        arg: "set",
                        usage: "set [@user] [amount]",
                        description: "Sets currency to the amount.",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        arg: "addall",
                        usage: "addall [amount]",
                        description: "Adds currency to all online users.",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        arg: "removeall",
                        usage: "removeall [amount]",
                        description: "Removes currency from all online users.",
                        restrictionData: {
                            restrictions: [
                                {
                                    id: "sys-cmd-mods-only-perms",
                                    type: "firebot:permissions",
                                    mode: "roles",
                                    roleIds: [
                                        "mod",
                                        "broadcaster"
                                    ]
                                }
                            ]
                        }
                    }
                ]
            },
            /**
         * When the command is triggered
         */
            onTriggerEvent: async (event) => {

                const twitchChat = require("../chat/twitch-chat");

                const { commandOptions } = event;
                const triggeredArg = event.userCommand.triggeredArg;
                const triggeredSubcmd = event.userCommand.triggeredSubcmd;
                const args = event.userCommand.args;
                const currencyName = event.command.currency.name;

                // No args, tell the user how much currency they have.
                if (args.length === 0) {
                    const amount = await currencyManager.getViewerCurrencyAmount(event.userCommand.commandSender, currencyId);
                    if (!isNaN(amount)) {
                        const balanceMessage = commandOptions.currencyBalanceMessageTemplate
                            .replace("{user}", event.userCommand.commandSender)
                            .replace("{currency}", currencyName)
                            .replace("{amount}", util.commafy(amount));

                        await twitchChat.sendChatMessage(balanceMessage, commandOptions.whisperCurrencyBalanceMessage ? event.userCommand.commandSender : null);
                    } else {
                        logger.error('Error while trying to show currency amount to user via chat command.');
                    }

                    return;
                }

                // Arguments passed, what are we even doing?!?
                switch (triggeredArg) {
                    case "add": {
                        // Get username and make sure our currency amount is a positive integer.
                        const username = args[1].replace(/^@/, ''),
                            currencyAdjust = Math.abs(parseInt(args[2]));

                        // Adjust currency, it will return true on success and false on failure.
                        const status = await currencyManager.adjustCurrencyForViewer(username, currencyId, currencyAdjust);

                        if (status) {
                            const addMessageTemplate = commandOptions.addMessageTemplate
                                .replace("{user}", username)
                                .replace("{currency}", currencyName)
                                .replace("{amount}", util.commafy(currencyAdjust));
                            await twitchChat.sendChatMessage(addMessageTemplate);
                        } else {
                            // Error removing currency.
                            await twitchChat.sendChatMessage(`Error: Could not add currency to user.`);
                            logger.error(`Error adding currency for user (${username}) via chat command. Currency: ${currencyId}. Value: ${currencyAdjust}`);
                        }

                        break;
                    }
                    case "remove": {
                        // Get username and make sure our currency amount is a negative integer.
                        const username = args[1].replace(/^@/, ''),
                            currencyAdjust = -Math.abs(parseInt(args[2]));

                        // Adjust currency, it will return true on success and false on failure.
                        const adjustSuccess = await currencyManager.adjustCurrencyForViewer(username, currencyId, currencyAdjust);
                        if (adjustSuccess) {
                            const removeMessageTemplate = commandOptions.removeMessageTemplate
                                .replace("{user}", username)
                                .replace("{currency}", currencyName)
                                .replace("{amount}", util.commafy(parseInt(args[2])));
                            await twitchChat.sendChatMessage(removeMessageTemplate);
                        } else {
                            // Error removing currency.
                            await twitchChat.sendChatMessage(`Error: Could not remove currency from user.`);
                            logger.error(`Error removing currency for user (${username}) via chat command. Currency: ${currencyId}. Value: ${currencyAdjust}`);
                        }

                        break;
                    }
                    case "set": {
                        // Get username and make sure our currency amount is a positive integer.
                        const username = args[1].replace(/^@/, ''),
                            currencyAdjust = Math.abs(parseInt(args[2]));

                        // Adjust currency, it will return true on success and false on failure.
                        const status = await currencyManager.adjustCurrencyForViewer(username, currencyId, currencyAdjust, "set");

                        if (status) {
                            const setMessageTemplate = commandOptions.setMessageTemplate
                                .replace("{user}", username)
                                .replace("{currency}", currencyName)
                                .replace("{amount}", util.commafy(currencyAdjust));
                            await twitchChat.sendChatMessage(setMessageTemplate);
                        } else {
                            // Error removing currency.
                            await twitchChat.sendChatMessage(`Error: Could not set currency for user.`);
                            logger.error(`Error setting currency for user (${username}) via chat command. Currency: ${currencyId}. Value: ${currencyAdjust}`);
                        }

                        break;
                    }
                    case "give": {
                        // Get username and make sure our currency amount is a positive integer.
                        const username = args[1].replace(/^@/, ''),
                            currencyAdjust = Math.abs(parseInt(args[2])),
                            currencyAdjustNeg = -Math.abs(parseInt(args[2]));

                        // Does this currency have transfer active?
                        const currencyCheck = currencyAccess.getCurrencies();
                        if (currencyCheck[currencyId].transfer === "Disallow") {
                            await twitchChat.sendChatMessage('Transfers are not allowed for this currency.');
                            logger.debug(`${event.userCommand.commandSender} tried to give currency, but transfers are turned off for it. ${currencyId}`);
                            return false;
                        }

                        // Don't allow person to give themselves currency.
                        if (event.userCommand.commandSender.toLowerCase() === username.toLowerCase()) {
                            await twitchChat.sendChatMessage(
                                `${event.userCommand.commandSender}, you can't give yourself currency.`);
                            logger.debug(`${username} tried to give themselves currency.`);
                            return false;
                        }

                        // eslint-disable-next-line no-warning-comments
                        // Need to check to make sure they have enough currency before continuing.
                        const userAmount = await currencyManager.getViewerCurrencyAmount(event.userCommand.commandSender, currencyId);

                        // If we get null, there was an error.
                        if (userAmount == null) {
                            await twitchChat.sendChatMessage('Error: Could not retrieve currency.');
                            return false;
                        }

                        // Check to make sure we have enough currency to give.
                        if (userAmount < currencyAdjust) {
                            await twitchChat.sendChatMessage(`You do not have enough ${currencyName} to do this action.`);
                            return false;
                        }

                        // Okay, try to add to user first. User is not guaranteed to be in the DB because of possible typos.
                        // So we check this first, then remove from the command sender if this succeeds.
                        const adjustCurrencySuccess = await currencyManager.adjustCurrencyForViewer(username, currencyId, currencyAdjust);
                        if (adjustCurrencySuccess) {
                            // Subtract currency from command user now.
                            const status = currencyManager.adjustCurrencyForViewer(event.userCommand.commandSender, currencyId, currencyAdjustNeg);

                            if (status) {
                                await twitchChat.sendChatMessage(`Gave ${util.commafy(currencyAdjust)} ${currencyName} to ${username}.`, null);
                            } else {
                                // Error removing currency.
                                await twitchChat.sendChatMessage(
                                    `Error: Could not remove currency to user during give transaction.`);
                                logger.error(`Error removing currency during give transaction for user (${username}) via chat command. Currency: ${currencyId}. Value: ${currencyAdjust}`);
                                return false;
                            }
                        } else {
                            // Error removing currency.
                            await twitchChat.sendChatMessage(`Error: Could not add currency to user. Was there a typo in the username?`);
                            logger.error(`Error adding currency during give transaction for user (${username}) via chat command. Currency: ${currencyId}. Value: ${currencyAdjust}`);
                            return false;
                        }

                        break;
                    }
                    case "addall": {
                        const currencyAdjust = Math.abs(parseInt(args[1]));
                        if (isNaN(currencyAdjust)) {
                            await twitchChat.sendChatMessage(
                                `Error: Could not add currency to all online users.`);
                            return;
                        }
                        currencyManager.addCurrencyToOnlineViewers(currencyId, currencyAdjust, true);

                        const addAllMessageTemplate = commandOptions.addAllMessageTemplate
                            .replace("{currency}", currencyName)
                            .replace("{amount}", util.commafy(currencyAdjust));
                        await twitchChat.sendChatMessage(addAllMessageTemplate);

                        break;
                    }
                    case "removeall": {
                        const currencyAdjust = -Math.abs(parseInt(args[1]));
                        if (isNaN(currencyAdjust)) {
                            await twitchChat.sendChatMessage(`Error: Could not remove currency from all online users.`);
                            return;
                        }
                        currencyManager.addCurrencyToOnlineViewers(currencyId, currencyAdjust, true);

                        const removeAllMessageTemplate = commandOptions.removeAllMessageTemplate
                            .replace("{currency}", currencyName)
                            .replace("{amount}", util.commafy(parseInt(args[1])));
                        await twitchChat.sendChatMessage(removeAllMessageTemplate);

                        break;
                    }
                    default: {
                        if (triggeredSubcmd.id === "viewer-currency") {
                            const username = args[0].replace("@", "");
                            const amount = await currencyManager.getViewerCurrencyAmount(username, currencyId);
                            if (!isNaN(amount)) {
                                const balanceMessage = commandOptions.currencyBalanceMessageTemplate
                                    .replace("{user}", username)
                                    .replace("{currency}", currencyName)
                                    .replace("{amount}", util.commafy(amount));

                                await twitchChat.sendChatMessage(balanceMessage, commandOptions.whisperCurrencyBalanceMessage ? username : null);
                            } else {
                                logger.error('Error while trying to show currency amount to user via chat command.');
                            }
                        } else {
                            const amount = await currencyManager.getViewerCurrencyAmount(event.userCommand.commandSender, currencyId);
                            if (!isNaN(amount)) {
                                const balanceMessage = commandOptions.currencyBalanceMessageTemplate
                                    .replace("{user}", event.userCommand.commandSender)
                                    .replace("{currency}", currencyName)
                                    .replace("{amount}", util.commafy(amount));

                                await twitchChat.sendChatMessage(balanceMessage, commandOptions.whisperCurrencyBalanceMessage ? event.userCommand.commandSender : null);
                            } else {
                                logger.error('Error while trying to show currency amount to user via chat command.');
                            }
                        }
                    }
                }
            }
        };

        return commandManagement;
    }

    /**
     * Makes sure our currency system commands are up to date.
     */
    refreshCurrencyCommands(
        action: CurrencyCommandRefreshRequestAction = null,
        currency: Partial<Currency> = null
    ): void {
    // If we don't get currency stop here.
        if (currency == null) {
            logger.error('Invalid currency passed to refresh currency commands.');
            return;
        }

        // Log our action for logger.
        logger.debug(`Currency "${currency.name}" action "${action}" triggered. Updating currency system commands.`);

        // Decide what we want to do based on the action that was passed to us.
        switch (action) {
            case "update":
                commandManager.unregisterSystemCommand(`firebot:currency:${currency.id}`);
                commandManager.registerSystemCommand(
                    this.createCurrencyCommandDefinition(currency)
                );
                break;
            case "delete":
                // Delete the system command for this currency.
                commandManager.unregisterSystemCommand(`firebot:currency:${currency.id}`);
                break;
            case "create":
                // Build a new system command def and register it.
                commandManager.registerSystemCommand(
                    this.createCurrencyCommandDefinition(currency)
                );
                break;
            default:
                logger.error('Invalid action passed to refresh currency commands.');
                return;
        }
    }

    /**
     * Loops through all currencies we have and passes them to refresh currency commands.
     * This lets us create all of our currency commands when the application is started.
     */
    createAllCurrencyCommands(): void {
        logger.info('Creating all currency commands.');
        const currencyData = currencyAccess.getCurrencies();

        Object.values(currencyData).forEach((currency) => {
            this.refreshCurrencyCommands('create', currency);
        });
    }
}

const currencyCommandManager = new CurrencyCommandManager();

export = currencyCommandManager;