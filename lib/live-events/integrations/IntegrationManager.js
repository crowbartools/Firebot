"use strict";
const { ipcMain, session } = require("electron");
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const eventManager = require("../EventManager");
const EventEmitter = require("events");

class IntegrationManager extends EventEmitter {
  constructor() {
    super();

    this._integrations = [];
  }

  registerIntegration(integration) {
    // TODO: validate integration

    integration.definition.linked = false;

    let integrationDb = profileManager.getJsonDbInProfile("/integrations");
    try {
      let integrationSettings = integrationDb.getData(
        `/${integration.definition.id}`
      );
      console.log(integrationSettings);
      if (integrationSettings != null) {
        integration.definition.settings = integrationSettings.settings;
        integration.definition.linked = integrationSettings.linked !== false;
      } else {
        integration.definition.settings = {};
        integration.definition.linked = false;
      }
    } catch (err) {
      console.log(err);
      logger.warn(err);
    }

    integration.integration.init(
      integration.definition.linked,
      integration.definition.settings
    );

    this._integrations.push(integration);

    logger.debug(`Registered Integration ${integration.definition.name}`);

    this.emit("integrationRegistered", integration);

    integration.integration.on("connected", id => {
      console.log("got connected event: " + id);
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
        console.log(error);
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

  loadIntegrationSettings() {
    let integrationDb = profileManager.getJsonDbInProfile("/integrations"),
      integrationSettings = null;

    try {
      integrationSettings = integrationDb.getData("/");
    } catch (err) {
      console.log(err);
      logger.warn(err);
    }

    if (integrationSettings == null) return;

    let integrationIds = Object.keys(integrationSettings);

    for (let integrationId of integrationIds) {
      let integration = this.getIntegrationById(integrationId);
      if (integration == null) continue;
      let saveData = integrationSettings[integrationId];
      integration.definition.settings = saveData.settings;
      integration.definition.linked = saveData.linked !== false;
    }
  }

  linkIntegration(integrationId) {
    let int = this.getIntegrationById(integrationId);
    console.log(int);
    if (int == null || int.definition.linked) return;
    int.integration
      .link()
      .then(() => {
        console.log("SAVING SUCCESSFUL LINK");
        try {
          let integrationDb = profileManager.getJsonDbInProfile(
            "/integrations"
          );
          integrationDb.push(`/${integrationId}/linked`, true);
          int.definition.linked = true;
        } catch (error) {
          console.log(error);
          logger.warn(err);
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
    console.log(int);
    try {
      let integrationDb = profileManager.getJsonDbInProfile("/integrations");
      integrationDb.delete(`/${integrationId}`);
      int.definition.settings = null;
      int.definition.linked = false;
    } catch (error) {
      console.log(error);
      logger.warn(err);
    }

    renderWindow.webContents.send("integrationsUpdated");
  }

  connectIntegration(integrationId) {
    let int = this.getIntegrationById(integrationId);
    console.log(int);
    if (int == null || !int.definition.linked) return;
    int.integration.connect(int.definition.settings);
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

ipcMain.on("linkIntegration", (event, integrationId) => {
  logger.info("got 'linkIntegration' request");
  manager.linkIntegration(integrationId);
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
