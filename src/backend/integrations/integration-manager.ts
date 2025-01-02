import { ipcMain, shell } from "electron";
import { TypedEmitter } from "tiny-typed-emitter";
import { SettingsManager } from "../common/settings-manager";
import { setValuesForFrontEnd, buildSaveDataFromSettingValues } from "../common/firebot-setting-helpers";
import { AuthDetails } from "../auth/auth";
import {
    AccountIdDetails,
    Integration,
    IntegrationData,
    IntegrationDefinition,
    LinkData,
    IntegrationManagerEvents
} from "../../types/integrations";
import { FirebotParams } from "@crowbartools/firebot-custom-scripts-types/types/modules/firebot-parameters";
import logger from "../logwrapper";
import profileManager from "../common/profile-manager";
import authManager from "../auth/auth-manager";
import frontEndCommunicator from "../common/frontend-communicator";

class IntegrationManager extends TypedEmitter<IntegrationManagerEvents> {
    private _integrations: Array<Integration> = [];

    constructor() {
        super();
        authManager.on("auth-success", ({providerId, tokenData}) => {
            const int = this._integrations.find(i => i.definition.linkType === "auth" &&
                i.definition.authProviderDetails.id === providerId);
            if (int != null) {

                this.saveIntegrationAuth(int, tokenData);

                this.linkIntegration(int, { auth: tokenData });
            }
        });
    }

    registerIntegration(integration: Integration): void {
        integration.definition.linked = false;

        if (integration.definition.linkType === "auth") {
            authManager.registerAuthProvider(integration.definition.authProviderDetails);
        }

        const integrationDb = profileManager.getJsonDbInProfile("/integrations");
        try {
            const integrationSettings = integrationDb.getData(`/${integration.definition.id}`) as IntegrationData;
            if (integrationSettings != null) {
                integration.definition.settings = integrationSettings.settings;
                integration.definition.userSettings = integrationSettings.userSettings;
                integration.definition.linked = integrationSettings.linked !== false;
                integration.definition.auth = integrationSettings.auth;
                integration.definition.accountId = integrationSettings.accountId;
            } else {
                integration.definition.settings = {};
                integration.definition.linked = false;
            }
        } catch (err) {
            if (err.name !== "DataError") {
                logger.warn(err);
            }
        }

        integration.integration.init(
            integration.definition.linked,
            {
                auth: integration.definition.auth,
                accountId: integration.definition.accountId,
                settings: integration.definition.settings,
                userSettings: integration.definition.userSettings
            } as IntegrationData
        );

        this._integrations.push(integration);

        logger.debug(`Registered Integration ${integration.definition.name}`);

        this.emit("integrationRegistered", integration);

        if (global.renderWindow?.webContents != null) {
            global.renderWindow.webContents.send("integrationsUpdated");
        }

        integration.integration.on("connected", (integrationId: string) => {
            global.renderWindow.webContents.send("integrationConnectionUpdate", {
                id: integrationId,
                connected: true
            });
            this.emit("integration-connected", integrationId);
            logger.info(`Successfully connected to ${integrationId}`);
        });

        integration.integration.on("disconnected", (integrationId: string) => {
            global.renderWindow.webContents.send("integrationConnectionUpdate", {
                id: integrationId,
                connected: false
            });
            this.emit("integration-disconnected", integrationId);
            logger.info(`Disconnected from ${integrationId}`);
        });

        integration.integration.on("reconnect", (integrationId: string) => {
            logger.debug(`Reconnecting to ${integrationId}...`);
            this.connectIntegration(integrationId);
        });

        integration.integration.on("settings-update", (integrationId: string, settings: FirebotParams) => {
            try {
                const integrationDb = profileManager.getJsonDbInProfile("/integrations");
                integrationDb.push(`/${integrationId}/settings`, settings);

                const int = this.getIntegrationById(integrationId);
                if (int != null) {
                    int.definition.linked = true;
                    int.definition.settings = settings;
                }

            } catch (error) {
                logger.warn(error);
            }
        });
    }

    getIntegrationUserSettings<Params extends FirebotParams = FirebotParams>(integrationId: string): Params {
        const int = this.getIntegrationById<Params>(integrationId);
        if (int == null) {
            return null;
        }
        return int.definition.userSettings;
    }

    saveIntegrationUserSettings(id: string, settings: FirebotParams, notifyInt = true): void {
        try {
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${id}/userSettings`, settings);

            const int = this.getIntegrationById(id);
            if (int != null) {
                int.definition.userSettings = settings;
            }

            if (notifyInt && int.integration.onUserSettingsUpdate) {
                const integrationData = {
                    settings: int.definition.settings,
                    userSettings: int.definition.userSettings,
                    auth: int.definition.auth,
                    accountId: int.definition.accountId
                } as IntegrationData;
                int.integration.onUserSettingsUpdate(integrationData);
            }
        } catch (error) {
            logger.warn(error);
        }
    }

    getIntegrationById<Params extends FirebotParams = FirebotParams>(integrationId: string): Integration<Params> {
        return this._integrations.find(i => i.definition.id === integrationId) as Integration<Params>;
    }

    getIntegrationDefinitionById<Params extends FirebotParams = FirebotParams>(integrationId: string): IntegrationDefinition<Params> {
        const integration = this.getIntegrationById<Params>(integrationId);
        return integration ? integration.definition : null;
    }

    integrationIsConnectable(integrationId: string): boolean {
        const integration = this.getIntegrationDefinitionById(integrationId);
        if (integration == null) {
            return false;
        }
        if (!integration.linked || !integration.connectionToggle) {
            return false;
        }
        return true;
    }

    getAllIntegrationDefinitions(): Array<IntegrationDefinition> {
        return this._integrations
            .map(i => i.definition)
            .map((i) => {
                return {
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    linked: i.linked,
                    linkType: i.linkType,
                    idDetails: i.linkType === "id" ? i.idDetails : undefined,
                    authProviderDetails: i.linkType === "auth" ? i.authProviderDetails : undefined,
                    connectionToggle: i.connectionToggle,
                    configurable: i.configurable,
                    settings: i.settings,
                    settingCategories: i.settingCategories ? setValuesForFrontEnd(i.settingCategories, i.userSettings) : undefined
                } as IntegrationDefinition;
            });
    }

    saveIntegrationAuth(integration: Integration, authData: AuthDetails): void {
        integration.definition.auth = authData;

        try {
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${integration.definition.id}/auth`, authData);
        } catch (error) {
            logger.warn(error);
            return;
        }
    }

    getIntegrationAccountId(integrationId: string): AccountIdDetails {
        const int = this.getIntegrationById(integrationId);
        return int?.definition?.accountId;
    }

    saveIntegrationAccountId(integration: Integration, accountId: AccountIdDetails): void {
        integration.definition.accountId = accountId;

        try {
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${integration.definition.id}/accountId`, accountId);
        } catch (error) {
            logger.warn(error);
            return;
        }
    }

    startIntegrationLink(integrationId: string): void {
        const int = this.getIntegrationById(integrationId);
        if (int == null || int.definition.linked) {
            return;
        }

        if (int.definition.linkType === "auth") {
            shell.openExternal(`http://localhost:${SettingsManager.getSetting("WebServerPort")}/api/v1/auth?providerId=${encodeURIComponent(int.definition.authProviderDetails.id)}`);
        } else if (int.definition.linkType === "id") {
            frontEndCommunicator.send("requestIntegrationAccountId", {
                integrationId: int.definition.id,
                integrationName: int.definition.name,
                steps: int.definition.idDetails && int.definition.idDetails.steps,
                label: (int.definition.idDetails && int.definition.idDetails.label) || 'ID'
            });
        } else {
            this.linkIntegration(int, null);
        }
    }

    async linkIntegration(int: Integration, linkData: LinkData): Promise<void> {
        try {
            await int.integration.link(linkData);
        } catch (error) {
            logger.warn(error);
            return; // link failed, return.
        }

        const integrationDb = profileManager.getJsonDbInProfile(
            "/integrations"
        );
        integrationDb.push(`/${int.definition.id}/linked`, true);
        int.definition.linked = true;

        global.renderWindow.webContents.send("integrationsUpdated");
        frontEndCommunicator.send("integrationLinked", {
            id: int.definition.id,
            connectionToggle: int.definition.connectionToggle
        });
    }

    unlinkIntegration(integrationId: string): Promise<void> {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            return;
        }

        this.disconnectIntegration(integrationId);

        try {
            if (int.integration.unlink) {
                int.integration.unlink();
            }
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.delete(`/${integrationId}`);
            int.definition.settings = null;
            int.definition.linked = false;
            int.definition.auth = null;
            int.definition.accountId = null;
        } catch (error) {
            logger.warn(error);
        }

        global.renderWindow.webContents.send("integrationsUpdated");

        frontEndCommunicator.send("integrationUnlinked", integrationId);
    }

    async connectIntegration(integrationId: string): Promise<void> {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            this.emit("integration-disconnected", integrationId);
            return;
        }

        const integrationData: IntegrationData = {
            settings: int.definition.settings,
            userSettings: int.definition.userSettings,
            linked: int.definition.linked
        };

        if (int.definition.linkType === "auth") {

            let authData = int.definition.auth;
            if (int.definition.authProviderDetails && int.definition.authProviderDetails.autoRefreshToken) {
                const updatedToken = await authManager.refreshTokenIfExpired(int.definition.authProviderDetails.id,
                    int.definition.auth);

                if (updatedToken == null) {
                    logger.warn("Could not refresh integration access token!");

                    global.renderWindow.webContents.send("integrationConnectionUpdate", {
                        id: integrationId,
                        connected: false
                    });

                    logger.info(`Disconnected from ${int.definition.name}`);
                    this.emit("integration-disconnected", integrationId);
                    return;
                }

                this.saveIntegrationAuth(int, updatedToken);

                authData = updatedToken;
            }

            integrationData.auth = authData;
        } else if (int.definition.linkType === "id") {
            integrationData.accountId = int.definition.accountId;
        }

        logger.info(`Attempting to connect to ${int.definition.name}...`);
        int.integration.connect(integrationData);
    }

    disconnectIntegration(integrationId: string): Promise<void> {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked || !int.integration.connected) {
            return;
        }
        int.integration.disconnect();
    }

    async getAuth(integrationId: string): Promise<LinkData> {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            this.emit("integration-disconnected", integrationId);
            return null;
        }

        let authData: LinkData = null;
        if (int.definition.linkType === "auth") {
            const providerId = int.definition?.authProviderDetails.id;
            authData = { auth: int.definition.auth };

            if (int.definition.authProviderDetails &&
                int.definition.authProviderDetails.autoRefreshToken &&
                authManager.tokenExpired(providerId, authData.auth)) {

                const updatedToken = await authManager.refreshTokenIfExpired(providerId, authData.auth);
                if (updatedToken != null) {
                    this.saveIntegrationAuth(int, updatedToken);
                    this.emit("token-refreshed", {"integrationId": integrationId, "updatedToken": updatedToken});
                }
                authData.auth = updatedToken;
            } else if (authManager.tokenExpired(providerId, authData.auth)) {
                authData = null;
            }
        } else if (int.definition.linkType === "id") {
            authData = { accountId: int.definition.accountId };
        }

        if (authData == null) {
            logger.warn("Could not refresh integration access token!");

            global.renderWindow.webContents.send("integrationConnectionUpdate", {
                id: integrationId,
                connected: false
            });

            logger.info(`Disconnected from ${int.definition.name}`);
            this.emit("integration-disconnected", integrationId);
        }
        return authData;
    }

    async refreshToken(integrationId: string): Promise<AuthDetails> {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            this.emit("integration-disconnected", integrationId);
            return;
        }

        const integrationData: IntegrationData = {
            settings: int.definition.settings,
            userSettings: int.definition.userSettings,
            linked: int.definition.linked
        };

        let authData = null;
        if (int.definition.linkType === "auth") {
            authData = int.definition.auth;
            if (int.definition.authProviderDetails) {
                const updatedToken = await authManager.refreshTokenIfExpired(int.definition.authProviderDetails.id,
                    int.definition.auth);

                if (updatedToken == null) {
                    logger.warn("Could not refresh integration access token!");

                    global.renderWindow.webContents.send("integrationConnectionUpdate", {
                        id: integrationId,
                        connected: false
                    });

                    logger.info(`Disconnected from ${int.definition.name}`);
                    this.emit("integration-disconnected", integrationId);
                    return;
                }

                this.saveIntegrationAuth(int, updatedToken);

                authData = updatedToken;
                this.emit("token-refreshed", {"integrationId": integrationId, "updatedToken": updatedToken});
            }
            integrationData.auth = authData;
        }
        return authData;
    }

    integrationCanConnect(integrationId: string): boolean {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return !!int.definition.connectionToggle;
    }

    integrationIsConnected(integrationId: string): boolean {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return int.integration.connected;
    }

    integrationIsLinked(integrationId: string): boolean {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return int.definition.linked;
    }
}

const integrationManager = new IntegrationManager();

frontEndCommunicator.on("integrationUserSettingsUpdate", (integrationData: IntegrationDefinition) => {
    if (integrationData == null) {
        return;
    }

    const int = integrationManager.getIntegrationById(integrationData.id);
    if (int != null) {
        integrationManager.saveIntegrationUserSettings(int.definition.id,
            buildSaveDataFromSettingValues(integrationData.settingCategories, int.definition.userSettings));
    }
});

frontEndCommunicator.onAsync<[{ integrationId: string, accountId: string }]>("enteredIntegrationAccountId", async (idData) => {
    const { integrationId, accountId } = idData;
    const int = integrationManager.getIntegrationById(integrationId);
    if (int == null) {
        return;
    }

    integrationManager.saveIntegrationAccountId(int, accountId);

    integrationManager.linkIntegration(int, { accountId: accountId });
});

ipcMain.on("linkIntegration", (event, integrationId) => {
    logger.info("got 'linkIntegration' request");
    integrationManager.startIntegrationLink(integrationId);
});

ipcMain.on("unlinkIntegration", (event, integrationId) => {
    logger.info("got 'unlinkIntegration' request");
    integrationManager.unlinkIntegration(integrationId);
});

ipcMain.on("connectIntegration", (event, integrationId) => {
    logger.info("got 'connectIntegration' request");
    integrationManager.connectIntegration(integrationId);
});

ipcMain.on("disconnectIntegration", (event, integrationId) => {
    logger.info("got 'disconnectIntegration' request");
    integrationManager.disconnectIntegration(integrationId);
});

ipcMain.on("getAllIntegrationDefinitions", (event) => {
    logger.info("got 'get all integrations' request");
    event.returnValue = integrationManager.getAllIntegrationDefinitions();
});

export = integrationManager;
