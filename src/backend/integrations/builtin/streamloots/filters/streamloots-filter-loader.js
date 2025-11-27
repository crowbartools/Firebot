"use strict";

const { FilterManager } = require("../../../../events/filters/filter-manager");

exports.registerFilters = () => {
    const cardName = require("./card-name");
    const cardRarity = require("./card-rarity");
    const chestGift = require("./chest-gift");
    const chestQuantity = require("./chest-quantity");

    FilterManager.registerFilter(cardName);
    FilterManager.registerFilter(cardRarity);
    FilterManager.registerFilter(chestGift);
    FilterManager.registerFilter(chestQuantity);
};