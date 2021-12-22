"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");
const moment = require("moment");

/**
 * @typedef CustomCommand
 * @prop {string} id - the id of the custom command
 * @prop {boolean} simple - whether this command was created in simple mode
 *
 * @prop {string} trigger - the trigger of the custom command
 * @prop {boolean} [autoDeleteTrigger] - whether the trigger chat message should be deleted automatically
 * @prop {boolean} [scanWholeMessage] - whether the whole chat message should be scanned for the command
 * @prop {boolean} [triggerIsRegex] - whether the command trigger is a regular expression
 * @prop {string} [regexDescription] - the human readable description of the regular expression
 *
 * @prop {string} [description] - the description of the command
 * @prop {string[]} aliases - a list of triggers that should also trigger this command
 *
 * @prop {string} createdBy - the user who created the command
 * @prop {Date} createdAt - when the command was created
 * @prop {string} [lastEditBy] - the user who last edited the command
 * @prop {Date} [lastEditAt] - when the command was last edited
 *
 * @prop {object} cooldown - the cooldown settings for the command
 * @prop {number} cooldown.global - the cooldown for all users
 * @prop {number} cooldown.user - the cooldown per user
 * @prop {boolean} sendCooldownMessage - whether a chat message should be sent when the command is on cooldown
 * @prop {string} cooldownMessage - the chat message that is sent when the command is on cooldown
 *
 * @prop {number} count - how many times the command has been used
 *
 * @prop {object} restrictionData - the saved restrictions for the command
 * @prop {any[]} restrictionData.restrictions - the array of restrictions objects
 * @prop {string} restrictionData.mode - whether all, any or no restrictions should pass
 * @prop {boolean} restrictionData.sendFailMessage - whether a chat message should be sent when the command user is restricted
 * @prop {string} restrictionData.failMessage - the chat message that is sent when the command user is restricted
 *
 * @prop {boolean} active - whether the command is enabled
 * @prop {boolean} [hidden] - whether the command is hidden on the commands list
 * @prop {boolean} ignoreBot - Whether the command should trigger if the bot account uses it
 * @prop {boolean} [ignoreStreamer] - whether the command should trigger if the streamer account uses it
 *
 * @prop {object} effects - the saved effects in the command
 * @prop {string} effects.id - the effect list root id
 * @prop {any[]} effects.list - the array of effects objects
 *
 * @prop {string[]} sortTags - the sort tags for the effect list
 */

/**
 * @extends {JsonDbManager<CustomCommand>}
 */
class CustomCommandManager extends JsonDbManager {
    constructor() {
        super("Custom Command", "/chat/commands", "/customCommands");
    }

    /**
     *
     * @param {CustomCommand} command
     * @param {boolean} imported
     * @returns {Promise.<CustomCommand>}
     */
    async saveItem(command, user, imported = false) {
        if (command.id == null || command.id === "") {
            command.createdAt = imported ? "Imported" : moment().format();
            command.createdBy = user;
        } else {
            command.lastEditAt = imported ? "Imported" : moment().format();
            command.lastEditBy = user;
        }

        if (command.count == null) {
            command.count = 0;
        }

        const savedCommand = await super.saveItem(command);

        if (savedCommand != null) {
            return savedCommand;
        }
    }

    /**
     * @param {string} trigger
     */
    async deleteItemByTrigger(trigger) {
        const command = this.getAllItems().find(c => c.trigger === trigger);

        await super.deleteItem(command.id);
    }

    /**
     * @emits
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("custom-commands-updated", this.getAllItems());
    }
}

const customCommandManager = new CustomCommandManager();

frontendCommunicator.onAsync("getCustomCommands",
    async () => customCommandManager.getAllItems());

frontendCommunicator.onAsync("saveCustomCommand",
    async (/** @type {CustomCommand} */ {customCommand, user}) => await customCommandManager.saveItem(customCommand, user));

frontendCommunicator.onAsync("saveAllCustomCommands",
    async (/** @type {CustomCommand[]} */ allCustomCommands) => await customCommandManager.saveAllItems(allCustomCommands));

frontendCommunicator.on("deleteCustomCommand",
    (/** @type {string} */ customCommandId) => customCommandManager.deleteItem(customCommandId));

module.exports = customCommandManager;
