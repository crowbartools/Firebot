import type {
    FirebotParameterCategories,
    FirebotParams
} from "./parameters";
import type { Awaitable, ObjectOfUnknowns } from "./util-types";

export type IntegrationParams = Record<string, Record<string, unknown>>;

export type Integration<Params extends IntegrationParams = IntegrationParams> = {
    definition: IntegrationDefinition<Params>;
    integration: IntegrationController<Params>;
};

export type IntegrationDefinition<
    Params extends IntegrationParams = IntegrationParams
> = {
    id: string;
    name: string;
    description: string;
    connectionToggle?: boolean;
    configurable?: boolean;
    settingCategories: FirebotParameterCategories<Params>;
} & (
    | {
        linkType: "id";
        idDetails: {
            steps: string;
        };
    }
    | {
        linkType: "auth";
        authProviderDetails: {
            id: string;
            name: string;
            redirectUriHost?: string;
            client: {
                id: string;
                secret: string;
            };
            auth: {
                tokenHost: string;
                tokenPath: string;
                authorizePath: string;
            };
            autoRefreshToken?: boolean;
            scopes: string;
        };
    }
    | { linkType: "other" | "none" }
);

export interface IntegrationEvents {
    connected: (id: string) => void;
    disconnected: (id: string) => void;
    "settings-update": (id: string, settings: Record<string, any>) => void;
}

type LinkData =
    | {
        accountId: string;
    }
    | {
        auth: Record<string, unknown>;
    }
    | null;

export type IntegrationData<Params extends IntegrationParams = IntegrationParams> = {
    settings: any;
    userSettings?: Params;
    oauth?: any;
    accountId?: string;
};

export interface IntegrationController<
    Params extends IntegrationParams = IntegrationParams
> {
    connected: boolean;
    init(
        linked: boolean,
        integrationData: IntegrationData<Params>
    ): Awaitable<void>;
    link?(linkData: LinkData): Awaitable<void>;
    connect?(
        integrationData: IntegrationData<Params>
    ): Awaitable<void>;
    disconnect?(): Awaitable<void>;
    onUserSettingsUpdate?(
        integrationData: IntegrationData<Params>
    ): Awaitable<void>;
}

export type IntegrationWithUnknowns = {
    definition: IntegrationDefinition & ObjectOfUnknowns;
    integration: IntegrationController & ObjectOfUnknowns;
};