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

    this._integrations.push(integration);

    logger.debug(`Registered Integration ${integration.definition.name}`);

    this.emit("integrationRegistered", integration);
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
      integrationSettings = integrationDb.getData("/");

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
    let int = getIntegrationById(integrationId);
    if (int == null || int.definition.linked) return;
    int.integration
      .link()
      .then(settings => {})
      .catch(err => {
        console.log(err);
        logger.error(err);
      });
  }

  unlinkIntegration(integrationId) {}

  connectIntegration(integrationId) {}

  disconnectIntegration(integrationId) {}
}

const IntegrationManager = new EventManager();

let integrations = {
  streamlabs: {
    tokens: {},
    linked: false,
    handler: require("./streamlabs")
  }
};

function loadIntegrations() {
  let integrationDb = profileManager.getJsonDbInProfile("/integrations"),
    data = integrationDb.getData("/");

  if (data == null) return;

  //load streamlabs
  if (data.streamlabs) {
    let streamlabsData = data.streamlabs;
    if (
      streamlabsData.accessToken == null ||
      streamlabsData.refreshToken == null ||
      streamlabsData.socketToken == null
    ) {
      return;
    }

    integrations.streamlabs.tokens = streamlabsData;
    integrations.streamlabs.linked = true;

    eventManager.registerEventSource(
      integrations.streamlabs.handler.eventSourceDefinition
    );
  }
}

function connectIntegrations() {
  let streamlabs = integrations.streamlabs;
  if (streamlabs.linked) {
    console.log("connecting sl");
    console.log(streamlabs.tokens);
    streamlabs.handler.connect(streamlabs.tokens);
  }
}

function disconnectIntegrations() {
  let streamlabs = integrations.streamlabs;
  if (streamlabs.linked) {
    streamlabs.handler.disconnect();
  }
}

ipcMain.on("integrationLinked", (event, integration) => {
  logger.info("got 'integrationLinked' request");
  loadIntegrations();
  connectIntegrations();
});

exports.loadIntegrations = loadIntegrations;
exports.connectIntegrations = connectIntegrations;
