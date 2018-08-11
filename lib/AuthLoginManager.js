"use strict";

const express = require("express");
const simpleOauthModule = require("simple-oauth2");
const util = require("./utility");
const logger = require("./logwrapper");

let app = express();
app.set("json spaces", 4);

let server = null;

function startServer() {
  if (server != null) {
    server.close();
  }
  let listenPort = util.getRandomInt(49153, 65534);
  server = app
    .listen(listenPort, () => {
      logger.info(`Auth server running on port ${listenPort}`);
    })
    .on("error", function(e) {
      if (e.code === "EADDRINUSE") {
        logger.warning(
          "Failed to start auth server, attempting again on a new port..."
        );
        startServer();
      }
    });
}

exports.startServer = startServer;
