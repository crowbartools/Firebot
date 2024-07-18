export type Rank = {
    id: string;
    name: string;
    value?: number;
};

export type RankLadder = {
    id: string;
    name: string;
    mode: "manual" | "auto";
    settings: {
        trackBy?: "view_time" | "currency",
        currencyId?: string;
        announcePromotionsInChat?: boolean;
    };
    ranks: Rank[];
};