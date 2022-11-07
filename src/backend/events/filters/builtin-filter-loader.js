"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {
    [
        'bits-badge-tier',
        'chat-mode-duration',
        'chat-mode-setting',
        'chat-mode',
        'cheer-bits-amount',
        'currency',
        'custom-variable-name',
        'donation-amount',
        'donation-from',
        'gift-count',
        'gift-duration',
        'is-anonymous',
        'message',
        'new-currency-amount',
        'new-view-time',
        'previous-currency-amount',
        'previous-view-time',
        'raid-viewer-count',
        'reward-name',
        'reward',
        'stream-category',
        'sub-kind',
        'sub-type',
        'username',
        'viewer-roles'
    ].forEach(filename => {
        const definition = require(`./builtin/${filename}.js`);
        filterManager.registerFilter(definition);
    });
};