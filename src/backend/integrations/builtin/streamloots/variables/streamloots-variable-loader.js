"use strict";

const { ReplaceVariableManager } = require("../../../../variables/replace-variable-manager");

exports.registerVariables = () => {
    const slootsCardName = require("../variables/sloots-card-name");
    const slootsCardRarity = require("../variables/sloots-card-rarity");
    const slootsGiftee = require("../variables/sloots-giftee");
    const slootsImageUrl = require("../variables/sloots-image-url");
    const slootsMessage = require("../variables/sloots-message");
    const slootsAlertMessage = require("../variables/sloots-alert-message");
    const slootsChestQuantity = require("../variables/sloots-quantity");
    const slootsSoundUrl = require("../variables/sloots-sound-url");


    ReplaceVariableManager.registerReplaceVariable(slootsCardName);
    ReplaceVariableManager.registerReplaceVariable(slootsCardRarity);
    ReplaceVariableManager.registerReplaceVariable(slootsGiftee);
    ReplaceVariableManager.registerReplaceVariable(slootsImageUrl);
    ReplaceVariableManager.registerReplaceVariable(slootsMessage);
    ReplaceVariableManager.registerReplaceVariable(slootsAlertMessage);
    ReplaceVariableManager.registerReplaceVariable(slootsChestQuantity);
    ReplaceVariableManager.registerReplaceVariable(slootsSoundUrl);
};
