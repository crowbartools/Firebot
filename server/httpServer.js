"use strict";

let express = require("express");
let bodyParser = require("body-parser");
const resourceTokenManager = require("../lib/resourceTokenManager");
const { settings } = require("../lib/common/settings-access");
const logger = require("../lib/logwrapper");
const effectManager = require("../lib/effects/effectManager");
const http = require("http");
const WebSocket = require("ws");

let server = null;
let httpServer = null;
let wss = null;

exports.start = function() {
  //server is already running.
  if (server != null) {
    return;
  }

  let app = express();

  httpServer = http.createServer(app);
  wss = new WebSocket.Server({
    server: httpServer
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.set("view engine", "ejs");

  app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    next();
  });

  // get our router for the current v1 api methods
  let v1Router = require("./api/v1/v1Router");
  app.use("/api/v1", v1Router);

  // set up route to serve overlay
  app.use("/overlay/", express.static("resources/overlay"));
  app.get("/overlay", function(req, res) {
    let effectDefs = effectManager.getEffectOverlayExtensions();
    res.render("../resources/overlay", {
      effects: effectDefs
    });
  });

  // set up resource endpoint
  app.get("/resource/:token", function(req, res) {
    let token = req.params.token || null;
    if (token !== null) {
      let resourcePath = resourceTokenManager.getResourcePath(token) || null;
      if (resourcePath !== null) {
        resourcePath = resourcePath.replace(/\\/g, "/");
        res.sendFile(resourcePath);
        return;
      }
    }

    res
      .status(404)
      .send({ status: "error", message: req.originalUrl + " not found" });
  });

  // Catch all remaining paths and send the caller a 404
  app.use(function(req, res) {
    res
      .status(404)
      .send({ status: "error", message: req.originalUrl + " not found" });
  });

  server = httpServer.listen(settings.getWebServerPort());
  logger.info("Web Server listening on port %s.", server.address().port);
};

exports.sendToOverlay = function(eventName, meta = {}, overlayInstance) {
  if (wss == null || eventName == null) return;

  let data = { event: eventName, meta: meta, overlayInstance: overlayInstance },
    dataRaw = JSON.stringify(data);

  wss.clients.forEach(function each(client) {
    if (client.readyState === 1) {
      client.send(dataRaw, err => {
        if (err) {
          logger.error(err);
        }
      });
    }
  });
};

effectManager.on("effectRegistered", () => {
  exports.sendToOverlay("OVERLAY:REFRESH");
});
