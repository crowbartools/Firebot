import { FirebotGame } from "../../../../types/game-manager";
import heistCommand from "./heist-command";
import { HeistSettings } from "./heist-settings";

const heistGame: FirebotGame<HeistSettings> = {
    id: "firebot-heist",
    name: "Heist",
    subtitle: "Score big as a team",
    description: "This game allows viewers to wager their currency by participating in a heist. If they succeed, they will get a payout based on their initial wager. Feel free to edit all of the messages to completely change the theme!",
    icon: "fa-sack-dollar",
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
                        min: 1
                    }
                },
                minWager: {
                    type: "number",
                    title: "Min Wager Amount",
                    placeholder: "Enter amount",
                    default: 1,
                    sortRank: 3,
                    validation: {
                        min: 1
                    }
                },
                maxWager: {
                    type: "number",
                    title: "Max Wager Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    sortRank: 4,
                    validation: {
                        min: 1
                    }
                }
            }
        },
        successChanceSettings: {
            title: "Success Chances",
            sortRank: 3,
            settings: {
                successChances: {
                    type: "role-percentages",
                    description: "The chances the viewer has of surviving a heist",
                    tip: "The success chance for the first user role a viewer has in this list is used, so ordering is important!"
                }
            }
        },
        winningsMultiplierSettings: {
            title: "Winnings Multiplier",
            sortRank: 4,
            settings: {
                multipliers: {
                    type: "role-numbers",
                    description: "The winnings multiplier per user role",
                    tip: "The winnings are calculated as: WagerAmount * Multiplier",
                    settings: {
                        defaultBase: 1.5,
                        defaultOther: 2,
                        min: 1,
                        max: null
                    }
                }
            }
        },
        generalSettings: {
            title: "General Settings",
            sortRank: 2,
            settings: {
                minimumUsers: {
                    type: "number",
                    title: "Minimum Users",
                    description: "The minimum required users before starting.",
                    placeholder: "Enter count",
                    default: 1,
                    sortRank: 1,
                    validation: {
                        min: 1
                    }
                },
                startDelay: {
                    type: "number",
                    title: "Start Delay (mins)",
                    description: "The delay time before a heist starts to allow people to join.",
                    placeholder: "Enter mins",
                    default: 2,
                    sortRank: 2,
                    validation: {
                        min: 1
                    }
                },
                cooldown: {
                    type: "number",
                    title: "Cooldown (mins)",
                    description: "The cooldown before another heist can be triggered.",
                    placeholder: "Enter mins",
                    default: 5,
                    sortRank: 3,
                    validation: {
                        min: 1
                    }
                }
            }
        },
        entryMessages: {
            title: "Entry Messages",
            sortRank: 6,
            settings: {
                onJoin: {
                    type: "string",
                    title: "On Join",
                    description: "Sent when a user joins the heist (leave empty for no message).",
                    useTextArea: true,
                    default: "{user} has joined the heist with {wager} {currency}!",
                    tip: "Available variables: {user}, {wager}, {currency}",
                    sortRank: 1
                },
                alreadyJoined: {
                    type: "string",
                    title: "Already Joined",
                    description: "Sent when a user has already joined the heist (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, you've already joined the heist team!",
                    tip: "Available variables: {user}",
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
                wagerAmountTooLow: {
                    type: "string",
                    title: "Wager Amount Too Low",
                    description: "Sent when a user uses a wager amount below the minimum (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, the wager amount must be at least {minWager}!",
                    tip: "Available variables: {user}, {minWager}",
                    sortRank: 5
                },
                wagerAmountTooHigh: {
                    type: "string",
                    title: "Wager Amount Too High",
                    description: "Sent when a user uses a wager amount above the maximum (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, the wager amount can be no more than {maxWager}!",
                    tip: "Available variables: {user}, {maxWager}",
                    sortRank: 6
                },
                notEnoughToWager: {
                    type: "string",
                    title: "Not Enough To Wager",
                    description: "Sent when a user tries to wager more than they have (leave empty for no message).",
                    useTextArea: true,
                    default: "{user}, you don't have enough to wager this amount!",
                    tip: "Available variables: {user}",
                    sortRank: 7
                }
            }
        },
        generalMessages: {
            title: "General Messages",
            sortRank: 5,
            settings: {
                teamCreation: {
                    type: "string",
                    title: "Team Creation",
                    description: "Sent when a heist is triggered by someone (leave empty for no message).",
                    useTextArea: true,
                    default: "@{user} is looking to put a team together for a heist! To join the team, type {command} [amount]",
                    tip: "Available variables: {user}, {command}, {maxWager}, {minWager}, {minimumUsers}"
                },
                onCooldown: {
                    type: "string",
                    title: "When On Cooldown",
                    description: "Sent when someone tries to trigger the heist and it is on cooldown (leave empty for no message).",
                    useTextArea: true,
                    default: "The area is still too hot! Better wait awhile. Cooldown: {cooldown}",
                    tip: "Available variables: {cooldown}"
                },
                cooldownOver: {
                    type: "string",
                    title: "Cooldown Over",
                    description: "Sent when the cooldown is over (leave empty for no message).",
                    useTextArea: true,
                    default: "The coast is clear! Time to get a team together for another heist, type {command} [amount]",
                    tip: "Available variables: {command}"
                },
                startMessage: {
                    type: "string",
                    title: "Heist Started",
                    description: "Sent when the heist has started (leave empty for no message).",
                    useTextArea: true,
                    default: "It's time! Everyone checks their weapons and equipment before jumping out of the getaway car and running into the bank."
                },
                teamTooSmall: {
                    type: "string",
                    title: "Team Too Small",
                    description: "Sent when the start delay has ended and team size doesn't mean the Required Users count (leave empty for no message).",
                    useTextArea: true,
                    default: "Unfortunately @{user} wasn't able to get a team together in time and the heist has been canceled.",
                    tip: "Available variables: {user}"
                },
                heistWinnings: {
                    type: "string",
                    title: "Heist Winnings",
                    description: "Sent at the completion of the heist, lists those who survived and their winnings (leave empty for no message).",
                    useTextArea: true,
                    default: "Winnings: {winnings}",
                    tip: "Available variables: {winnings}"
                }
            }
        },
        groupOutcomeMessages: {
            title: "Group Outcome Messages",
            sortRank: 7,
            settings: {
                hundredPercent: {
                    type: "editable-list",
                    title: "100% Victory",
                    default: [
                        "The heist was a complete success and everyone escaped in the getaway car!"
                    ],
                    description: "One of these will be chosen at random.",
                    sortRank: 5,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                },
                top25Percent: {
                    type: "editable-list",
                    title: "75-99% Victory",
                    default: [
                        "A few went down as they exited the bank, but most of the team made it!"
                    ],
                    description: "One of these will be chosen at random.",
                    sortRank: 4,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                },
                mid50Percent: {
                    type: "editable-list",
                    title: "25-74% Victory",
                    default: [
                        "The security was tighter than expected and many were lost in the gunfire, but some made it out with cash."
                    ],
                    description: "One of these will be chosen at random.",
                    sortRank: 3,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                },
                bottom25Percent: {
                    type: "editable-list",
                    title: "1-24% Victory",
                    default: [
                        "Just about everybody died, a lucky few made it to the boat with what cash was left..."
                    ],
                    description: "One of these will be chosen at random.",
                    sortRank: 2,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                },
                zeroPercent: {
                    type: "editable-list",
                    title: "0% Victory",
                    default: [
                        "Despite your best efforts, the entire team was lost..."
                    ],
                    description: "One of these will be chosen at random.",
                    sortRank: 1,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                }
            }
        },
        soloOutcomeMessages: {
            title: "Solo Outcome Messages",
            sortRank: 8,
            settings: {
                soloSuccess: {
                    type: "editable-list",
                    title: "Solo Success",
                    description: "Sent when a heist is successful with a solo team (One message is chosen at random)",
                    default: [
                        "@{user} managed to complete the heist on their own and made out with a huge bag of money!"
                    ],
                    tip: "Available variables: {user}",
                    sortRank: 1,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                },
                soloFail: {
                    type: "editable-list",
                    title: "Solo Fail",
                    description: "Sent when a heist fails with a solo team (One message is chosen at random)",
                    default: [
                        "Nothing went right for @{user} and they were apprehended!"
                    ],
                    tip: "Available variables: {user}",
                    sortRank: 2,
                    settings: {
                        useTextArea: true,
                        sortable: false,
                        addLabel: "New Message",
                        editLabel: "Edit Message",
                        noneAddedText: "None saved"
                    }
                }
            }
        },
        chatSettings: {
            title: "Chat Settings",
            sortRank: 9,
            settings: {
                chatter: {
                    type: "chatter-select",
                    title: "Chat As"
                }
            }
        }
    },
    onLoad: () => {
        heistCommand.registerHeistCommand();
    },
    onUnload: () => {
        heistCommand.unregisterHeistCommand();
        heistCommand.clearCooldown();
    },
    onSettingsUpdate: () => {
        heistCommand.clearCooldown();
    }
};

export default heistGame;
