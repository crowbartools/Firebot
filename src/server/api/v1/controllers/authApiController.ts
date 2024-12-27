import logger from '../../../../backend/logwrapper';
import authManager from '../../../../backend/auth/auth-manager';
import { Request, Response } from "express";
import { AuthProvider } from "../../../../backend/auth/auth";
import ClientOAuth2 from "client-oauth2";

export function getAuth(req: Request, res: Response) {
    const providerId = req.query.providerId;
    const provider: AuthProvider = typeof providerId === "string" ? authManager.getAuthProvider(providerId) : null;

    if (provider == null) {
        return res.status(400).json('Invalid providerId query param');
    }

    logger.info(`Redirecting to provider auth uri: ${provider.authorizationUri}`);

    res.redirect(provider.authorizationUri);
}

export async function getAuthCallback(req: Request, res: Response) {
    const state = req.query.state;

    const provider: AuthProvider = typeof state === "string" ? authManager.getAuthProvider(state) : null;
    if (provider == null) {
        return res.status(400).json('Invalid provider id in state');
    }

    try {
        const fullUrl = req.originalUrl.replace("callback2", "callback");
        let token: ClientOAuth2.Token;

        const authType = provider.details.auth.type ?? "code";

        switch (authType) {
            case "token":
                token = await provider.oauthClient.token.getToken(fullUrl);
                break;

            case "code":
                token = await provider.oauthClient.code.getToken(fullUrl);
                break;

            default:
                break;
        }

        logger.info(`Received token from provider id '${provider.id}'`);
        const tokenData = authManager.getAuthDetails(token);

        authManager.successfulAuth(provider.id, tokenData);

        return res.redirect(`/loginsuccess?provider=${encodeURIComponent(provider.details.name)}`);
    } catch (error) {
        logger.error('Access Token Error', error.message);
        return res.status(500).json('Authentication failed');
    }
}
