var express = require("express");
var bodyParser = require("body-parser");
const resourceTokenManager = require('../lib/resourceTokenManager');
const {settings} = require('../lib/common/settings-access');

var server = null;

exports.start = function() {
  if(server != null) {
    //server is already running.
    return;
  }
  var api = express();
  api.use(bodyParser.json());
  api.use(bodyParser.urlencoded({ extended: true }));
  
  // get our router for the current v1 api methods
  var v1Router = require("./v1/v1Router.js");
  api.use("/api/v1", v1Router);
    
  // set up route to serve overlay
  api.use('/overlay', express.static('resources/overlay'))
  
  // set up resource endpoint
  api.get('/resource/:token', function (req, res) {
      
      var token = req.params.token;  
      if(token != null) {
        var resourcePath = resourceTokenManager.getResourcePath(token);
        if(resourcePath != null) {
          resourcePath = resourcePath.replace(/\\/g, "/");
          res.sendFile(resourcePath);
          return;
        }
      }
      
      res.status(404).send({status: "error", message: req.originalUrl + ' not found'})
  });
  
  // Catch all remaining paths and send the caller a 404
  api.use(function(req, res) {
    res.status(404).send({status: "error", message: req.originalUrl + ' not found'})
  });
  
  
  server = api.listen(settings.getWebServerPort(), function () {
      console.log("REST API listening on port %s.", server.address().port);
  });
}