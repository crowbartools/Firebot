"use strict";
const logger = require('../../../../backend/logwrapper');
const authManager = require('../../../../backend/auth/auth-manager');

exports.getAuth = (req, res) => {
    const providerId = req.query.providerId;

    const provider = authManager.getAuthProvider(providerId);

    if (provider == null) {
        return res.status(400).json('Invalid providerId query param');
    }

    logger.info("Redirecting to provider auth uri: " + provider.authorizationUri);

    res.redirect(provider.authorizationUri);
};

exports.getAuthCallback = async (
    /** @type {import("express").Request} */ req,
    /** @type {import("express").Response} */ res) => {
    const state = req.query.state;

    /** @type {import("../../../../backend/auth/auth-provider").AuthProvider} */
    const provider = authManager.getAuthProvider(state);
    if (provider == null) {
        return res.status(400).json('Invalid provider id in state');
    }

    try {
        const fullUrl = `http${req.secure ? "s" : ""}://${req.hostname}:${req.socket.localPort}${req.originalUrl}`.replace("callback2", "callback");
        /** @type {import("client-oauth2").Token} */
        let token;

        const authType = provider.details.auth.type ?? "code";

        switch (authType) {
        case "token":
            token = await provider.oauthClient.token.getToken(fullUrl);
            break;

        case "code":
            token = await provider.oauthClient.code.getToken(fullUrl);
            token = await token.refresh();
            break;

        default:
            break;
        }

        logger.info(`Received token from provider id '${provider.id}'`);
        const tokenData = token.data;
        tokenData.scope = tokenData.scope?.split(" ");

        authManager.successfulAuth(provider.id, tokenData);

        return res.redirect(`/loginsuccess?provider=${encodeURIComponent(provider.details.name)}`);
    } catch (error) {
        logger.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed');
    }
};
