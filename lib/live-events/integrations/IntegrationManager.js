"use strict";
const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const eventManager = require("../EventManager");

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
