"use strict";
const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const authManager = require("../../auth-manager");
const EventEmitter = require("events");
const { shell } = require('electron');
const { settings } = require('../../common/settings-access');

class IntegrationManager extends EventEmitter {
    constructor() {
        super();

        this._integrations = [];
    }

    registerIntegration(integration) {
    // TODO: validate integration

        integration.definition.linked = false;

        if (integration.definition.linkType === "auth") {
            authManager.registerAuthProvider(integration.definition.authProviderDetails);
        }

        let integrationDb = profileManager.getJsonDbInProfile("/integrations");
        try {
            let integrationSettings = integrationDb.getData(
                `/${integration.definition.id}`
            );
            if (integrationSettings != null) {
                integration.definition.settings = integrationSettings.settings;
                integration.definition.linked = integrationSettings.linked !== false;
                integration.definition.auth = integrationSettings.auth;
            } else {
                integration.definition.settings = {};
                integration.definition.linked = false;
            }
        } catch (err) {
            logger.warn(err);
        }

        integration.integration.init(
            integration.definition.linked,
            {
                oauth: integration.definition.auth,
                settings: integration.definition.settings
            }
        );

        this._integrations.push(integration);

        logger.debug(`Registered Integration ${integration.definition.name}`);

        this.emit("integrationRegistered", integration);

        integration.integration.on("connected", id => {
            renderWindow.webContents.send("integrationConnectionUpdate", {
                id: id,
                connected: true
            });
        });
        integration.integration.on("disconnected", id => {
            renderWindow.webContents.send("integrationConnectionUpdate", {
                id: id,
                connected: false
            });
        });
        integration.integration.on("settings-update", (id, settings) => {
            try {
                let integrationDb = profileManager.getJsonDbInProfile("/integrations");
                integrationDb.push(`/${id}/settings`, settings);

                let int = this.getIntegrationById(id);
                if (int != null) {
                    int.definition.settings = settings;
                    int.definition.linked = true;
                }
            } catch (error) {
                logger.warn(error);
            }
        });
    }

    getIntegrationById(integrationId) {
        return this._integrations.find(i => i.definition.id === integrationId);
    }

    getIntegrationDefinitionById(integrationId) {
        let integration = this.getIntegrationById(integrationId);
        return integration.definition;
    }

    getAllIntegrationDefinitions() {
        return this._integrations.map(i => i.definition);
    }

    saveIntegrationAuth(integration, authData) {
        integration.definition.auth = authData;

        try {
            let integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.push(`/${integration.definition.id}/auth`, authData);
        } catch (error) {
            logger.warn(error);
            return;
        }
    }

    startIntegrationLink(integrationId) {
        let int = this.getIntegrationById(integrationId);
        if (int == null || int.definition.linked) return;

        if (int.definition.linkType === "auth") {
            shell.openExternal(`http://localhost:${settings.getWebServerPort()}/api/v1/auth?providerId=${int.definition.authProviderDetails.id}`);
        } else {
            this.linkIntegration(int, null);
        }
    }

    linkIntegration(int, linkData) {

        int.integration
            .link(linkData)
            .then(() => {
                console.log("SAVING SUCCESSFUL LINK");
                try {
                    let integrationDb = profileManager.getJsonDbInProfile(
                        "/integrations"
                    );
                    integrationDb.push(`/${int.definition.id}/linked`, true);
                    int.definition.linked = true;
                } catch (error) {
                    console.log(error);
                    logger.warn(error);
                }

                renderWindow.webContents.send("integrationsUpdated");
            })
            .catch(err => {
                console.log(err);
                logger.warn(err);
            });
    }

    unlinkIntegration(integrationId) {
        console.log("UNLINKING " + integrationId);
        let int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) return;

        try {
            let integrationDb = profileManager.getJsonDbInProfile("/integrations");
            integrationDb.delete(`/${integrationId}`);
            int.definition.settings = null;
            int.definition.linked = false;
        } catch (error) {
            logger.warn(error);
        }

        renderWindow.webContents.send("integrationsUpdated");
    }

    async connectIntegration(integrationId) {
        let int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked) return;

        let updatedToken;
        if (int.definition.linkType === "auth") {
            updatedToken = await authManager.refreshTokenIfExpired(int.definition.authProviderDetails.id,
                int.definition.auth);

            if (updatedToken == null) {
                //throw error
                console.log("NULL UPDATED TOKEN!");
                return;
            }

            this.saveIntegrationAuth(int, updatedToken);
        }

        int.integration.connect({
            settings: int.definition.settings,
            auth: updatedToken
        });
    }

    disconnectIntegration(integrationId) {
        let int = this.getIntegrationById(integrationId);
        if (int == null || !int.definition.linked || !int.integration.connected) {
            return;
        }
        int.integration.disconnect();
    }
}

const manager = new IntegrationManager();

authManager.on("auth-success", (authData) => {
    let { providerId, tokenData } = authData;
    const int = manager._integrations.find(i => i.definition.linkType === "auth" &&
        i.definition.authProviderDetails.id === providerId);
    if (int != null) {

        manager.saveIntegrationAuth(int, tokenData);

        manager.linkIntegration(int, { auth: tokenData });
    }
});

ipcMain.on("linkIntegration", (event, integrationId) => {
    logger.info("got 'linkIntegration' request");
    manager.startIntegrationLink(integrationId);
});

ipcMain.on("unlinkIntegration", (event, integrationId) => {
    logger.info("got 'unlinkIntegration' request");
    manager.unlinkIntegration(integrationId);
});

ipcMain.on("connectIntegration", (event, integrationId) => {
    logger.info("got 'connectIntegration' request");
    manager.connectIntegration(integrationId);
});

ipcMain.on("disconnectIntegration", (event, integrationId) => {
    logger.info("got 'disconnectIntegration' request");
    manager.disconnectIntegration(integrationId);
});

ipcMain.on("getAllIntegrationDefinitions", event => {
    logger.info("got 'get all integrations' request");
    event.returnValue = manager.getAllIntegrationDefinitions();
});

module.exports = manager;
