import { FirebotGame } from "../../../../types/game-manager";
import { SlotSettings } from "./slot-settings";
import spinCommand from "./spin-command";

const slotsGame: FirebotGame<SlotSettings> = {
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
            sortRank: 5,
            settings: {
                alreadySpinning: {
                    type: "string",
                    title: "Already Spinning",
                    description: "When someone tries to spin too fast (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, your slot machine is actively working!",
                    tip: "Available variables: {username}",
                    sortRank: 1
                },
                onCooldown: {
                    type: "string",
                    title: "On Cooldown",
                    description: "When the command is on cooldown for a user (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, your slot machine is currently on cooldown. Time remaining: {timeRemaining}",
                    tip: "Available variables: {username}, {timeRemaining}",
                    sortRank: 2
                },
                noWagerAmount: {
                    type: "string",
                    title: "No Wager Amount",
                    description: "Sent when a user leaves out the wager amount (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, please include a wager amount!",
                    tip: "Available variables: {user}",
                    sortRank: 3
                },
                invalidWagerAmount: {
                    type: "string",
                    title: "Invalid Wager Amount",
                    description: "Sent when a user uses an invalid wager amount (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, please include a valid wager amount!",
                    tip: "Available variables: {user}",
                    sortRank: 4
                },
                moreThanZero: {
                    type: "string",
                    title: "More Than 0",
                    description: "When the user tries to spin with 0 currency (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, your wager amount must be more than 0.",
                    tip: "Available variables: {username}",
                    sortRank: 5
                },
                minWager: {
                    type: "string",
                    title: "Amount Too Low",
                    description: "When the wager amount is too low (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, your wager amount must be at least {minWager}.",
                    tip: "Available variables: {username}, {minWager}",
                    sortRank: 6
                },
                maxWager: {
                    type: "string",
                    title: "Amount Too High",
                    description: "When the wager amount is too high (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, your wager amount can be no more than {maxWager}.",
                    tip: "Available variables: {username}, {maxWager}",
                    sortRank: 7
                },
                notEnough: {
                    type: "string",
                    title: "Not Enough",
                    description: "When the user doesn't have enough to wager the chosen amount (leave empty for no message).",
                    useTextArea: true,
                    default: "{username}, you don't have enough to wager this amount!",
                    tip: "Available variables: {username}",
                    sortRank: 8
                },
                spinInAction: {
                    type: "string",
                    title: "Spinning In Action",
                    description: "When the spin is going on (leave empty for no message).",
                    useTextArea: true,
                    default: "{username} pulls back the lever...",
                    tip: "Available variables: {username}",
                    sortRank: 9
                },
                spinSuccessful: {
                    type: "string",
                    title: "Spin successful",
                    description: "When the spin is successful (leave empty for no message).",
                    useTextArea: true,
                    default: "{username} hit {successfulRolls} out of 3 and won {winningsAmount} {currencyName}!",
                    tip: "Available variables: {username}, {successfulRolls}, {winningsAmount}, {currencyName}",
                    sortRank: 10
                }
            }
        },
        chatSettings: {
            title: "Chat Settings",
            sortRank: 6,
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

export default slotsGame;
