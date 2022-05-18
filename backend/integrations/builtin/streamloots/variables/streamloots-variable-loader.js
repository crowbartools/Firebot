"use strict";

const variableManager = require("../../../../variables/replace-variable-manager");

exports.registerVariables = () => {
    const slootsCardName = require("../variables/sloots-card-name");
    const slootsCardRarity = require("../variables/sloots-card-rarity");
    const slootsGiftee = require("../variables/sloots-giftee");
    const slootsImageUrl = require("../variables/sloots-image-url");
    const slootsMessage = require("../variables/sloots-message");
    const slootsAlertMessage = require("../variables/sloots-alert-message");
    const slootsChestQuantity = require("../variables/sloots-quantity");
    const slootsSoundUrl = require("../variables/sloots-sound-url");


    variableManager.registerReplaceVariable(slootsCardName);
    variableManager.registerReplaceVariable(slootsCardRarity);
    variableManager.registerReplaceVariable(slootsGiftee);
    variableManager.registerReplaceVariable(slootsImageUrl);
    variableManager.registerReplaceVariable(slootsMessage);
    variableManager.registerReplaceVariable(slootsAlertMessage);
    variableManager.registerReplaceVariable(slootsChestQuantity);
    variableManager.registerReplaceVariable(slootsSoundUrl);
};


