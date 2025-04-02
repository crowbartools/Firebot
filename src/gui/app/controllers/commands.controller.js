"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("commandsController", function(
            $scope,
            $rootScope,
            commandsService,
            utilityService,
            backendCommunicator,
            objectCopyHelper,
            sortTagsService,
            ngToast
        ) {
            // Cache commands on app load.
            commandsService.refreshCommands();

            $scope.activeCmdTab = 0;

            $scope.commandsService = commandsService;
            $scope.sts = sortTagsService;

            $scope.manuallyTriggerCommand = (id) => {
                backendCommunicator.send("command-manual-trigger", id);
            };

            $scope.toggleCustomCommandActiveState = (command) => {
                if (command == null) {
                    return;
                }

                command.active = !command.active;
                commandsService.saveCustomCommand(command);
            };

            $scope.toggleCustomCommandVisibilityState = (command) => {
                if (command == null) {
                    return;
                }

                command.hidden = !command.hidden;
                commandsService.saveCustomCommand(command);
            };

            $scope.deleteCustomCommand = (command) => {
                utilityService.showConfirmationModal({
                    title: "Delete Command",
                    question: `Are you sure you want to delete the command '${command.trigger}'?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed) => {
                    if (confirmed) {
                        commandsService.deleteCustomCommand(command);
                    }
                });
            };

            $scope.duplicateCustomCommand = (command) => {
                const copiedCommand = objectCopyHelper.copyObject("command", command);

                // Make sure fallback ID is correct
                if (copiedCommand.fallbackSubcommand?.id != null) {
                    copiedCommand.fallbackSubcommand.id = "fallback-subcommand";
                }

                while (commandsService.triggerExists(copiedCommand.trigger)) {
                    copiedCommand.trigger += "copy";
                }

                commandsService.saveCustomCommand(copiedCommand);
            };

            $scope.openAddOrEditCustomCommandModal = function(command) {
                utilityService.showModal({
                    component: "addOrEditCustomCommandModal",
                    breadcrumbName: command ? "Edit Command" : "Add Command",
                    resolveObj: {
                        command: () => command
                    },
                    closeCallback: (resp) => {
                        const action = resp.action,
                            command = resp.command;

                        switch (action) {
                            case "add":
                            case "update":
                                commandsService.saveCustomCommand(command);
                                break;
                            case "delete":
                                commandsService.deleteCustomCommand(command);
                                break;
                        }
                    }
                });
            };

            $scope.openFirebotProfilePage = async () => {
                ngToast.create({
                    className: "info",
                    content: "Opening Firebot profile page..."
                });
                const profileToken = await backendCommunicator.fireEventAsync("get-firebot-profile-token");
                if (profileToken) {
                    $rootScope.openLinkExternally(`https://firebot.app/profile?id=${profileToken}`);
                }
            };

            $scope.resetActiveCooldowns = () => {
                commandsService.resetActiveCooldowns();
            };

            $scope.resetCooldownsForCommand = (command) => {
                commandsService.resetCooldownsForCommand(command.id);
            };

            $scope.saveAllCommands = (commands) => {
                commandsService.saveAllCustomCommands(commands ?? commandsService.commandsCache.customCommands);
            };

            $scope.commandMenuOptions = (item) => {
                const command = item;
                return [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: () => {
                            $scope.openAddOrEditCustomCommandModal(command);
                        }
                    },
                    {
                        html: `<a href ><i class="iconify" data-icon="mdi:clock-fast" style="margin-right: 10px;"></i> Clear Cooldowns</a>`,
                        click: () => {
                            $scope.resetCooldownsForCommand(command);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${item.active ? "Disable Command" : "Enable Command"}</a>`,
                        click: () => {
                            $scope.toggleCustomCommandActiveState(command);
                        }
                    },
                    {
                        html: `<a href ><i class="${item.hidden ? "fas fa-eye" : "fas fa-eye-slash"}" style="margin-right: 10px;"></i> ${item.hidden ? "Show Command" : "Hide Command"}</a>`,
                        click: () => {
                            $scope.toggleCustomCommandVisibilityState(command);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: () => {
                            $scope.duplicateCustomCommand(command);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: () => {
                            $scope.deleteCustomCommand(command);
                        }
                    }
                ];
            };

            $scope.customCommandHeaders = [
                {
                    name: "TRIGGER",
                    icon: "fa-exclamation",
                    dataField: "trigger",
                    sortable: true,
                    cellClass: "command-trigger-cell",
                    cellTemplate: `
                        <span
                            class="trigger"
                            uib-tooltip="{{data.trigger}}"
                            tooltip-popup-delay="500"
                            tooltip-append-to-body="true"
                        >{{data.trigger}}</span>
                        <tooltip
                            ng-if="data.triggerIsRegex"
                            text="'Description: ' + data.regexDescription"
                        ></tooltip>
                        <span
                            class="muted ml-2"
                            style="font-size: 11px"
                            ng-show="data.hidden"
                            uib-tooltip="Hidden from !commands list"
                            tooltip-append-to-body="true"
                        >
                            <i class="fas fa-eye-slash"></i>
                        </span>
                    `,
                    cellController: () => {}
                },
                {
                    name: "COOLDOWNS",
                    icon: "fa-clock",
                    cellTemplate: `
                        <span
                            style="min-width: 51px; display: inline-block"
                            uib-tooltip="Global cooldown"
                        >
                            <i class="far fa-globe-americas"></i>
                            {{data.cooldown.global ? data.cooldown.global + "s" : "-" }}
                        </span>
                        <span uib-tooltip="User cooldown">
                            <i class="far fa-user"></i> {{data.cooldown.user ? data.cooldown.user + "s" : "-" }}
                        </span>
                    `,
                    cellController: () => {}
                },
                {
                    name: "PERMISSIONS",
                    icon: "lock-alt",
                    cellTemplate: `
                        <span style="text-transform: capitalize">{{getPermissionType(data)}}</span>
                        <tooltip
                            type="info"
                            text="getPermissionTooltip(data)"
                        ></tooltip>
                    `,
                    cellController: ($scope, viewerRolesService, viewerRanksService) => {
                        $scope.getPermissionType = (command) => {

                            const permissions = command.restrictionData && command.restrictionData.restrictions &&
                    command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                            if (permissions) {
                                if (permissions.mode === "roles") {
                                    return "Roles & Ranks";
                                } else if (permissions.mode === "viewer") {
                                    return "Viewer";
                                }
                            } else {
                                return "None";
                            }
                        };

                        $scope.getPermissionTooltip = (command) => {

                            const permissions = command.restrictionData && command.restrictionData.restrictions &&
                    command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                            if (permissions) {
                                if (permissions.mode === "roles") {
                                    const roleIds = permissions.roleIds;
                                    let rolesOutput = "None selected";
                                    if (roleIds.length > 0) {
                                        rolesOutput = roleIds
                                            .filter(id => viewerRolesService.getRoleById(id) != null)
                                            .map(id => viewerRolesService.getRoleById(id).name)
                                            .join(", ");
                                    }
                                    const rolesDisplay = `Roles (${rolesOutput})`;

                                    const ranks = permissions.ranks ?? [];
                                    let ranksOutput = "None selected";
                                    if (ranks.length > 0) {
                                        const groupedByLadder = ranks.reduce((acc, r) => {
                                            if (!acc.some(l => l.ladderId === r.ladderId)) {
                                                acc.push({ ladderId: r.ladderId, rankIds: [] });
                                            }
                                            const ladder = acc.find(l => l.ladderId === r.ladderId);
                                            ladder.rankIds.push(r.rankId);
                                            return acc;
                                        }, []);
                                        ranksOutput = groupedByLadder
                                            .filter(r => viewerRanksService.getRankLadder(r.ladderId) != null)
                                            .map((r) => {
                                                const ladder = viewerRanksService.getRankLadder(r.ladderId);
                                                const rankNames = r.rankIds
                                                    .map(id => ladder.ranks.find(rank => rank.id === id))
                                                    .filter(rank => rank != null)
                                                    .map(rank => rank.name);
                                                return `${ladder.name}: ${rankNames.join(", ")}`;
                                            })
                                            .join(", ");
                                    }
                                    const ranksDisplay = `Ranks (${ranksOutput})`;

                                    const itemsToDisplay = [];
                                    if (rolesOutput !== "None selected") {
                                        itemsToDisplay.push(rolesDisplay);
                                    }
                                    if (ranksOutput !== "None selected") {
                                        itemsToDisplay.push(ranksDisplay);
                                    }
                                    return itemsToDisplay.length > 0 ? itemsToDisplay.join(", ") : "Roles/Ranks (None selected)";
                                } else if (permissions.mode === "viewer") {
                                    return `Viewer (${permissions.username ? permissions.username : 'No name'})`;
                                }
                            } else {
                                return "This command is available to everyone";
                            }
                        };
                    }
                }
            ];
        });
}());
