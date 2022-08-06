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

exports.getAuthCallback = async (req, res) => {

    const state = req.query.state;

    const provider = authManager.getAuthProvider(state);
    if (provider == null) {
        return res.status(400).json('Invalid provider id in state');
    }

    const code = req.query.code;
    const options = {
        code: code,
        redirect_uri: provider.redirectUri //eslint-disable-line camelcase
    };

    try {
        const result = await provider.oauthClient.authorizationCode.getToken(options);

        logger.info(`Received token from provider id '${provider.id}'`);

        const token = provider.oauthClient.accessToken.create(result);

        authManager.successfulAuth(provider.id, token.token);

        return res.redirect(`/loginsuccess?provider=${encodeURIComponent(provider.details.name)}`);
    } catch (error) {
        logger.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed');
    }
};
