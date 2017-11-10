exports.getStatus = function(req, res) {
    let status = {
        connections: {
            interactive: interactiveConnected
        }
    };
    res.json(status);
};