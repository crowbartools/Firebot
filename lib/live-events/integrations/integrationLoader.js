"use strict";

const integrationManager = require("./IntegrationManager");

exports.loadIntegrations = () => {
  // get integration definitions
  const streamlabs = require("./streamlabs");
  const tipeeestream = require("./tipeeestream");

  // register them
  integrationManager.registerIntegration(streamlabs);
  integrationManager.registerIntegration(tipeeestream);
};
