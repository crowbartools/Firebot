
"use strict";
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 0, checkperiod: 5 });


exports.addCustomVariable = (name, data, ttl = 0) => {
    cache.set(name, data, ttl === "" ? 0 : ttl);
};

exports.getCustomVariable = (name) => {
    return cache.get(name);
};




