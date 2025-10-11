import { SystemCommand } from "../../../../types/commands";
import customRoleManager from "../../../roles/custom-roles-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

/**
 * The `!role` command
 */
export const CustomRoleManagementSystemCommand: SystemCommand = {
    definition: {
        id: "firebot:role-management",
        name: "Custom Role Management",
        active: true,
        trigger: "!role",
        description: "Allows management of viewer's custom roles from chat.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        restrictionData: {
            restrictions: [
                {
                    id: "sys-cmd-mods-only-perms",
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: [
                        "broadcaster"
                    ]
                }
            ]
        },
        subCommands: [
            {
                arg: "add",
                usage: "add @viewer roleName",
                description: "Adds a custom role to a viewer.",
                minArgs: 3
            },
            {
                arg: "remove",
                usage: "remove @viewer roleName",
                description: "Removes a custom role from a viewer.",
                minArgs: 3
            },
            {
                arg: "list",
                usage: "list [@viewer]",
                description: "List all custom roles, or just roles a viewer has."
            }
        ]
    },
    onTriggerEvent: async (event) => {

        const { args, triggeredArg } = event.userCommand;

        if (args.length < 1) {
            await TwitchApi.chat.sendChatMessage("Incorrect command usage!", null, true);
            return;
        }

        switch (triggeredArg) {
            case "add": {
                const roleName = args.slice(2)[0];
                const role = customRoleManager.getRoleByName(roleName);
                if (role == null) {
                    await TwitchApi.chat.sendChatMessage("Can't find a role by that name.", null, true);
                } else {
                    const username = args[1].replace("@", "");
                    const user = await TwitchApi.users.getUserByName(username);
                    if (user == null) {
                        await TwitchApi.chat.sendChatMessage(`Could not add role ${role.name} to ${username}. User does not exist.`, null, true);
                    } else {
                        customRoleManager.addViewerToRole(role.id, {
                            id: user.id,
                            username: user.name,
                            displayName: user.displayName
                        });
                        await TwitchApi.chat.sendChatMessage(`Added role ${role.name} to ${username}`, null, true);
                    }
                }
                break;
            }
            case "remove": {
                const roleName = args.slice(2)[0];
                const role = customRoleManager.getRoleByName(roleName);
                if (role == null) {
                    await TwitchApi.chat.sendChatMessage("Can't find a role by that name.", null, true);
                } else {
                    const username = args[1].replace("@", "");
                    const user = await TwitchApi.users.getUserByName(username);
                    if (user == null) {
                        await TwitchApi.chat.sendChatMessage(`Could not remove role ${role.name} from ${username}. User does not exist.`, null, true);
                    } else {
                        customRoleManager.removeViewerFromRole(role.id, user.id);
                        await TwitchApi.chat.sendChatMessage(`Removed role ${role.name} from ${username}`, null, true);
                    }
                }
                break;
            }
            case "list": {
                if (args.length > 1) {
                    const username = args[1].replace("@", "");
                    const user = await TwitchApi.users.getUserByName(username);
                    if (user == null) {
                        await TwitchApi.chat.sendChatMessage(`Could not get roles for ${username}. User does not exist.`, null, true);
                    } else {
                        const roleNames = customRoleManager.getAllCustomRolesForViewer(user.id).map(r => r.name);
                        if (roleNames.length < 1) {
                            await TwitchApi.chat.sendChatMessage(`${username} has no custom roles assigned.`, null, true);
                        } else {
                            await TwitchApi.chat.sendChatMessage(`${username}'s custom roles: ${roleNames.join(", ")}`, null, true);
                        }
                    }

                } else {
                    const roleNames = customRoleManager.getCustomRoles().map(r => r.name);
                    if (roleNames.length < 1) {
                        await TwitchApi.chat.sendChatMessage(`There are no custom roles available.`, null, true);
                    } else {
                        await TwitchApi.chat.sendChatMessage(`Available custom roles: ${roleNames.join(", ")}`, null, true);
                    }
                }
                break;
            }
            default:
                await TwitchApi.chat.sendChatMessage("Incorrect command usage!", null, true);
        }
    }
};