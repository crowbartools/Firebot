"use strict";
const logger = require('../../../../backend/logwrapper');
const authManager = require('../../../../backend/auth/auth-manager');

exports.getAuth = (req, res) => {
    const providerId = req.query.providerId;

    const provider = authManager.getAuthProvider(providerId);

    if (provider == null) {
        return res.status(400).json('Invalid providerId query param');
    }

    logger.info(`Redirecting to provider auth uri: ${provider.authorizationUri}`);

    res.redirect(provider.authorizationUri);
};

exports.getAuthCallback = async (
    /** @type {import("express").Request} */ req,
    /** @type {import("express").Response} */ res) => {
    const state = req.query.state;

    /** @type {import("../../../../backend/auth/auth").AuthProvider} */
    const provider = authManager.getAuthProvider(state);
    if (provider == null) {
        return res.status(400).json('Invalid provider id in state');
    }

    try {
        const fullUrl = req.originalUrl.replace("callback2", "callback");
        /** @type {import("client-oauth2").Token} */
        let token;

        const authType = provider.details.auth.type ?? "code";

        /** @type {import("client-oauth2").Options} */
        const tokenOptions = { body: {} };

        switch (authType) {
            case "token":
                token = await provider.oauthClient.token.getToken(fullUrl, tokenOptions);
                break;

            case "code":
            // Force these because the library adds them as an auth header, not in the body
                tokenOptions.body["client_id"] = provider.details.client.id;
                tokenOptions.body["client_secret"] = provider.details.client.secret;

                token = await provider.oauthClient.code.getToken(fullUrl, tokenOptions);
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
