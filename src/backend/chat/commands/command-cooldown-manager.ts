import NodeCache from "node-cache";
import { DateTime } from "luxon";

import { CommandDefinition, SubCommand } from "../../../types/commands";
import logger from "../../logwrapper";
import frontendCommunicator from "../../common/frontend-communicator";

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

class CommandCooldownManager {
    private _cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });


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

    getRemainingCooldown(command: CommandDefinition, triggeredSubcmd: SubCommand, username: string): number {
        const subCommandId = triggeredSubcmd && !triggeredSubcmd.inheritBaseCommandCooldown
            ? triggeredSubcmd.id ?? triggeredSubcmd.arg
            : null;

        const globalCacheKey = this.buildCooldownCacheKey(
            command.id,
            subCommandId
        );

        const userCacheKey = this.buildCooldownCacheKey(
            command.id,
            subCommandId,
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

    cooldownCommand(command: CommandDefinition, triggeredSubcmd: SubCommand, username: string): void {
        let cooldown;
        if (triggeredSubcmd == null || triggeredSubcmd.cooldown == null || triggeredSubcmd?.inheritBaseCommandCooldown) {
            cooldown = command.cooldown;
        } else {
            cooldown = triggeredSubcmd.cooldown;
        }
        if (cooldown == null) {
            return;
        }
        logger.debug("Triggering cooldown for command");

        const subCommandId = triggeredSubcmd && !triggeredSubcmd.inheritBaseCommandCooldown
            ? triggeredSubcmd.id ?? triggeredSubcmd.arg
            : null;

        const globalCacheKey = this.buildCooldownCacheKey(
            command.id,
            subCommandId
        );

        const userCacheKey = this.buildCooldownCacheKey(
            command.id,
            subCommandId,
            username
        );

        if (cooldown.global > 0) {
            this._cooldownCache.set(
                globalCacheKey,
                DateTime.utc().plus({ seconds: cooldown.global }),
                cooldown.global
            );
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
            this._cooldownCache.set(
                globalCacheKey,
                DateTime.utc().plus({ seconds: config.cooldown.global }),
                config.cooldown.global
            );
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

    clearCooldownsForSingleCommand(commandId: string): void {
        const keys = this._cooldownCache.keys();
        keys.forEach((k) => {
            if (k.split(CACHE_KEY_SEPARATOR)[0] === commandId) {
                this._cooldownCache.del(k);
            }
        });

        frontendCommunicator.send("cooldowns-cleared-for-command", commandId);
    }

    flushCooldownCache(): void {
        this._cooldownCache.flushAll();

        frontendCommunicator.send("active-cooldowns-reset");
    }
}

const commandCooldownManager = new CommandCooldownManager();

frontendCommunicator.on("reset-cooldowns-for-single-command", (commandId: string): void => {
    commandCooldownManager.clearCooldownsForSingleCommand(commandId);
});

frontendCommunicator.on("reset-active-cooldowns", (): void => {
    commandCooldownManager.flushCooldownCache();
});

export = commandCooldownManager;