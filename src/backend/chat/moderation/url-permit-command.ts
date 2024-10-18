import { SystemCommand } from "../../../types/commands";
import logger from "../../logwrapper";
import commandManager from "../commands/command-manager";
import frontendCommunicator from "../../common/frontend-communicator";

class PermitManager {
    private readonly _permidCommandId: string = "firebot:moderation:url:permit";
    private _tempPermittedUsers: string[] = [];

    private readonly _permitCommand: SystemCommand<{
        permitDisplayTemplate: string;
        permitDuration: number;
    }> = {
            definition: {
                id: this._permidCommandId,
                name: "Permit",
                active: true,
                trigger: "!permit",
                usage: "[target]",
                description: "Permits a viewer to post a URL for a set duration (see Moderation -> URL Moderation).",
                autoDeleteTrigger: false,
                scanWholeMessage: false,
                hideCooldowns: true,
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "broadcaster",
                                "mod"
                            ]
                        }
                    ]
                },
                options: {
                    permitDuration: {
                        type: "number",
                        title: "Duration in seconds",
                        default: 30,
                        description: "The amount of time the viewer has to post a URL after the !permit command is used."
                    },
                    permitDisplayTemplate: {
                        type: "string",
                        title: "Output Template",
                        description: "The chat message shown when the permit command is used (leave empty for no message).",
                        tip: "Variables: {target}, {duration}",
                        default: `{target}, you have {duration} seconds to post your link in the chat.`,
                        useTextArea: true
                    }
                }
            },
            onTriggerEvent: async (event) => {
                const twitchChat = require("../twitch-chat");
                const { command, commandOptions, userCommand } = event;
                let { args } = userCommand;

                if (command.scanWholeMessage) {
                    args = args.filter(a => a !== command.trigger);
                }

                if (args.length !== 1) {
                    await twitchChat.sendChatMessage("Incorrect command usage!");
                    return;
                }

                const target = args[0].replace("@", "");
                const normalizedTarget = target.toLowerCase();
                if (!target) {
                    await twitchChat.sendChatMessage("Please specify a user to permit.");
                    return;
                }

                this._tempPermittedUsers.push(normalizedTarget);
                logger.debug(`URL moderation: ${target} has been temporary permitted to post a URL.`);

                const message = commandOptions.permitDisplayTemplate.replace("{target}", target).replace("{duration}", commandOptions.permitDuration.toString());

                if (message) {
                    await twitchChat.sendChatMessage(message);
                }

                setTimeout(() => {
                    this._tempPermittedUsers = this._tempPermittedUsers.filter(user => user !== normalizedTarget);
                    logger.debug(`URL moderation: Temporary URL permission for ${target} expired.`);
                }, commandOptions.permitDuration * 1000);
            }
        };

    hasTemporaryPermission(username: string): boolean {
        return this._tempPermittedUsers.includes(username);
    }

    registerPermitCommand(): void {
        if (!commandManager.hasSystemCommand(this._permidCommandId)) {
            commandManager.registerSystemCommand(this._permitCommand);
        }
    }

    unregisterPermitCommand(): void {
        commandManager.unregisterSystemCommand(this._permidCommandId);
    }
}

const manager = new PermitManager();

frontendCommunicator.on("registerPermitCommand", () => {
    manager.registerPermitCommand();
});

frontendCommunicator.on("unregisterPermitCommand", () => {
    manager.unregisterPermitCommand();
});

export = manager;