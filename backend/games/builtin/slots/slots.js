"use strict";

const spinCommand = require("./spin-command");

/**
 * @type {import('../../game-manager').FirebotGame}
 */
module.exports = {
    id: "firebot-slots",
    name: "Slots",
    subtitle: "Spin to win",
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
                    sortRank: 1,
                    validation: {
                        required: true
                    }
                },
                defaultWager: {
                    type: "number",
                    title: "Default Wager Amount",
                    description: "The default wager amount to use if a viewer doesn't specify one.",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    sortRank: 2,
                    validation: {
                        min: 0
                    }
                },
                minWager: {
                    type: "number",
                    title: "Min Wager Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    sortRank: 3,
                    validation: {
                        min: 0
                    }
                },
                maxWager: {
                    type: "number",
                    title: "Max Wager Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    sortRank: 4,
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
                    tip: "The success chance for the first user role a viewer has in this list is used, so ordering is important!",
                    sortRank: 1
                },
                multiplier: {
                    type: "number",
                    title: "Winnings Multiplier",
                    description: "The winnings multiplier for each successful roll",
                    tip: "The winnings are calculated as: WagerAmount * (SuccessfulHits * Multiplier)",
                    sortRank: 2,
                    default: 1,
                    validation: {
                        required: true,
                        min: 0.5
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
        generalMessages: {
            title: "General Messages",
            sortRank: 4,
            settings: {
                alreadySpinning: {
                    type: "string",
                    title: "Already Spinning",
                    description: "When someone tries to spin too fast.",
                    useTextArea: true,
                    default: "{username}, your slot machine is actively working!",
                    tip: "Available variables: {username}",
                    validation: {
                        required: true
                    }
                },
                onCooldown: {
                    type: "string",
                    title: "On Cooldown",
                    description: "When the command is on cooldown for a user.",
                    useTextArea: true,
                    default: "{username}, your slot machine is currently on cooldown. Time remaining: {timeRemaining}",
                    tip: "Available variables: {username}, {timeRemaining}",
                    validation: {
                        required: true
                    }
                },
                moreThanZero: {
                    type: "string",
                    title: "More Than 0",
                    description: "When the user tries to spin with 0 currency.",
                    useTextArea: true,
                    default: "{username}, your wager amount must be more than 0.",
                    tip: "Available variables: {username}",
                    validation: {
                        required: true
                    }
                },
                minWager: {
                    type: "string",
                    title: "Amount Too Low",
                    description: "When the wager amount is too low.",
                    useTextArea: true,
                    default: "{username}, your wager amount must be at least {minWager}.",
                    tip: "Available variables: {username}, {minWager}",
                    validation: {
                        required: true
                    }
                },
                maxWager: {
                    type: "string",
                    title: "Amount Too High",
                    description: "When the wager amount is too high.",
                    useTextArea: true,
                    default: "{username}, your wager amount must be at least {maxWager}.",
                    tip: "Available variables: {username}, {maxWager}",
                    validation: {
                        required: true
                    }
                },
                notEnough: {
                    type: "string",
                    title: "Not Enough",
                    description: "When the user doesn't have enough to wager the chosen amount.",
                    useTextArea: true,
                    default: "{username}, you don't have enough to wager this amount!",
                    tip: "Available variables: {username}",
                    validation: {
                        required: true
                    }
                },
                showSpinInAction: {
                    type: "boolean",
                    title: "Show Spinning In Action message",
                    default: true,
                    description: "Whether you want the Spinning In Action to be sent in chat."
                },
                spinInAction: {
                    type: "string",
                    title: "Spinning In Action",
                    description: "When the spin is going on.",
                    useTextArea: true,
                    default: "{username} pulls back the lever...",
                    tip: "Available variables: {username}",
                    validation: {
                        required: true
                    }
                },
                spinSuccessful: {
                    type: "string",
                    title: "Spin successful",
                    description: "When the spin is successful.",
                    useTextArea: true,
                    default: "{username} hit {successfulRolls} out of 3 and won {winningsAmount} {currencyName}!",
                    tip: "Available variables: {username}, {successfulRolls}, {winningsAmount}, {currencyName}",
                    validation: {
                        required: true
                    }
                }
            }
        },
        chatSettings: {
            title: "Chat Settings",
            sortRank: 5,
            settings: {
                chatter: {
                    type: "chatter-select",
                    title: "Chat As"
                }
            }
        }
    },
    onLoad: () => {
        spinCommand.registerSpinCommand();
    },
    onUnload: () => {
        spinCommand.unregisterSpinCommand();
        spinCommand.purgeCaches();
    },
    onSettingsUpdate: () => {
        spinCommand.purgeCaches();
    }
};