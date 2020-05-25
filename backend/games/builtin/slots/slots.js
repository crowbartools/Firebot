"use strict";

const spinCommand = require("./spin-command");

const model = {
    id: "firebot-slots",
    name: "Slots",
    subtitle: "Spin to win!",
    description: "This game allows viewers to wager their currency at a Slot Machine. All they need to do is type '!spin [wagerAmount]' in chat to pull the lever! When the lever is pulled, three reels are spun, each of which can HIT or MISS. The number of HITs determines the winnings!",
    icon: "fa-dice-three",
    settingCategories: {
        currencySettings: {
            title: "Currency Settings",
            sortRank: 1,
            settings: {
                currencyId: {
                    type: "currency-select",
                    title: "Currency",
                    description: "Which currency to use for this game.",
                    validation: {
                        required: true
                    }
                },
                minWager: {
                    type: "number",
                    title: "Min Wager Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    validation: {
                        min: 0
                    }
                },
                maxWager: {
                    type: "number",
                    title: "Max Wager Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    validation: {
                        min: 0
                    }
                }
            }
        },
        spinSettings: {
            title: "Spin Settings",
            sortRank: 2,
            settings: {
                successChances: {
                    type: "role-percentages",
                    title: "Roll Success Chances",
                    description: "The chances each roll will be successful (There are 3 rolls per spin)",
                    tip: "The success chance for the first user role a viewer has in this list is used, so ordering is important!"
                },
                multiplier: {
                    type: "number",
                    title: "Winnings Multiplier",
                    description: "The winnings multiplier for each successful roll",
                    tip: "The winnings are calculated as: WagerAmount * (SuccessfulHits * Multiplier)",
                    default: 1,
                    validation: {
                        required: true,
                        min: 1
                    }
                }
            }
        },
        cooldownSettings: {
            title: "Cooldown",
            sortRank: 3,
            settings: {
                cooldown: {
                    type: "number",
                    title: "Cooldown (secs)",
                    placeholder: "Enter secs",
                    tip: "Cooldown is applied per viewer.",
                    default: 300,
                    validation: {
                        min: 0
                    }
                }
            }
        },
        chatSettings: {
            title: "Chat Settings",
            sortRank: 4,
            settings: {
                chatter: {
                    type: "chatter-select",
                    title: "Chat As"
                }
            }
        }
    },
    initializeTrigger: null, // "immediate" | "chat"
    onLoad: settings => {
        if (settings.active) {
            spinCommand.registerSpinCommand();
        }
    },
    onInitialize: settings => {},
    onTerminate: settings => {
        if (!settings.active) {
            spinCommand.unregisterSpinCommand();
        }
        spinCommand.purgeCaches();
    },
    onSettingsUpdate: settings => {
        spinCommand.purgeCaches();
        if (settings.active) {
            spinCommand.registerSpinCommand();
        } else {
            spinCommand.unregisterSpinCommand();
        }
    }
};

module.exports = model;