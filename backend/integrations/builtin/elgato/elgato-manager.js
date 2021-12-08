"use strict";

const frontEndCommunicator = require("../../../common/frontend-communicator");

let keyLights = [];

const addNewKeyLight = (newLight) => {
    keyLights.push(newLight);
};

const getAllKeyLights = () => {
    return keyLights;
};

const toggleKeyLights = (keyLight) => {
    return keyLights;
};

// send the scenes to the front end when requested
frontEndCommunicator.onAsync("getKeyLights", async () => {
    return getAllKeyLights();
});

exports.addNewKeyLight = addNewKeyLight;