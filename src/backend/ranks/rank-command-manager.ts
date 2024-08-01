import { CommandOption, SystemCommand } from "../../types/commands";
import { RankLadder } from "../../types/ranks";
import commandManager from "../chat/commands/command-manager";
import rankManager from "./rank-manager";
import viewerDatabase from "../viewers/viewer-database";
import type TwitchChat from "../chat/twitch-chat";
import logger from "../logwrapper";

type RankCommandRefreshRequestAction = "create" | "update" | "delete";

type RankCommandOptions = {
    selfRankMessageTemplate: string;
    otherRankMessageTemplate: string;
    rankListMessageTemplate: string;
    promoteRankMessageTemplate: string;
    demoteRankMessageTemplate: string;
    setRankMessageTemplate: string;
    removeRankMessageTemplate: string;
}

class RankCommandManager {
    constructor() {
        rankManager.on("created-item", (rankLadder: RankLadder) => {
            this.refreshRankCommand('create', rankLadder);
        });
        rankManager.on("updated-item", (rankLadder: RankLadder) => {
            this.refreshRankCommand('update', rankLadder);
        });
        rankManager.on("deleted-item", (rankLadder: RankLadder) => {
            this.refreshRankCommand('delete', rankLadder);
        });
    }

    createRankCommandDefinition(rankLadder: RankLadder): SystemCommand<RankCommandOptions> {
        const cleanRankLadderName = rankLadder.name.replace(/\s+/g, '-').toLowerCase();

        const sharedCommandOptions: Record<string, CommandOption> = {
            selfRankMessageTemplate: {
                type: "string",
                title: "Self Rank Message Template",
                description: "The message to show the user their rank",
                tip: "Variables: {rank}, {user}",
                default: `You currently have the rank of {rank}.`,
                useTextArea: true
            },
            otherRankMessageTemplate: {
                type: "string",
                title: "Other Rank Message Template",
                description: "The message to show the rank of another user",
                tip: "Variables: {rank}, {user}",
                default: `{user} currently has the rank of {rank}.`,
                useTextArea: true
            },
            rankListMessageTemplate: {
                type: "string",
                title: "Rank List Message Template",
                description: "The message to show the list of ranks",
                tip: "Variables: {ranks}",
                default: `The ranks in this ladder are: {ranks}`,
                useTextArea: true
            }
        };

        const manualCommandOptions: Record<string, CommandOption> = {
            promoteRankMessageTemplate: {
                type: "string",
                title: "Promote Rank Message Template",
                description: "The message to show when promoting a user",
                tip: "Variables: {user}, {rank}",
                default: `@{user} has been promoted to {rank}.`,
                useTextArea: true
            },
            demoteRankMessageTemplate: {
                type: "string",
                title: "Demote Rank Message Template",
                description: "The message to show when demoting a user",
                tip: "Variables: {user}, {rank}",
                default: `@{user} has been demoted to {rank}.`,
                useTextArea: true
            },
            setRankMessageTemplate: {
                type: "string",
                title: "Set Rank Message Template",
                description: "The message to show when setting a user's rank",
                tip: "Variables: {user}, {rank}",
                default: `@{user}'s rank has been updated to {rank}.`,
                useTextArea: true
            },
            removeRankMessageTemplate: {
                type: "string",
                title: "Remove Rank Message Template",
                description: "The message to show when removing a user from the rank ladder",
                tip: "Variables: {user}",
                default: `@{user}'s rank has been removed.`,
                useTextArea: true
            }
        };

        const rankManagement: SystemCommand<RankCommandOptions> = {
            definition: {
                id: `firebot:rank-ladder:${rankLadder.id}`,
                name: `${rankLadder.name} Rank Management`,
                active: true,
                trigger: `!${cleanRankLadderName}`,
                description: `Allows management of the "${rankLadder.name}" rank ladder`,
                autoDeleteTrigger: false,
                scanWholeMessage: false,
                treatQuotedTextAsSingleArg: true,
                cooldown: {
                    user: 0,
                    global: 0
                },
                baseCommandDescription: "See your current rank",
                options: {
                    ...sharedCommandOptions,
                    ...(rankLadder.mode === "manual" ? manualCommandOptions : {})
                },
                subCommands: [
                    {
                        arg: "list",
                        usage: "list",
                        description: "Lists all ranks in this ladder"
                    },
                    {
                        id: "viewer-rank",
                        arg: "@\\w+",
                        regex: true,
                        usage: "@username",
                        description: "Gets the rank of the specified user in this ladder",
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
                    ...(rankLadder.mode === "manual" ? [
                        {
                            arg: "promote",
                            usage: "promote [@user]",
                            description: "Promotes a user to the next rank in this ladder",
                            minArgs: 2,
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
                            arg: "demote",
                            usage: "demote [@user]",
                            description: "DEmotes a user to the previous rank in this ladder",
                            minArgs: 2,
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
                            arg: "set",
                            usage: "set [@user] [rankname]",
                            description: "Sets a user's rank to the specified rank",
                            minArgs: 3,
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
                            usage: "remove [@user]",
                            description: "Removes a user from the rank ladder",
                            minArgs: 2,
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
                        }] : [])
                ]
            },
            onTriggerEvent: async (event) => {
                const twitchChat: typeof TwitchChat = require("../chat/twitch-chat");

                const { commandOptions, chatMessage } = event;
                const triggeredSubcmd = event.userCommand.triggeredSubcmd;
                const args = event.userCommand.args;

                const sendMessage = (message: string) =>
                    twitchChat.sendChatMessage(message, undefined, undefined, chatMessage.id);


                // If no arguments are provided, show the user's rank
                if (args.length === 0) {
                    const userRank = await viewerDatabase.getViewerRankForLadderByUserName(event.userCommand.commandSender, rankLadder.id);
                    if (userRank) {
                        const rankMessage =
                            commandOptions.selfRankMessageTemplate
                                .replace("{rank}", userRank.name);
                        await sendMessage(rankMessage);
                    } else {
                        await sendMessage("You are currently not ranked.");
                    }
                } else {
                    if (triggeredSubcmd.id === "viewer-rank") {
                        const username = args[0].replace("@", "");
                        const viewer = await viewerDatabase.getViewerByUsername(username);
                        if (!viewer) {
                            await sendMessage(`${username} not found.`);
                            return;
                        }

                        const viewerRank = await viewerDatabase.getViewerRankForLadder(viewer._id, rankLadder.id);
                        if (viewerRank) {
                            const rankMessage =
                                commandOptions.otherRankMessageTemplate
                                    .replace("{rank}", viewerRank.name)
                                    .replace("{user}", username);
                            await sendMessage(rankMessage);
                        } else {
                            await sendMessage(`${username} is currently not ranked.`);
                        }
                    } else if (triggeredSubcmd.arg === "list") {
                        const ranks = rankLadder.ranks
                            .map((rank) => {
                                const normalizedName = rank.name.replace(/\s+/g, '').toLowerCase();
                                if (normalizedName !== rank.name) {
                                    return `${rank.name} (${normalizedName})`;
                                }
                                return rank.name;
                            })
                            .join(", ");
                        const rankListMessage = commandOptions.rankListMessageTemplate
                            .replace("{ranks}", ranks);
                        await sendMessage(rankListMessage);
                    } else if (triggeredSubcmd.arg === "promote") {
                        if (rankLadder.mode === "auto") {
                            await sendMessage("This rank ladder is in automatic mode and cannot be managed directly.");
                            return;
                        }

                        const username = args[1].replace("@", "");
                        const viewer = await viewerDatabase.getViewerByUsername(username);
                        if (!viewer) {
                            await sendMessage(`${username} not found.`);
                            return;
                        }
                        const ladderHelper = rankManager.getRankLadderHelper(rankLadder.id);
                        const currentRank = await viewerDatabase.getViewerRankForLadder(viewer._id, rankLadder.id);
                        const nextRankId = ladderHelper.getNextRankId(currentRank?.id);

                        if (!nextRankId) {
                            await sendMessage(`@${username} is already at the highest rank.`);
                            return;
                        }

                        const nextRank = ladderHelper.getRank(nextRankId);

                        await viewerDatabase.setViewerRank(viewer, rankLadder.id, nextRankId);

                        const promoteMessage = commandOptions.promoteRankMessageTemplate
                            .replace("{user}", username)
                            .replace("{rank}", nextRank.name);

                        await sendMessage(promoteMessage);
                    } else if (triggeredSubcmd.arg === "demote") {
                        if (rankLadder.mode === "auto") {
                            await sendMessage("This rank ladder is in automatic mode and cannot be managed directly.");
                            return;
                        }

                        const username = args[1].replace("@", "");
                        const viewer = await viewerDatabase.getViewerByUsername(username);
                        if (!viewer) {
                            await sendMessage(`${username} not found.`);
                            return;
                        }
                        const ladderHelper = rankManager.getRankLadderHelper(rankLadder.id);
                        const currentRank = await viewerDatabase.getViewerRankForLadder(viewer._id, rankLadder.id);

                        if (!currentRank) {
                            await sendMessage(`${username} is not ranked and cannot be demoted.`);
                            return;
                        }

                        const previousRankId = ladderHelper.getPreviousRankId(currentRank?.id);
                        const previousRank = ladderHelper.getRank(previousRankId);

                        await viewerDatabase.setViewerRank(viewer, rankLadder.id, previousRankId);

                        const demoteMessage = commandOptions.demoteRankMessageTemplate
                            .replace("{user}", username)
                            .replace("{rank}", previousRank?.name ?? "not ranked");

                        await sendMessage(demoteMessage);
                    } else if (triggeredSubcmd.arg === "set") {
                        if (rankLadder.mode === "auto") {
                            await sendMessage("This rank ladder is in automatic mode and cannot be managed directly.");
                            return;
                        }

                        const username = args[1].replace("@", "");
                        const rankName = args[2];

                        const viewer = await viewerDatabase.getViewerByUsername(username);
                        if (!viewer) {
                            await sendMessage(`${username} not found.`);
                            return;
                        }

                        const ladderHelper = rankManager.getRankLadderHelper(rankLadder.id);
                        const rank = ladderHelper.getRankByName(rankName);
                        if (!rank) {
                            await sendMessage(`Rank "${rankName}" not found.`);
                            return;
                        }

                        await viewerDatabase.setViewerRank(viewer, rankLadder.id, rank.id);

                        const setRankMessage = commandOptions.setRankMessageTemplate
                            .replace("{user}", username)
                            .replace("{rank}", rank.name);

                        await sendMessage(setRankMessage);
                    } else if (triggeredSubcmd.arg === "remove") {
                        if (rankLadder.mode === "auto") {
                            await sendMessage("This rank ladder is in automatic mode and cannot be managed directly.");
                            return;
                        }

                        const username = args[1].replace("@", "");
                        const viewer = await viewerDatabase.getViewerByUsername(username);
                        if (!viewer) {
                            await sendMessage(`${username} not found.`);
                            return;
                        }

                        await viewerDatabase.setViewerRank(viewer, rankLadder.id, null);

                        const removeRankMessage = commandOptions.removeRankMessageTemplate
                            .replace("{user}", username);

                        await sendMessage(removeRankMessage);
                    } else {
                        await sendMessage("Invalid command.");
                    }
                }
            }
        };

        return rankManagement;
    }

    refreshRankCommand(
        action: RankCommandRefreshRequestAction = null,
        rankLadder: RankLadder = null
    ): void {
        if (rankLadder == null) {
            logger.error('Invalid rank ladder passed to refresh rank ladder commands.');
            return;
        }

        logger.debug(`Rank ladder "${rankLadder.name}" action "${action}" triggered. Updating rank ladder system commands.`);

        switch (action) {
            case "update":
                commandManager.unregisterSystemCommand(`firebot:rank-ladder:${rankLadder.id}`);
                commandManager.registerSystemCommand(
                    this.createRankCommandDefinition(rankLadder)
                );
                break;
            case "delete":
                commandManager.unregisterSystemCommand(`firebot:rank-ladder:${rankLadder.id}`);
                break;
            case "create":
                commandManager.registerSystemCommand(
                    this.createRankCommandDefinition(rankLadder)
                );
                break;
            default:
                logger.error('Invalid action passed to refresh rank ladder commands.');
                return;
        }
    }

    createAllRankLadderCommands(): void {
        logger.info('Creating all rank ladder commands.');

        const rankLadders = rankManager.getAllItems();

        for (const rankLadder of rankLadders) {
            this.refreshRankCommand('create', rankLadder);
        }
    }
}

const rankCommandManager = new RankCommandManager();

export = rankCommandManager;