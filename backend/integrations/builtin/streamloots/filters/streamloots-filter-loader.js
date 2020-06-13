"use strict";

const filterManager = require("../../../../events/filters/filter-manager");

exports.registerFilters = () => {
    const cardName = require("./card-name");
    const cardRarity = require("./card-rarity");
    const chestGift = require("./chest-gift");
    const chestQuantity = require("./chest-quantity");

    filterManager.registerFilter(cardName);
    filterManager.registerFilter(cardRarity);
    filterManager.registerFilter(chestGift);
    filterManager.registerFilter(chestQuantity);
};