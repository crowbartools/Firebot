var express = require("express");
var bodyParser = require("body-parser");
var api = express();

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));

// get our router for the current v1 api methods
var v1Router = require("./v1/v1Router.js");
api.use("/api/v1", v1Router);

// Catch all remaining paths and send the caller a 404
api.use(function(req, res) {
  res.status(404).send({status: "error", message: req.originalUrl + ' not found'})
});

var server = api.listen(7473, function () {
    console.log("REST API listening on port %s.", server.address().port);
});