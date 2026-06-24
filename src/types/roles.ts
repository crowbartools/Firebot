export interface FirebotRole {
    id: string;
    name: string;
}

export type CustomRole = {
    id: string;
    name: string;
    viewers: Array<{
        id: string;
        username: string;
        displayName: string;
    }>;
    showBadgeInChat?: boolean;
};

export type LegacyCustomRole = {
    id: string;
    name: string;
    viewers: string[];
};