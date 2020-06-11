"use strict";

const bidCommand = require("./bid-command");

module.exports = {
    id: "firebot-bid",
    name: "Bid",
    subtitle: "Put something up for auction",
    description: "This game allows users to place bids against each other. All they need to do is type '!bid [bidAmount]' in chat! The user bidding must have enough currency to bid and their bid must be higher than the current highest bid.",
    icon: "fa-gavel",
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
                minBid: {
                    type: "number",
                    title: "Min Bid Amount",
                    placeholder: "Enter amount",
                    tip: "Optional",
                    default: 1,
                    sortRank: 2,
                    validation: {
                        min: 1
                    }
                },
                minIncrement: {
                    type: "number",
                    title: "Minimum Bid Raise",
                    placeholder: "Enter amount",
                    tip: "Optional. User must bid at least this amount over the highest bidder.",
                    default: 1,
                    sortRank: 4,
                    validation: {
                        min: 1
                    }
                }
            }
        },
        timeSettings: {
            title: "Time Settings",
            sortRank: 2,
            settings: {
                timeLimit: {
                    type: "number",
                    title: "Time Limit (min)",
                    placeholder: "Enter minutes",
                    tip: "Optional. Whoever is the highest bidder after this time will win.",
                    default: 2,
                    sortRank: 1,
                    validation: {
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
                    default: 5,
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
    onLoad: settings => {
        bidCommand.registerBidCommand();
    },
    onUnload: settings => {
        bidCommand.unregisterBidCommand();
        bidCommand.purgeCaches();
    },
    onSettingsUpdate: settings => {
        bidCommand.purgeCaches();
    }
};