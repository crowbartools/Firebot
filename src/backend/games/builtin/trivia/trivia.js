"use strict";
const triviaCommand = require("./trivia-command");
/**
 * @type {import('../../game-manager').FirebotGame}
 */
module.exports = {
    id: "firebot-trivia",
    name: "Trivia",
    subtitle: "Knowledge is power",
    description: "Users can wager currency to answer a random trivia question. Trivia questions are sourced from https://opentdb.com/",
    icon: "fa-head-side-brain",
    settingCategories: {
        currencySettings: {
            title: "Currency Settings",
            sortRank: 1,
            settings: {
                currencyId: {
                    type: "currency-select",
                    title: "Currency",
                    description: "Which currency to use for bidding.",
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
        questionSettings: {
            title: "Question Settings",
            sortRank: 2,
            settings: {
                enabledCategories: {
                    type: "multiselect",
                    title: "Enabled Categories",
                    description: "Categories of questions that are enabled",
                    default: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32],
                    settings: {
                        options: [
                            {
                                "id": 9,
                                "name": "General Knowledge"
                            },
                            {
                                "id": 10,
                                "name": "Entertainment: Books"
                            },
                            {
                                "id": 11,
                                "name": "Entertainment: Film"
                            },
                            {
                                "id": 12,
                                "name": "Entertainment: Music"
                            },
                            {
                                "id": 13,
                                "name": "Entertainment: Musicals & Theatres"
                            },
                            {
                                "id": 14,
                                "name": "Entertainment: Television"
                            },
                            {
                                "id": 15,
                                "name": "Entertainment: Video Games"
                            },
                            {
                                "id": 16,
                                "name": "Entertainment: Board Games"
                            },
                            {
                                "id": 17,
                                "name": "Science & Nature"
                            },
                            {
                                "id": 18,
                                "name": "Science: Computers"
                            },
                            {
                                "id": 19,
                                "name": "Science: Mathematics"
                            },
                            {
                                "id": 20,
                                "name": "Mythology"
                            },
                            {
                                "id": 21,
                                "name": "Sports"
                            },
                            {
                                "id": 22,
                                "name": "Geography"
                            },
                            {
                                "id": 23,
                                "name": "History"
                            },
                            {
                                "id": 24,
                                "name": "Politics"
                            },
                            {
                                "id": 25,
                                "name": "Art"
                            },
                            {
                                "id": 26,
                                "name": "Celebrities"
                            },
                            {
                                "id": 27,
                                "name": "Animals"
                            },
                            {
                                "id": 28,
                                "name": "Vehicles"
                            },
                            {
                                "id": 29,
                                "name": "Entertainment: Comics"
                            },
                            {
                                "id": 30,
                                "name": "Science: Gadgets"
                            },
                            {
                                "id": 31,
                                "name": "Entertainment: Japanese Anime & Manga"
                            },
                            {
                                "id": 32,
                                "name": "Entertainment: Cartoon & Animations"
                            }
                        ]
                    },
                    sortRank: 1,
                    validation: {
                        required: true
                    }
                },
                enabledDifficulties: {
                    type: "multiselect",
                    title: "Enabled Difficulties",
                    default: ["easy", "medium", "hard"],
                    settings: {
                        options: [
                            {
                                id: "easy",
                                name: "Easy"
                            },
                            {
                                id: "medium",
                                name: "Medium"
                            },
                            {
                                id: "hard",
                                name: "Hard"
                            }
                        ]
                    },
                    sortRank: 2,
                    validation: {
                        required: true
                    }
                },
                enabledTypes: {
                    type: "multiselect",
                    title: "Enabled Question Types",
                    default: ["multiple", "boolean"],
                    settings: {
                        options: [
                            {
                                id: "boolean",
                                name: "True/False"
                            },
                            {
                                id: "multiple",
                                name: "Multiple Choice"
                            }
                        ]
                    },
                    sortRank: 3,
                    validation: {
                        required: true
                    }
                },
                answerTime: {
                    type: "number",
                    title: "Answer Time (secs)",
                    description: "The amount of time in seconds users have to answer a question.",
                    placeholder: "Enter secs",
                    default: 30,
                    sortRank: 4,
                    validation: {
                        required: true,
                        min: 10
                    }
                }
            }
        },
        multiplierSettings: {
            title: "Winnings Multipliers",
            sortRank: 3,
            settings: {
                easyMultipliers: {
                    title: "Easy Multiplier",
                    type: "role-numbers",
                    description: "The winnings multiplier per user role for Easy questions",
                    tip: "The winnings are calculated as: WagerAmount * Multiplier",
                    sortRank: 1,
                    settings: {
                        defaultBase: 1.50,
                        defaultOther: 1.60,
                        min: 1,
                        max: null
                    }
                },
                mediumMultipliers: {
                    title: "Medium Multiplier",
                    type: "role-numbers",
                    description: "The winnings multiplier per user role for Medium questions",
                    tip: "The winnings are calculated as: WagerAmount * Multiplier",
                    sortRank: 2,
                    settings: {
                        defaultBase: 2.00,
                        defaultOther: 2.25,
                        min: 1,
                        max: null
                    }
                },
                hardMultipliers: {
                    title: "Hard Multiplier",
                    type: "role-numbers",
                    description: "The winnings multiplier per user role for Hard questions",
                    tip: "The winnings are calculated as: WagerAmount * Multiplier",
                    sortRank: 3,
                    settings: {
                        defaultBase: 3,
                        defaultOther: 3.50,
                        min: 1,
                        max: null
                    }
                }
            }
        },
        cooldownSettings: {
            title: "Cooldown",
            sortRank: 4,
            settings: {
                cooldown: {
                    type: "number",
                    title: "Cooldown (secs)",
                    placeholder: "Enter secs",
                    description: "Cooldown is applied per viewer.",
                    tip: "Optional.",
                    default: 300,
                    validation: {
                        min: 0
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
                    title: "Chat As",
                    sortRank: 1
                },
                noWagerMessage: {
                    type: "string",
                    title: "No Wager Message",
                    useTextArea: true,
                    default: "Incorrect trivia usage: !trivia [wager]",
                    tip: "Available variables: {user}",
                    sortRank: 2,
                    validation: {
                        required: true
                    }
                },
                postCorrectAnswer: {
                    type: "boolean",
                    title: "Post Correct Answer",
                    tip: "Post the correct answer in chat if the viewer answered incorrectly.",
                    default: false,
                    sortRank: 3,
                    validation: {
                        required: true
                    }
                }
            }
        }
    },
    onLoad: () => {
        triviaCommand.registerTriviaCommand();
    },
    onUnload: () => {
        triviaCommand.unregisterTriviaCommand();
        triviaCommand.purgeCaches();
    },
    onSettingsUpdate: () => {
        triviaCommand.purgeCaches();
    }
};