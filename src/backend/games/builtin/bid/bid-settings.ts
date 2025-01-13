export type BidSettings = {
    currencySettings: {
        currencyId: string;
        minBid?: number;
        minIncrement?: number;
    };
    timeSettings: {
        timeLimit?: number;
    };
    cooldownSettings: {
        cooldown?: number;
    };
    chatSettings: {
        chatter: string;
    };
};
