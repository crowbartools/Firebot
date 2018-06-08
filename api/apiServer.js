"use strict";

let express = require("express");
let bodyParser = require("body-parser");
const resourceTokenManager = require("../lib/resourceTokenManager");
const { settings } = require("../lib/common/settings-access");
const logger = require("../lib/logwrapper");
const effectManager = require("../lib/effects/effectManager");

let server = null;

exports.start = function() {
  //server is already running.
  if (server !== null) {
    return;
  }

  let api = express();
  api.use(bodyParser.json());
  api.use(bodyParser.urlencoded({ extended: true }));

  api.set("view engine", "ejs");

  api.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    next();
  });

  // get our router for the current v1 api methods
  let v1Router = require("./v1/v1Router.js");
  api.use("/api/v1", v1Router);

  // set up route to serve overlay
  api.use("/overlay/", express.static("resources/overlay"));
  api.get("/overlay", function(req, res) {
    let effectDefs = effectManager.getEffectOverlayExtensions();
    console.log(effectDefs);
    res.render("../resources/overlay", {
      effects: effectDefs
    });
  });

  // set up resource endpoint
  api.get("/resource/:token", function(req, res) {
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
  api.use(function(req, res) {
    res
      .status(404)
      .send({ status: "error", message: req.originalUrl + " not found" });
  });

  server = api.listen(settings.getWebServerPort(), function() {
    logger.info("REST API listening on port %s.", server.address().port);
  });
};
