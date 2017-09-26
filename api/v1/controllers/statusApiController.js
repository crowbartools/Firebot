exports.getStatus = function(req, res) {
  var status = {
    connections: {
      interactive: interactiveConnected
    }
  }
  res.json(status);
}