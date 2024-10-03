"use strict";

// Modal for adding or editing a command

(function () {
    const uuid = require("uuid/v4");

    angular.module("firebotApp").component("addOrEditCustomCommandModal", {
        templateUrl:
            "./directives/modals/commands/addOrEditCustomCommand/addOrEditCustomCommandModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function ($scope, utilityService, commandsService, ngToast, settingsService) {
            const $ctrl = this;

            $ctrl.command = {
                active: true,
                simple: !settingsService.getDefaultToAdvancedCommandMode(),
                sendCooldownMessage: true,
                cooldownMessage: "This command is still on cooldown for: {timeLeft}",
                cooldown: {},
                effects: {
                    id: uuid(),
                    list: []
                },
                restrictionData: {
                    restrictions: [],
                    mode: "all",
                    sendFailMessage: true
                },
                aliases: [],
                sortTags: [],
                treatQuotedTextAsSingleArg: false,
                allowTriggerBySharedChat: "inherit"
            };

            $ctrl.sharedChatRadioOptions = {
                true: "Allow",
                false: "Ignore",
                inherit: { text: "Inherit", tooltip: "Inherit settings from Settings > Triggers > Allow Shared Chat To Trigger Commands" }
            };

            $scope.trigger = "command";

            $scope.aliasesListOptions = {
                useTextArea: false,
                addLabel: "New Alias",
                editLabel: "Edit Alias",
                validationText: "Alias cannot be empty",
                noDuplicates: true
            };

            $ctrl.switchCommandMode = () => {
                const currentlyAdvanced = !$ctrl.command.simple;
                if (currentlyAdvanced) {
                    const willBeRemoved = [];
                    if ($ctrl.command.effects.list.length > 1 ||
                        $ctrl.command.effects.list.some(e => e.type !== "firebot:chat")) {
                        willBeRemoved.push("all effects save for a single Chat effect");
                    }
                    if ($ctrl.command.restrictionData.restrictions.length > 1 ||
                        $ctrl.command.restrictionData.restrictions.some(r => r.type !== "firebot:permissions")) {
                        willBeRemoved.push("all non-Permission restrictions");
                    }
                    if ($ctrl.command.fallbackSubcommand != null ||
                        ($ctrl.command.subCommands && $ctrl.command.subCommands.length > 0)) {
                        willBeRemoved.push("all Subcommands");
                    }
                    if (willBeRemoved.length > 0) {
                        utilityService.showConfirmationModal({
                            title: "Switch To Simple Mode",
                            question: `Switching to Simple Mode will remove: ${willBeRemoved.join(", ")}. Are you sure you want to switch?`,
                            confirmLabel: "Switch",
                            confirmBtnType: "btn-danger"
                        }).then((confirmed) => {
                            if (confirmed) {
                                $ctrl.command.simple = !$ctrl.command.simple;
                                $ctrl.command.subCommands = [];
                                $ctrl.command.fallbackSubcommand = null;
                            }
                        });
                    } else {
                        $ctrl.command.simple = !$ctrl.command.simple;
                    }

                } else {
                    // remove the chat message if the user didnt input anything
                    const responseMessage = $ctrl.command.effects.list[0] && $ctrl.command.effects.list[0].message && $ctrl.command.effects.list[0].message.trim();
                    if (!responseMessage || responseMessage === "") {
                        $ctrl.command.effects.list = [];
                    }
                    $ctrl.command.simple = !$ctrl.command.simple;

                    if ($ctrl.isNewCommand &&
                        !settingsService.getDefaultToAdvancedCommandMode() &&
                        !settingsService.getSeenAdvancedCommandModePopup()) {
                        settingsService.setSeenAdvancedCommandModePopup(true);
                        utilityService.showConfirmationModal({
                            title: "Default Mode",
                            question: `Do you want to always use Advanced Mode for new Commands?`,
                            tip: "Note: You can change this in Settings > Commands at any time",
                            confirmLabel: "Yes",
                            confirmBtnType: "btn-default",
                            cancelLabel: "Not right now",
                            cancelBtnType: "btn-default"
                        }).then((confirmed) => {
                            if (confirmed) {
                                settingsService.setDefaultToAdvancedCommandMode(true);
                                ngToast.create({
                                    className: 'success',
                                    content: "New commands will now default to Advanced Mode.",
                                    timeout: 7000
                                });
                            }
                        });
                    }
                }
            };

            $ctrl.$onInit = function () {
                if ($ctrl.resolve.command == null) {
                    $ctrl.isNewCommand = true;
                } else {
                    $ctrl.command = JSON.parse(JSON.stringify($ctrl.resolve.command));
                    if ($ctrl.command.simple == null) {
                        $ctrl.command.simple = false;
                    }
                }

                if ($ctrl.command.sendCooldownMessage == null) {
                    $ctrl.command.sendCooldownMessage = true;
                }

                if ($ctrl.command.cooldownMessage == null) {
                    $ctrl.command.cooldownMessage = "This command is still on cooldown for: {timeLeft}";
                }

                if ($ctrl.command.aliases == null) {
                    $ctrl.command.aliases = [];
                }

                if ($ctrl.command.treatQuotedTextAsSingleArg == null) {
                    $ctrl.command.treatQuotedTextAsSingleArg = false;
                }

                if ($ctrl.command.allowTriggerBySharedChat == null) {
                    $ctrl.command.allowTriggerBySharedChat = "inherit";
                }
                $ctrl.command.allowTriggerBySharedChat = String($ctrl.command.allowTriggerBySharedChat);
            };

            $ctrl.effectListUpdated = function (effects) {
                $ctrl.command.effects = effects;
            };

            $ctrl.deleteSubcommand = (id) => {
                let name = "fallback";

                if (id !== "fallback-subcommand") {
                    const subCmd = $ctrl.command.subCommands.find(c => c.id === id);

                    switch (subCmd.type) {
                        case "Username":
                            name = "username";
                            break;

                        case "Number":
                            name = "number";
                            break;

                        case "Custom":
                            name = `"${subCmd.arg}"`;
                            break;
                    }
                }

                utilityService.showConfirmationModal({
                    title: "Delete Subcommand",
                    question: `Are you sure you want to delete the ${name} subcommand?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed) => {
                    if (confirmed) {
                        if (id === "fallback-subcommand") {
                            $ctrl.command.fallbackSubcommand = null;
                        } else if ($ctrl.command.subCommands) {
                            $ctrl.command.subCommands = $ctrl.command.subCommands.filter(sc => sc.id !== id);
                        }
                    }
                });
            };

            $ctrl.editSubcommand = (id) => {
                let subcommand;
                if (id === "fallback-subcommand") {
                    subcommand = $ctrl.command.fallbackSubcommand;
                } else if ($ctrl.command.subCommands) {
                    subcommand = $ctrl.command.subCommands.find(sc => sc.id === id);
                }
                if (subcommand) {
                    $ctrl.openAddSubcommandModal(subcommand);
                }
            };

            $ctrl.openAddSubcommandModal = (arg) => {
                utilityService.showModal({
                    component: "addOrEditSubcommandModal",
                    size: "sm",
                    resolveObj: {
                        arg: () => arg,
                        hasAnyArgs: () => !!$ctrl.command.subCommands?.length,
                        hasNumberArg: () => $ctrl.command.subCommands && $ctrl.command.subCommands.some(sc => sc.arg === "\\d+"),
                        hasUsernameArg: () => $ctrl.command.subCommands && $ctrl.command.subCommands.some(sc => sc.arg === "@\\w+"),
                        hasFallbackArg: () => $ctrl.command.fallbackSubcommand != null,
                        otherArgNames: () => $ctrl.command.subCommands && $ctrl.command.subCommands.filter(c => !c.regex && (arg ? c.arg !== arg.arg : true)).map(c => c.arg.toLowerCase()) || []
                    },
                    closeCallback: (newArg) => {
                        if (newArg.fallback) {
                            $ctrl.command.fallbackSubcommand = newArg;
                        } else {
                            if ($ctrl.command.subCommands == null) {
                                $ctrl.command.subCommands = [newArg];
                            } else {
                                $ctrl.command.subCommands = $ctrl.command.subCommands.filter(sc => sc.id !== newArg.id);
                                $ctrl.command.subCommands.push(newArg);
                            }
                        }
                    }
                });
            };

            $ctrl.delete = function () {
                if ($ctrl.isNewCommand) {
                    return;
                }
                utilityService.showConfirmationModal({
                    title: "Delete Command",
                    question: `Are you sure you want to delete this command?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed) => {
                    if (confirmed) {
                        $ctrl.close({ $value: { command: $ctrl.command, action: "delete" } });
                    }
                });
            };

            $ctrl.save = function () {
                if ($ctrl.command.trigger == null || $ctrl.command.trigger === "") {
                    ngToast.create("Please provide a trigger.");
                    return;
                }

                if ($ctrl.command.simple) {
                    const responseMessage = $ctrl.command.effects.list[0] && $ctrl.command.effects.list[0].message && $ctrl.command.effects.list[0].message.trim();
                    if (!responseMessage || responseMessage === "") {
                        ngToast.create("Please provide a response message.");
                        return;
                    }
                }

                if (commandsService.triggerExists($ctrl.command.trigger, $ctrl.command.id)) {
                    ngToast.create("A custom command with this trigger already exists.");
                    return;
                }

                if ($ctrl.command.allowTriggerBySharedChat === "true") {
                    $ctrl.command.allowTriggerBySharedChat = true;
                } else if ($ctrl.command.allowTriggerBySharedChat === "false") {
                    $ctrl.command.allowTriggerBySharedChat = false;
                }

                const action = $ctrl.isNewCommand ? "add" : "update";
                $ctrl.close({
                    $value: {
                        command: $ctrl.command,
                        action: action
                    }
                });
            };
        }
    });
}());
