"use strict";

const variableManager = require("../../../../variables/replace-variable-manager");


exports.registerVariables = () => {
    const slDonationAmount = require("./sl-donation-amount");
    const slDonationAmountFormatted = require("./sl-donation-amount-formatted");
    const slDonationMessage = require("./sl-donation-message");
    const slDonator = require("./sl-donator");

    variableManager.registerReplaceVariable(slDonationAmount);
    variableManager.registerReplaceVariable(slDonationAmountFormatted);
    variableManager.registerReplaceVariable(slDonationMessage);
    variableManager.registerReplaceVariable(slDonator);
};


