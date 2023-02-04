import { SystemCommand } from "../../../../types/commands";
import TwitchChat from "../../twitch-chat";

const viewerQueue: string[] = [];
let isViewerQueueRunning: boolean = false;

export const QueueSystemCommandType: SystemCommand = {
    definition: {
        id: "firebot:queue",
        name: "Viewer Queue",
        description: "Allow viewers to add and remove themselves from a queue",
        active: true,
        trigger: "!queue",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        baseCommandDescription: "Adds a viewer to the queue",
        subCommands: [
            {
                id: "start",
                arg: "start",
                description: "Starts the viewer queue",
                usage: "start",
                active: true,
                restrictionData: {
                    mode: "all",
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
                id: "stop",
                arg: "stop",
                description: "Stops and clears the viewer queue",
                usage: "stop",
                active: true,
                restrictionData: {
                    mode: "all",
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
                id: "clear",
                arg: "clear",
                description: "Empties the viewer queue",
                usage: "clear",
                active: true,
                restrictionData: {
                    mode: "all",
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
                id: "add",
                arg: "add",
                description: "Adds a viewer to the queue",
                usage: "add [target]",
                active: true,
                minArgs: 2,
                restrictionData: {
                    mode: "all",
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
                id: "leave",
                arg: "leave",
                description: "Allows a viewer to leave the queue",
                usage: "leave",
                active: true
            },
            {
                id: "remove",
                arg: "remove",
                description: "Removes a viewer from the queue",
                usage: "remove [target]",
                active: true,
                minArgs: 2,
                restrictionData: {
                    mode: "all",
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
                id: "next",
                arg: "next",
                description: "Shows the next viewer in the queue",
                usage: "next",
                active: true
            },
            {
                id: "setnext",
                arg: "setnext",
                description: "Moves a viewer to the top of the queue",
                usage: "setnext [target]",
                active: true,
                minArgs: 2,
                restrictionData: {
                    mode: "all",
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
                id: "list",
                arg: "list",
                description: "Displays the current viewer queue",
                usage: "list",
                active: true,
                restrictionData: {
                    mode: "all",
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
    onTriggerEvent: async (event) => {
        const args = event.userCommand.args;

        // "!queue" with no args
        if (args.length === 0) {
            if (isViewerQueueRunning === true) {
                if (viewerQueue.some(u => u.toLowerCase() === event.userCommand.commandSender?.toLowerCase()) === true) {
                    TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} You're already in the queue.`);
                } else {
                    viewerQueue.push(event.userCommand.commandSender);
                }
            } else {
                TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} Viewer queue is not currently active.`);
            }
            return;
        }

        const triggeredArg = event.userCommand.triggeredArg;

        switch (triggeredArg) {
            case "start":
                if (isViewerQueueRunning === true) {
                    TwitchChat.sendChatMessage("Viewer queue is already active.");
                } else {
                    isViewerQueueRunning = true;
                    TwitchChat.sendChatMessage(`Viewer queue is now active! To join the queue, type ${event.command.trigger}`);
                }
                break;

            case "stop":
                if (isViewerQueueRunning === true) {
                    isViewerQueueRunning = false;
                    viewerQueue.splice(0);
                    TwitchChat.sendChatMessage("Viewer queue is no longer active.");
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "clear":
                if (isViewerQueueRunning === true) {
                    viewerQueue.splice(0);
                    TwitchChat.sendChatMessage("Viewer queue has been cleared.");
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "add":
                if (isViewerQueueRunning === true) {
                    const newViewer = args[1]?.replace("@", "");

                    if (newViewer) {
                        viewerQueue.push(newViewer);
                        TwitchChat.sendChatMessage(`${newViewer} has been added to the queue.`);
                    } else {
                        TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} You must specify a viewer to add to the queue.`);
                    }
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "leave":
                if (isViewerQueueRunning === true) {
                    const viewerQueuePosition = viewerQueue.findIndex(u => u.toLowerCase() === event.userCommand.commandSender?.toLowerCase());

                    if (viewerQueuePosition > -1) {
                        viewerQueue.splice(viewerQueuePosition, 1);
                        TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} You have been removed from the queue.`);
                    } else {
                        TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} You are not currently in the queue.`);
                    }
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "remove":
                if (isViewerQueueRunning === true) {
                    const viewer = args[1]?.replace("@", "");
                    if (viewer) {
                        const viewerQueuePosition = viewerQueue.findIndex(u => u.toLowerCase() === viewer.toLowerCase());
    
                        if (viewerQueuePosition > -1) {
                            viewerQueue.splice(viewerQueuePosition, 1);
                            TwitchChat.sendChatMessage(`@${viewer} has been removed from the queue.`);
                        } else {
                            TwitchChat.sendChatMessage(`@${viewer} is not currently in the queue.`);
                        }
                    } else {
                        TwitchChat.sendChatMessage(`@${event.userCommand.commandSender} You must specify a viewer to remove from the queue.`);
                    }
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "next":
                if (isViewerQueueRunning === true) {
                    if (viewerQueue.length > 0) {
                        TwitchChat.sendChatMessage(`Next viewer in the queue is ${viewerQueue[0]}`);
                    } else {
                        TwitchChat.sendChatMessage("There are currently no viewers in the queue.");
                    }
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;

            case "list":
                if (isViewerQueueRunning === true) {
                    if (viewerQueue.length > 0) {
                        TwitchChat.sendChatMessage(`Viewers currently in queue: ${viewerQueue.join(", ")}`);
                    } else {
                        TwitchChat.sendChatMessage("There are currently no viewers in the queue.");
                    }
                } else {
                    TwitchChat.sendChatMessage("Viewer queue is not currently active.");
                }
                break;
            
            default:
                break;
        }
    }
};