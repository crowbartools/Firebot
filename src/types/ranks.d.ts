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
        trackBy?: "view_time" | "currency" | "metadata";
        currencyId?: string;
        metadataKey?: string;
        viewerRestrictions?: {
            roleIds?: string[];
        };
        announcePromotionsInChat?: boolean;
        customPromotionMessageTemplate?: string;
        showBadgeInChat?: boolean;
    };
    ranks: Rank[];
};