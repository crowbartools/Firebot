import {
    TypedEmitter,
    ListenerSignature
} from "tiny-typed-emitter";
import {
    FirebotParameterCategories,
    FirebotParams
} from "@crowbartools/firebot-custom-scripts-types/types/modules/firebot-parameters";
import {
    AuthProviderDefinition,
    AuthDetails
} from "../backend/auth/auth";

export type AccountIdDefinition = {
    label: string;
    steps: string;
}
export type AccountIdDetails = string

export type IntegrationData<Params extends FirebotParams = FirebotParams> = {
    settings?: Params;
    userSettings?: Params;
    auth?: AuthDetails;
    accountId?: AccountIdDetails;
    linked?: boolean;
};

type LinkIdDefinition = { linkType: "id", idDetails: AccountIdDefinition };
type LinkAuthDefinition = { linkType: "auth", authProviderDetails: AuthProviderDefinition };
type LinkOtherDefinition = { linkType: "other" | "none", [key: string]: unknown };

export type IntegrationDefinition<Params extends FirebotParams = FirebotParams> = {
    id: string;
    name: string;
    description: string;
    connectionToggle?: boolean;
    configurable?: boolean;
    settingCategories: FirebotParameterCategories<Params>;
} & IntegrationData<Params> & (LinkIdDefinition | LinkAuthDefinition | LinkOtherDefinition);

type LinkIdData = { accountId: AccountIdDetails };
type LinkAuthData = { auth: AuthDetails };
export type LinkData = LinkIdData | LinkAuthData | null;

export interface IntegrationEvents {
    "connected": (integrationId: string) => void;
    "disconnected": (integrationId: string) => void;
    "reconnect": (integrationId: string) => void;
    "settings-update": (integrationId: string, settings: FirebotParams) => void;
}

export abstract class IntegrationController<
    Params extends FirebotParams = FirebotParams,
    Events extends IntegrationEvents = IntegrationEvents
> extends TypedEmitter<ListenerSignature<Events>> {
    connected = false;
    abstract init(
        linked: boolean,
        integrationData: IntegrationData<Params>
    ): void | PromiseLike<void>;
    abstract link?(linkData: LinkData): void | PromiseLike<void>;
    abstract unlink?(): void | PromiseLike<void>;
    abstract connect?(
        integrationData: IntegrationData<Params>
    ): void | PromiseLike<void>;
    abstract disconnect?(): void | PromiseLike<void>;
    abstract onUserSettingsUpdate?(
        integrationData: IntegrationData<Params>
    ): void | PromiseLike<void>;
}

export type Integration<
    Params extends FirebotParams = FirebotParams,
    Events extends IntegrationEvents = IntegrationEvents
> = {
    definition: IntegrationDefinition<Params>;
    integration: IntegrationController<Params, Events>;
};

export interface IntegrationManagerEvents {
    "integrationRegistered": (integration: Integration) => void;
    "integration-connected": (integrationId: string) => void;
    "integration-disconnected": (integrationId: string) => void;
    "token-refreshed": (data: {integrationId: string, updatedToken: AuthDetails}) => void;
}

export declare class IntegrationManager extends TypedEmitter<IntegrationManagerEvents> {
    private _integrations;
    constructor();
    registerIntegration(integration: Integration): void;
    getIntegrationUserSettings<Params extends FirebotParams = FirebotParams>(integrationId: string): Params;
    saveIntegrationUserSettings(id: string, settings: FirebotParams, notifyInt?: boolean): void;
    getIntegrationById<Params extends FirebotParams = FirebotParams>(integrationId: string): Integration<Params>;
    getIntegrationDefinitionById<Params extends FirebotParams = FirebotParams>(integrationId: string): IntegrationDefinition<Params>;
    integrationIsConnectable(integrationId: string): boolean;
    getAllIntegrationDefinitions(): Array<IntegrationDefinition>;
    saveIntegrationAuth(integration: Integration, authData: AuthDetails): void;
    getIntegrationAccountId(integrationId: string): AccountIdDetails;
    saveIntegrationAccountId(integration: Integration, accountId: AccountIdDetails): void;
    startIntegrationLink(integrationId: string): void;
    linkIntegration(int: Integration, linkData: LinkData): Promise<void>;
    unlinkIntegration(integrationId: string): Promise<void>;
    connectIntegration(integrationId: string): Promise<void>;
    disconnectIntegration(integrationId: string): Promise<void>;
    getAuth(integrationId: string): Promise<LinkData>;
    refreshToken(integrationId: string): Promise<AuthDetails>;
    integrationCanConnect(integrationId: string): boolean;
    integrationIsConnected(integrationId: string): boolean;
    integrationIsLinked(integrationId: string): boolean;
}