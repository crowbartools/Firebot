"use strict";
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const authManager = require("../auth/auth-manager");
const EventEmitter = require("events");
const { shell } = require('electron');
const { SettingsManager } = require('../common/settings-manager');
const frontendCommunicator = require('../common/frontend-communicator');
const { setValuesForFrontEnd, buildSaveDataFromSettingValues } = require("../common/firebot-setting-helpers");

/**@extends {NodeJS.EventEmitter} */
class IntegrationManager extends EventEmitter {
    constructor() {
        super();

        this._integrations = [];
    }

    registerIntegration(integration) {
        integration.definition.linked = false;

        if (integration.definition.linkType === "auth") {
            authManager.registerAuthProvider(integration.definition.authProviderDetails);
        }

        const integrationDb = profileManager.getJsonDbInProfile("/integrations");
        try {
            const integrationSettings = integrationDb.getData(`/${integration.definition.id}`);
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
                oauth: integration.definition.auth,
                accountId: integration.definition.accountId,
                settings: integration.definition.settings,
                userSettings: integration.definition.userSettings
            }
        );

        this._integrations.push(integration);

        logger.debug(`Registered Integration ${integration.definition.name}`);

        this.emit("integrationRegistered", integration);

        frontendCommunicator.send("integrationsUpdated");

        integration.integration.on("connected", (id) => {
            frontendCommunicator.send("integrationConnectionUpdate", {
                id: id,
                connected: true
            });
            this.emit("integration-connected", id);
            logger.info(`Successfully connected to ${id}`);
        });

        integration.integration.on("disconnected", (id) => {
            frontendCommunicator.send("integrationConnectionUpdate", {
                id: id,
                connected: false
            });
            this.emit("integration-disconnected", id);
            logger.info(`Disconnected from ${id}`);
        });

        integration.integration.on("reconnect", (id) => {
            logger.debug(`Reconnecting to ${id}...`);
            this.connectIntegration(id);
        });

        integration.integration.on("settings-update", (id, settings) => {
            try {
                const integrationDb = profileManager.getJsonDbInProfile("/integrations");
                integrationDb.push(`/${id}/settings`, settings);

                const int = this.getIntegrationById(id);
                if (int != null) {
                    int.definition.linked = true;
                    int.definition.settings = settings;
                }

            } catch (error) {
                logger.warn(error);
            }
        });
    }

    getIntegrationUserSettings(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return null;
        }
        return int.definition.userSettings;
    }

    saveIntegrationUserSettings(id, settings, notifyInt = true) {
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
                    oauth: int.definition.auth,
                    accountId: int.definition.accountId
                };
                int.integration.onUserSettingsUpdate(integrationData);
            }
        } catch (error) {
            logger.warn(error);
        }
    }

    getIntegrationById(integrationId) {
        return this._integrations.find(i => i.definition.id === integrationId);
    }

    getIntegrationDefinitionById(integrationId) {
        const integration = this.getIntegrationById(integrationId);
        return integration ? integration.definition : null;
    }

    integrationIsConnectable(integrationId) {
        const integration = this.getIntegrationDefinitionById(integrationId);
        if (integration == null) {
            return false;
        }
        if (!integration.linked || !integration.connectionToggle) {
            return false;
        }
        return true;
    }

    getAllIntegrationDefinitions() {
        return this._integrations
            .map(i => i.definition)
            .map((i) => {
                return {
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    linked: i.linked,
                    linkType: i.linkType,
                    connectionToggle: i.connectionToggle,
                    idDetails: i.idDetails,
                    configurable: i.configurable,
                    settings: i.settings,
                    settingCategories: i.settingCategories ? setValuesForFrontEnd(i.settingCategories, i.userSettings) : undefined
                };
            });
    }

    saveIntegrationAuth(integration, authData) {
        integration.definition.auth = authData;

        try {
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${integration.definition.id}/auth`, authData);
        } catch (error) {
            logger.warn(error);
            return;
        }
    }

    getIntegrationAccountId(integrationId) {
        const int = this.getIntegrationById(integrationId);
        return int?.definition?.accountId;
    }

    saveIntegrationAccountId(integration, accountId) {
        integration.definition.accountId = accountId;

        try {
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${integration.definition.id}/accountId`, accountId);
        } catch (error) {
            logger.warn(error);
            return;
        }
    }

    startIntegrationLink(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null || int.definition.linked) {
            return;
        }

        if (int.definition.linkType === "auth") {
            shell.openExternal(`http://localhost:${SettingsManager.getSetting("WebServerPort")}/api/v1/auth?providerId=${encodeURIComponent(int.definition.authProviderDetails.id)}`);
        } else if (int.definition.linkType === "id") {
            frontendCommunicator.send("requestIntegrationAccountId", {
                integrationId: int.definition.id,
                integrationName: int.definition.name,
                steps: int.definition.idDetails && int.definition.idDetails.steps,
                label: (int.definition.idDetails && int.definition.idDetails.label) || 'ID'
            });
        } else {
            this.linkIntegration(int, null);
        }
    }

    async linkIntegration(int, linkData) {
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

        frontendCommunicator.send("integrationsUpdated");
        frontendCommunicator.send("integrationLinked", {
            id: int.definition.id,
            connectionToggle: int.definition.connectionToggle
        });
    }

    unlinkIntegration(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            return;
        }

        this.disconnectIntegration(int);

        try {
            int.integration.unlink();
            const integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.delete(`/${integrationId}`);
            int.definition.settings = null;
            int.definition.linked = false;
            int.definition.auth = null;
            int.definition.accountId = null;
        } catch (error) {
            logger.warn(error);
        }

        frontendCommunicator.send("integrationsUpdated");
        frontendCommunicator.send("integrationUnlinked", integrationId);
    }

    async connectIntegration(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) {
            this.emit("integration-disconnected", integrationId);
            return;
        }

        const integrationData = {
            settings: int.definition.settings,
            userSettings: int.definition.userSettings
        };

        if (int.definition.linkType === "auth") {

            let authData = int.definition.auth;
            if (int.definition.authProviderDetails && int.definition.authProviderDetails.autoRefreshToken) {
                const updatedToken = await authManager.refreshTokenIfExpired(int.definition.authProviderDetails.id,
                    int.definition.auth);

                if (updatedToken == null) {
                    logger.warn("Could not refresh integration access token!");

                    frontendCommunicator.send("integrationConnectionUpdate", {
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

    disconnectIntegration(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked || !int.integration.connected) {
            return;
        }
        int.integration.disconnect();
    }

    /**
     * @param {string} integrationId
     * @returns {boolean}
     */
    integrationCanConnect(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return !!int.integration.connectionToggle;
    }

    /**
     * @param {string} integrationId
     * @returns {boolean}
     */
    integrationIsConnected(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return int.integration.connected;
    }

    /**
     * @param {string} integrationId
     * @returns {boolean}
     */
    integrationIsLinked(integrationId) {
        const int = this.getIntegrationById(integrationId);
        if (int == null) {
            return false;
        }
        return int.integration.linked;
    }
}

const manager = new IntegrationManager();

frontendCommunicator.on("integrationUserSettingsUpdate", (integrationData) => {
    if (integrationData == null) {
        return;
    }

    const int = manager.getIntegrationById(integrationData.id);
    if (int != null) {
        manager.saveIntegrationUserSettings(int.definition.id,
            buildSaveDataFromSettingValues(integrationData.settingCategories, int.definition.userSettings));
    }
});


frontendCommunicator.onAsync("enteredIntegrationAccountId", async (idData) => {
    const { integrationId, accountId } = idData;
    const int = manager.getIntegrationById(integrationId);
    if (int == null) {
        return;
    }

    manager.saveIntegrationAccountId(int, accountId);

    manager.linkIntegration(int, { accountId: accountId });
});

authManager.on("auth-success", (authData) => {
    const { providerId, tokenData } = authData;
    const int = manager._integrations.find(i => i.definition.linkType === "auth" &&
        i.definition.authProviderDetails.id === providerId);
    if (int != null) {

        manager.saveIntegrationAuth(int, tokenData);

        manager.linkIntegration(int, { auth: tokenData });
    }
});

frontendCommunicator.on("linkIntegration", (integrationId) => {
    logger.info("got 'linkIntegration' request");
    manager.startIntegrationLink(integrationId);
});

frontendCommunicator.on("unlinkIntegration", (integrationId) => {
    logger.info("got 'unlinkIntegration' request");
    manager.unlinkIntegration(integrationId);
});

frontendCommunicator.on("connectIntegration", (integrationId) => {
    logger.info("got 'connectIntegration' request");
    manager.connectIntegration(integrationId);
});

frontendCommunicator.on("disconnectIntegration", (integrationId) => {
    logger.info("got 'disconnectIntegration' request");
    manager.disconnectIntegration(integrationId);
});

frontendCommunicator.on("getAllIntegrationDefinitions", () => {
    logger.info("got 'get all integrations' request");
    return manager.getAllIntegrationDefinitions();
});

module.exports = manager;
