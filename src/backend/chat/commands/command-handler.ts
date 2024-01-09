import NodeCache from "node-cache";
import { DateTime } from "luxon";

import { CommandDefinition, SubCommand, SystemCommandDefinition, UserCommand } from "../../../types/commands";
import { FirebotChatMessage } from "../../../types/chat";
import { Trigger } from "../../../types/triggers";
import { TriggerType } from "../../common/EffectType";

import logger from "../../logwrapper";
import util from "../../utility";
import accountAccess from "../../common/account-access";
import frontendCommunicator from "../../common/frontend-communicator";
import restrictionsManager from "../../restrictions/restriction-manager";
import commandManager from "./command-manager";
import commandExecutor from "./command-executor";
import twitchApi from "../../twitch-api/api";
import chatHelpers from "../chat-helpers";

const DEFAULT_COOLDOWN_MESSAGE = "This command is still on cooldown for: {timeLeft}";
const DEFAULT_RESTRICTION_MESSAGE = "Sorry, you cannot use this command because: {reason}";

// This is purposefully ridiculous to try and avoid collisions when we split the string
// (like with system commands that commonly use colons in their name)
const CACHE_KEY_SEPARATOR = "^$^";

interface CooldownConfig {
    commandId: string;
    subcommandId?: string;
    username: string;
    cooldown: {
        global: number;
        user: number;
    }
}

interface ClearCooldownConfig {
    commandId: string;
    subcommandId?: string;
    username: string;
    cooldown: {
        global: boolean;
        user: boolean;
    }
}

interface CommandMatch {
    command: CommandDefinition | SystemCommandDefinition;
    matchedTrigger?: string;
}

interface TriggerWithArgs {
    trigger: string;
    args?: string[];
}

class CommandHandler {
    private _cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });
    private _handledMessageIds: string[] = [];

    private buildCooldownCacheKey(commandId: string, subCommandId: string = null, username: string = null): string {
        const tokens = [commandId];

        if (!!subCommandId?.length) {
            tokens.push(subCommandId);
        }

        if (!!username?.length) {
            tokens.push(username);
        }

        return tokens.join(CACHE_KEY_SEPARATOR);
    }

    private getRemainingCooldown(command: CommandDefinition, triggeredSubcmd: SubCommand, username: string): number {
        const globalCacheKey = this.buildCooldownCacheKey(
            command.id,
            triggeredSubcmd ? triggeredSubcmd.id || triggeredSubcmd.arg : null
        );

        const userCacheKey = this.buildCooldownCacheKey(
            command.id,
            triggeredSubcmd ? triggeredSubcmd.id || triggeredSubcmd.arg : null,
            username
        );

        let remainingGlobal = 0,
            remainingUser = 0;

        const globalCooldown = this._cooldownCache.get<DateTime>(globalCacheKey);
        if (globalCooldown != null) {
            remainingGlobal = Math.trunc(globalCooldown.diff(DateTime.utc(), "seconds").seconds);
        }

        const userCooldown = this._cooldownCache.get<DateTime>(userCacheKey);
        if (userCooldown != null) {
            remainingUser = Math.trunc(userCooldown.diff(DateTime.utc(), "seconds").seconds);
        }

        if (remainingUser > 0) {
            return remainingUser;
        } else if (remainingGlobal > 0) {
            return remainingGlobal;
        }
        return 0;
    }

    private cooldownCommand(command: CommandDefinition, triggeredSubcmd: SubCommand, username: string): void {
        let cooldown;
        if (triggeredSubcmd == null || triggeredSubcmd.cooldown == null) {
            cooldown = command.cooldown;
        } else {
            cooldown = triggeredSubcmd.cooldown;
        }
        if (cooldown == null) {
            return;
        }
        logger.debug("Triggering cooldown for command");

        const globalCacheKey = this.buildCooldownCacheKey(
            command.id,
            triggeredSubcmd ? triggeredSubcmd.id || triggeredSubcmd.arg : null
        );

        const userCacheKey = this.buildCooldownCacheKey(
            command.id,
            triggeredSubcmd ? triggeredSubcmd.id || triggeredSubcmd.arg : null,
            username
        );

        if (cooldown.global > 0) {
            if (this._cooldownCache.get(globalCacheKey) == null) {
                this._cooldownCache.set(
                    globalCacheKey,
                    DateTime.utc().plus({ seconds: cooldown.global }),
                    cooldown.global
                );
            }
        }
        if (cooldown.user > 0) {
            this._cooldownCache.set(
                userCacheKey,
                DateTime.utc().plus({ seconds: cooldown.user }),
                cooldown.user
            );
        }
    }

    manuallyCooldownCommand(config: CooldownConfig): void {
        if (config.commandId == null || config.cooldown == null ||
            (config.cooldown.global == null && config.cooldown.user == null)) {
            return;
        }

        const globalCacheKey = this.buildCooldownCacheKey(
            config.commandId,
            config.subcommandId ? config.subcommandId : null
        );

        const userCacheKey = this.buildCooldownCacheKey(
            config.commandId,
            config.subcommandId ? config.subcommandId : null,
            config.username
        );

        if (config.cooldown.global > 0) {
            if (this._cooldownCache.get(globalCacheKey) == null) {
                this._cooldownCache.set(
                    globalCacheKey,
                    DateTime.utc().plus({ seconds: config.cooldown.global }),
                    config.cooldown.global
                );
            }
        }
        if (config.cooldown.user > 0 && config.username != null) {
            this._cooldownCache.set(
                userCacheKey,
                DateTime.utc().plus({ seconds: config.cooldown.user }),
                config.cooldown.user
            );
        }
    }

    manuallyClearCooldownCommand(config: ClearCooldownConfig): void {
        if (config.commandId == null || config.cooldown == null ||
            (config.cooldown.global == null && config.cooldown.user == null)) {
            return;
        }

        const globalCacheKey = this.buildCooldownCacheKey(
            config.commandId,
            config.subcommandId ? config.subcommandId : null
        );

        const userCacheKey = this.buildCooldownCacheKey(
            config.commandId,
            config.subcommandId ? config.subcommandId : null,
            config.username
        );

        if (this._cooldownCache.get(globalCacheKey) !== null && config.cooldown.global === true) {
            this._cooldownCache.del(globalCacheKey);
        }

        if (this._cooldownCache.get(userCacheKey) !== null && config.cooldown.user === true) {
            this._cooldownCache.del(userCacheKey);
        }
    }

    flushCooldownCache(): void {
        this._cooldownCache.flushAll();

        frontendCommunicator.send("active-cooldowns-reset");
    }

    clearCooldownsForSingleCommand(commandId: string): void {
        const keys = this._cooldownCache.keys();
        keys.forEach((k) => {
            if (k.split(CACHE_KEY_SEPARATOR)[0] === commandId) {
                this._cooldownCache.del(k);
            }
        });

        frontendCommunicator.send("cooldowns-cleared-for-command", commandId);
    }

    private buildCommandRegexStr(trigger: string, scanWholeMessage: boolean): string {
        const escapedTrigger = util.escapeRegExp(trigger);
        if (scanWholeMessage) {
            return `(?:^|\\s)${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
        }
        return `^${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
    }

    private testForTrigger(message: string, trigger: string, scanWholeMessage: boolean, triggerIsRegex: boolean): boolean {
        message = message.toLowerCase();

        const normalizedTrigger = trigger.toLowerCase();
        const commandRegexStr = triggerIsRegex
            ? trigger
            : this.buildCommandRegexStr(normalizedTrigger, scanWholeMessage);

        const regex = new RegExp(commandRegexStr, "gi");

        return regex.test(message);
    }

    private checkForCommand(rawMessage: string): CommandMatch {
        if (rawMessage == null || rawMessage.length < 1) {
            return null;
        }

        const allCommands = commandManager.getAllActiveCommands();

        for (const command of allCommands) {

            if (this.testForTrigger(
                rawMessage,
                command.trigger,
                command.scanWholeMessage,
                command.triggerIsRegex
            )
            ) {
                return { command, matchedTrigger: command.trigger };
            }

            if (!command.triggerIsRegex && command.aliases != null && Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    if (this.testForTrigger(
                        rawMessage,
                        alias,
                        command.scanWholeMessage,
                        false
                    )) {
                        return { command, matchedTrigger: alias };
                    }
                }
            }
        }
        return { command: null };
    }

    private updateCommandCount(command: CommandDefinition): void {
        if (command.count == null) {
            command.count = 0;
        }
        command.count++;
        frontendCommunicator.send("command-count-update", {
            commandId: command.id,
            count: command.count
        });
    }

    private parseCommandTriggerAndArgs(trigger: string, rawMessage: string, scanWholeMessage = false, treatQuotedTextAsSingleArg = false): TriggerWithArgs {
        let args = [];

        if (rawMessage != null) {
            let rawArgs = [];

            if (treatQuotedTextAsSingleArg) {
                // Get args
                const quotedArgRegExp = /"([^"]+)"|(\S+)/g;
                rawArgs = rawMessage.match(quotedArgRegExp);

                // Strip surrounding quotes from quoted args
                rawArgs = rawArgs.map(rawArg => rawArg.replace(/^"(.+)"$/, '$1'));
            } else {
                rawArgs = rawMessage.split(" ");
            }

            if (scanWholeMessage) {
                args = rawArgs;
            } else {
                if (rawArgs.length > 0) {
                    trigger = rawArgs[0];
                    args = rawArgs.splice(1);
                }
            }
        }

        args = args.filter(a => a.trim() !== "");

        return { trigger, args };
    }

    private buildUserCommand(command: CommandDefinition, rawMessage: string, sender: string, senderRoles?: string[]): UserCommand {
        const { trigger, args } = this.parseCommandTriggerAndArgs(command.trigger, rawMessage, command.scanWholeMessage, command.treatQuotedTextAsSingleArg);

        const userCmd: UserCommand = {
            trigger: trigger,
            args: args,
            commandSender: sender,
            senderRoles: senderRoles ?? []
        };

        if (!command.scanWholeMessage &&
            !command.triggerIsRegex &&
            userCmd.args.length > 0 &&
            command.subCommands?.length > 0) {

            for (const subcmd of command.subCommands) {
                if (subcmd.active === false && command.type !== "system") {
                    continue;
                }
                if (subcmd.regex) {
                    const regex = new RegExp(`^${subcmd.arg}$`, "gi");
                    if (regex.test(userCmd.args[0])) {
                        userCmd.triggeredSubcmd = subcmd;
                        break;
                    }
                } else {
                    if (subcmd.arg.toLowerCase() === userCmd.args[0].toLowerCase()) {
                        userCmd.triggeredSubcmd = subcmd;
                        break;
                    }
                }
            }

            if (command.type !== "system" && userCmd.triggeredSubcmd == null) {
                if (command.fallbackSubcommand == null || !command.fallbackSubcommand.active) {
                    userCmd.isInvalidSubcommandTrigger = true;
                } else {
                    userCmd.triggeredSubcmd = command.fallbackSubcommand;
                }
            }

            if (userCmd.triggeredSubcmd != null) {
                userCmd.triggeredArg = userCmd.triggeredSubcmd.arg;
                userCmd.subcommandId = userCmd.triggeredSubcmd.id;
            }
        }

        return userCmd;
    }

    private fireCommand(
        command: CommandDefinition,
        userCmd: UserCommand,
        firebotChatMessage: FirebotChatMessage,
        commandSender: string,
        isManual = false
    ): void {
        if (command == null) {
            return;
        }
        if (commandSender == null) {
            commandSender = accountAccess.getAccounts().streamer.username;
        }

        logger.info(`Checking command type... ${command.type}`);

        if (command.type === "system") {
            logger.info("Executing system command");
            //get system command from manager
            const cmdDef = commandManager.getSystemCommandById(command.id);

            const commandOptions = {};
            if (command.options != null) {
                for (const optionName of Object.keys(command.options)) {
                    const option = command.options[optionName];
                    if (option) {
                        commandOptions[optionName] = option.value ?? option.default;
                    }
                }
            }

            //call trigger event.
            cmdDef.onTriggerEvent({
                command: command,
                commandOptions: commandOptions,
                userCommand: userCmd,
                chatMessage: firebotChatMessage
            });
        }
        if (command.effects) {
            logger.info("Executing command effects");
            commandExecutor.execute(command, userCmd, firebotChatMessage, isManual);
        }
    }

    async handleChatMessage(firebotChatMessage: FirebotChatMessage): Promise<boolean> {
        const twitchChat = require("../twitch-chat");

        logger.debug("Checking for command in message...");

        // Username of the person that sent the command.
        const commandSender = firebotChatMessage.username;

        // Check to see if handled message array contains the id of this message already.
        // If it does, that means that one of the logged in accounts has already handled the message.
        if (this._handledMessageIds.includes(firebotChatMessage.id)) {
            // We can remove the handled id now, to keep the array small.
            this._handledMessageIds = this._handledMessageIds.filter(id => id !== firebotChatMessage.id);
            return false;
        }
        // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
        this._handledMessageIds.push(firebotChatMessage.id);

        logger.debug("Combining message segments...");
        const rawMessage = firebotChatMessage.rawText;

        // search for and return command if found
        logger.debug("Searching for command...");
        const { command, matchedTrigger } = this.checkForCommand(rawMessage);

        // command wasn't found
        if (command == null) {
            return false;
        }

        const { streamer, bot } = accountAccess.getAccounts();

        // check if chat came from the streamer and if we should ignore it.
        if (command.ignoreStreamer && firebotChatMessage.username === streamer.displayName) {
            logger.debug("Message came from streamer and this command is set to ignore it");
            return false;
        }

        // check if chat came from the bot and if we should ignore it.
        if (command.ignoreBot && firebotChatMessage.username === bot.displayName) {
            logger.debug("Message came from bot and this command is set to ignore it");
            return false;
        }

        // check if chat came via whisper and if we should ignore it.
        if (command.ignoreWhispers && firebotChatMessage.whisper) {
            logger.debug("Message came from whisper and this command is set to ignore it");
            return false;
        }

        // build usercommand object
        const userCmd = this.buildUserCommand(command, rawMessage, commandSender, firebotChatMessage.roles);
        const triggeredSubcmd = userCmd.triggeredSubcmd;

        // update trigger with the one we matched
        userCmd.trigger = matchedTrigger;

        // command is disabld
        if (triggeredSubcmd && triggeredSubcmd.active === false) {
            logger.debug("This Command is disabled");
            return false;
        }

        if (userCmd.isInvalidSubcommandTrigger === true) {
            await twitchChat.sendChatMessage(`Invalid Command: unknown arg used.`);
            return false;
        }

        // Can't auto delete whispers, so we ignore auto delete trigger for those
        if (firebotChatMessage.whisper !== true && command.autoDeleteTrigger || (triggeredSubcmd && triggeredSubcmd.autoDeleteTrigger)) {
            logger.debug("Auto delete trigger is on, attempting to delete chat message");
            await twitchApi.chat.deleteChatMessage(firebotChatMessage.id);
        }

        // check if command meets min args requirement
        const minArgs = triggeredSubcmd ? triggeredSubcmd.minArgs || 0 : command.minArgs || 0;
        if (userCmd.args.length < minArgs) {
            const usage = triggeredSubcmd ? triggeredSubcmd.usage : command.usage;
            await twitchChat.sendChatMessage(`Invalid command. Usage: ${command.trigger} ${usage || ""}`);
            return false;
        }

        logger.debug("Checking cooldowns for command...");
        // Check if the command is on cooldown
        const remainingCooldown = this.getRemainingCooldown(
            command,
            triggeredSubcmd,
            commandSender
        );

        if (remainingCooldown > 0) {
            logger.debug("Command is still on cooldown, alerting viewer...");
            if (command.sendCooldownMessage || command.sendCooldownMessage == null) {

                const cooldownMessage = command.useCustomCooldownMessage ? command.cooldownMessage : DEFAULT_COOLDOWN_MESSAGE;

                await twitchChat.sendChatMessage(
                    cooldownMessage
                        .replace("{user}", commandSender)
                        .replace("{timeLeft}", util.secondsForHumans(remainingCooldown)),
                    null,
                    null,
                    firebotChatMessage.id
                );
            }
            return false;
        }

        // Check if command passes all restrictions
        const restrictionData =
            triggeredSubcmd && triggeredSubcmd.restrictionData && triggeredSubcmd.restrictionData.restrictions
                && triggeredSubcmd.restrictionData.restrictions.length > 0
                ? triggeredSubcmd.restrictionData
                : command.restrictionData;

        if (restrictionData) {
            logger.debug("Command has restrictions...checking them.");
            const triggerData = {
                type: TriggerType.COMMAND,
                metadata: {
                    username: commandSender,
                    userId: firebotChatMessage.userId,
                    userTwitchRoles: firebotChatMessage.roles,
                    command: command,
                    userCommand: userCmd,
                    chatMessage: firebotChatMessage
                }
            };
            try {
                await restrictionsManager.runRestrictionPredicates(triggerData, restrictionData);
                logger.debug("Restrictions passed!");
            } catch (restrictionReason) {
                let reason;
                if (Array.isArray(restrictionReason)) {
                    reason = restrictionReason.join(", ");
                } else {
                    reason = restrictionReason;
                }

                logger.debug(`${commandSender} could not use command '${command.trigger}' because: ${reason}`);
                if (restrictionData.sendFailMessage || restrictionData.sendFailMessage == null) {

                    const restrictionMessage = restrictionData.useCustomFailMessage ?
                        restrictionData.failMessage :
                        DEFAULT_RESTRICTION_MESSAGE;

                    await twitchChat.sendChatMessage(
                        restrictionMessage
                            .replace("{user}", commandSender)
                            .replace("{reason}", reason),
                        null,
                        null,
                        firebotChatMessage.id
                    );
                }

                return false;
            }
        }

        // If command is not on cooldown AND it passes restrictions, then we can run it. Store the cooldown.
        this.cooldownCommand(command, triggeredSubcmd, commandSender);

        //update the count for the command
        if (command.type === "custom") {
            logger.debug("Updating command count.");
            this.updateCommandCount(command);
        }

        this.fireCommand(command, userCmd, firebotChatMessage, commandSender, false);
        return true;
    }

    triggerCustomCommand(id: string, isManual = true): void {
        const command = commandManager.getCustomCommandById(id);
        if (command != null) {
            console.log("firing command manually", command);
            const commandSender = accountAccess.getAccounts().streamer.username,
                userCmd = this.buildUserCommand(command, null, commandSender);
            this.fireCommand(command, userCmd, null, commandSender, isManual);
        }
    }

    private runCommandFromEffect(command: CommandDefinition, trigger: Trigger, args: string[]): void {
        const message = `${command.trigger} ${args}`;
        const firebotChatMessage = chatHelpers.buildBasicFirebotChatMessage(message, trigger.metadata.username);

        if (command != null) {
            const userCmd = this.buildUserCommand(command, message, trigger.metadata.username);
            this.fireCommand(command, userCmd, firebotChatMessage, trigger.metadata.username, false);
        }
    }

    runSystemCommandFromEffect(id: string, trigger: Trigger, args: string[]): void {
        const command = commandManager.getSystemCommandById(id).definition;
        this.runCommandFromEffect(command, trigger, args);
    }

    runCustomCommandFromEffect(id: string, trigger: Trigger, args: string[]): void {
        const command = commandManager.getCustomCommandById(id);
        this.runCommandFromEffect(command, trigger, args);
    }
}

const commandHandler = new CommandHandler();

frontendCommunicator.on("command-manual-trigger", (id: string): void => {
    commandHandler.triggerCustomCommand(id, true);
});

frontendCommunicator.on("reset-active-cooldowns", (): void => {
    commandHandler.flushCooldownCache();
});

frontendCommunicator.on("reset-cooldowns-for-single-command", (commandId: string): void => {
    commandHandler.clearCooldownsForSingleCommand(commandId);
});

export = commandHandler;