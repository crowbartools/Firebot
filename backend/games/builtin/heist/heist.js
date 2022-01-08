"use strict";

const heistCommand = require("./heist-command");

/**
 * @type {import('../../game-manager').FirebotGame}
 */
module.exports = {
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
                    description: "The chances the viewer has of being surviving a heist",
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
                    useTextArea: true,
                    default: "{user} has joined the heist with {wager} {currency}!",
                    tip: "Available variables: {user}, {wager}, {currency}",
                    sortRank: 1,
                    validation: {
                        required: true
                    }
                },
                alreadyJoined: {
                    type: "string",
                    title: "Already Joined",
                    useTextArea: true,
                    default: "{user}, you've already joined the heist team!",
                    tip: "Available variables: {user}",
                    sortRank: 2,
                    validation: {
                        required: true
                    }
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
                    description: "Sent when a heist is triggered by someone.",
                    useTextArea: true,
                    default: "@{user} is looking to put a team together for a heist! To join the team, type {command} [amount]",
                    tip: "Available variables: {user}, {command}, {maxWager}, {minWager}, {minimumUsers}",
                    validation: {
                        required: true
                    }
                },
                onCooldown: {
                    type: "string",
                    title: "When On Cooldown",
                    description: "Sent when someone tries to trigger the heist and it's on cooldown.",
                    useTextArea: true,
                    default: "The area is still too hot! Better wait awhile. Cooldown: {cooldown}",
                    tip: "Available variables: {cooldown}",
                    validation: {
                        required: true
                    }
                },
                cooldownOver: {
                    type: "string",
                    title: "Cooldown Over",
                    description: "Sent when the cooldown is over.",
                    useTextArea: true,
                    default: "The coast is clear! Time to get a team together for another heist, type {command} [amount]",
                    tip: "Available variables: {command}",
                    validation: {
                        required: true
                    }
                },
                startMessage: {
                    type: "string",
                    title: "Heist Started",
                    description: "Sent when the heist has started.",
                    useTextArea: true,
                    default: "It's time! Everyone checks their weapons and equipment before jumping out of the getaway car and running into the bank.",
                    validation: {
                        required: true
                    }
                },
                teamTooSmall: {
                    type: "string",
                    title: "Team Too Small",
                    description: "Sent when the start delay has ended and team size doesn't mean the Required Users count.",
                    useTextArea: true,
                    default: "Unfortunately @{user} wasn't able to get a team together in time and the heist has been canceled.",
                    tip: "Available variables: {user}",
                    validation: {
                        required: true
                    }
                },
                heistWinnings: {
                    type: "string",
                    title: "Heist Winnings",
                    description: "Sent at the completion of the heist, lists those who survived and their winnings.",
                    useTextArea: true,
                    default: "Winnings: {winnings}",
                    tip: "Available variables: {winnings}",
                    validation: {
                        required: true
                    }
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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
                        validationText: "Text cannot be empty",
                        noneAddedText: "None saved"
                    },
                    validation: {
                        required: true
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