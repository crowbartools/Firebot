export type ModerationTerm = {
    text: string;
    createdAt: number;
};

export type ModerationUser = {
    id: string;
    username: string;
    displayName: string;
};

export type AllowedUser = {
    id: string;
    username: string;
    displayName: string;
    createdAt: number;
};

export type BannedWords = {
    words: ModerationTerm[];
};

export type BannedRegularExpressions = {
    regularExpressions: ModerationTerm[];
};

export type AllowList = {
    urls: ModerationTerm[];
    users: AllowedUser[];
};

export type ModerationImportRequest = {
    filePath: string;
    delimiter: "newline" | "comma" | "space";
};

export type ChatModerationSettings = {
    bannedWordList: {
        enabled: boolean;
        exemptRoles: string[];
        outputMessage?: string;
    };
    emoteLimit: {
        enabled: boolean;
        exemptRoles: string[];
        max: number;
        outputMessage?: string;
    };
    urlModeration: {
        enabled: boolean;
        exemptRoles: string[];
        viewTime: {
            enabled: boolean;
            viewTimeInHours: number;
        };
        outputMessage?: string;
    };
    exemptRoles: string[];
};