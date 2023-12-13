"use strict";
const { join } = require('path');
const { readFileSync } = require('fs');

const logger = require("../logwrapper");
const OAuthConsumer = require('./oauth-consumer');

const {
    stateCache,
    getRandomDev
} = require('./ouath-helpers');

const sendAuthError = (res, status, pageHeader, pageContent) => {
    if (pageContent == null || pageContent === "") {
        const dev = getRandomDev();
        pageContent = `Something bad happened and you can safely assume its <strong>${dev}</strong>'s fault`;
    }
    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', 0);
    res.set('Surrogate-Control', 'no-store');
    res.status(status || 400);

    const template = readFileSync(join(__dirname, './pages/error.template.html'), { encoding: 'utf8'});

    res.send(
        template
            .replace('{{header}}', pageHeader || "Unknown Error")
            .replace('{{content}}', pageContent)
    );
};

module.exports.routeHandler = async function (req, res) {

    const requestURI = req.originalUrl;
    if (requestURI.includes('#')) {
        sendAuthError(res, 400, "Bad Request");
        return;
    }

    // no query parameters - may be token flow grant
    if (!requestURI.includes('?')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', 0);
        res.set('Surrogate-Control', 'no-store');
        res.sendFile(join(__dirname, './pages/redirect.html'));
        return;
    }
    if (req.query.error === 'invalid_redirect') {
        sendAuthError(res, 400, "Invalid data returned from redirect");
    }

    // validate state query parameter
    const stateKey = req.query.state;
    if (typeof stateParam !== 'string' || !/^[a-z\d\-+]+$/.test(stateKey) || !stateCache.has(stateKey)) {
        sendAuthError(res);
        return;
    }

    const { consumer, meta, onAuth } = stateCache.get(stateKey);
    stateCache.delete(stateKey);

    const result = await onAuth.call(consumer, meta, req);
    if (result.state !== 'ok') {
        sendAuthError(res, 400, result.data.message);
        return;
    }

    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', 0);
    res.set('Surrogate-Control', 'no-store');
    res.status(200);

    const template = readFileSync(join(__dirname, './pages/success.template.html'), { encoding: 'utf8'});
    res.send(template);
};


/**
 *
 * @param {RegisterOptions} options
 */
module.exports.register = (options) => {
    // todo
};