"use strict";

const integrationManager = require("./integration-manager");

exports.loadIntegrations = () => {
    [
        'aws/aws',
        'discord/discord',
        'elgato/elgato',
        'philips-hue/hue',
        'streamelements/streamelements',
        'streamlabs/streamlabs',
        'streamloots/streamloots',
        'tipeeestream/tipeeestream',
        'extralife/extralife',
        'obs/obs-integration'
    ].forEach(filename => {
        const definition = require(`./builtin/${filename}.js`);
        integrationManager.registerIntegration(definition);
    });
};