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
        /** @type {import("client-oauth2").Token} */
        let token;

        switch (provider.details.auth.type) {
        case "code":
        {
            const result = await provider.oauthClient.code.getToken(req.url);
            token = await result.refresh();
            break;
        }

        case "token":
            token = await provider.oauthClient.token.getToken(req.url);
            break;

        default:
            break;
        }

        logger.info(`Received token from provider id '${provider.id}'`);
        authManager.successfulAuth(provider.id, token.data);

        return res.redirect(`/loginsuccess?provider=${encodeURIComponent(provider.details.name)}`);
    } catch (error) {
        logger.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed');
    }
};
