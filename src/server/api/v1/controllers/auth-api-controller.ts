import { Request, Response } from 'express';
import { Options, Token } from 'client-oauth2';

import { AuthDetails } from '../../../../types/auth';

import authManager from '../../../../backend/auth/auth-manager';
import logger from '../../../../backend/logwrapper';

export function getAuth(req: Request, res: Response): void {
    const providerId = req.query.providerId as string;

    const provider = authManager.getAuthProvider(providerId);

    if (provider == null) {
        res.status(400).json('Invalid providerId query param');
    }

    logger.info(`Redirecting to provider auth uri: ${provider.authorizationUri}`);

    res.redirect(provider.authorizationUri);
};

export async function getAuthCallback(req: Request, res: Response): Promise<void> {
    const state = req.query.state as string;

    const provider = authManager.getAuthProvider(state);
    if (provider == null) {
        res.status(400).json('Invalid provider id in state');
    }

    try {
        const fullUrl = req.originalUrl.replace("callback2", "callback");
        let token: Token;

        const authType = provider.details.auth.type ?? "code";

        const tokenOptions: Options = { body: {} };

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
        const tokenData = {
            ...token.data,
            scope: token.data.scope?.split(" ")
        } as unknown as AuthDetails;

        authManager.successfulAuth(provider.id, tokenData);

        res.redirect(`/loginsuccess?provider=${encodeURIComponent(provider.details.name)}`);
    } catch (error) {
        const err = error as Error;
        logger.error('Access Token Error', err.message);
        res.status(500).json('Authentication failed');
    }
};