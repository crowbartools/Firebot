var express = require("express");
var bodyParser = require("body-parser");

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
  api.get('/resource/:path', function (req, res) {
      
      var resourcePath = req.params.path;  
      if(resourcePath != null) {
        resourcePath = resourcePath.replace(/\\/g, "/");
        res.sendFile(resourcePath);
        return;
      }
      
      res.status(404).send({status: "error", message: req.originalUrl + ' not found'})
  });
  
  // Catch all remaining paths and send the caller a 404
  api.use(function(req, res) {
    res.status(404).send({status: "error", message: req.originalUrl + ' not found'})
  });
  
  
  server = api.listen(7473, function () {
      console.log("REST API listening on port %s.", server.address().port);
  });
}