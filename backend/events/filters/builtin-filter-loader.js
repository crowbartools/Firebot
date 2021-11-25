"use strict";

const filterManager = require("./filter-manager");

exports.loadFilters = () => {
    [
        'bits-badge-tier',
        'cheer-bits-amount',
        'donation-amount',
        'donation-from',
        'gift-count',
        'gift-duration',
        'host-type',
        'host-viewer-count',
        'is-anonymous',
        'message',
        'new-view-time',
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
        let definition = require(`./builtin/${filename}.js`);
        filterManager.registerFilter(definition);
    });
};