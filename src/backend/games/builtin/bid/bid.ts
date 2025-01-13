import { FirebotGame } from "../../../../types/game-manager";
import bidCommand from "./bid-command";
import { BidSettings } from "./bid-settings";

const bidGame: FirebotGame<BidSettings> = {
    id: "firebot-bid",
    name: "Bid",
    subtitle: "Put something up for auction",
    description: "This allows the Streamer (or mods) to start an auction for something which users can then place bids for. Useful as a giveaway tool that uses channel currency! Once bidding has started, users can type '!bid [bidAmount]' in chat. When a user is outbid they get their currency back. The winner will lose whatever currency they bid.",
    icon: "fa-gavel",
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
                minBid: {
                    type: "number",
                    title: "Minimum Opening Bid",
                    placeholder: "Enter amount",
                    description: "The minimum amount for the opening bid.",
                    tip: "Optional.",
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
                    description: "User must bid at least this amount over the highest bidder.",
                    tip: "Optional.",
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
                    description: "Whoever is the highest bidder after this time will win.",
                    tip: "Optional.",
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
                    description: "Cooldown is applied per viewer. A user can only place a bid this often.",
                    tip: "Optional.",
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
    onLoad: () => {
        bidCommand.registerBidCommand();
    },
    onUnload: () => {
        bidCommand.unregisterBidCommand();
        bidCommand.purgeCaches();
    },
    onSettingsUpdate: () => {
        bidCommand.purgeCaches();
    }
};

export default bidGame;
