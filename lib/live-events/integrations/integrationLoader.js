"use strict";

const integrationManager = require("./IntegrationManager");

exports.loadIntegrations = () => {
  // get integration definitions
  const streamlabs = require("./streamlabs");

  // register them
  integrationManager.registerIntegration(streamlabs);
};
