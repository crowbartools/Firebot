"use strict";

const { openExternal } = require('node:shell');

const {
    stateCache,
    generatePKCE,
    parseURIParams
} = require('./ouath-helpers');

const format = {
    keys: [
        'client_id',
        'client_secret',
        'response_type',
        'scope',
        'redirect_uri',
        'error',
        'error_description',
        'error_uri',
        'grant_type',
        'code',
        'access_token',
        'token_type',
        'expires_in',
        'refresh_token',
        'show_dialog'
    ].reduce((prev, curr) => {
        prev[curr] = curr;
        return prev;
    }, {}),
    plusForSpace: false,
    scopeDelimiter: '%20'
};

class OAuthConsumer {
    #id;
    #name;
    #flowType;
    #format;
    #scopeDelimiter;
    #client;
    #provider;
    #authorize;
    #validate;
    #refresh;
    #revoke;
    #onAuth;
    #scopes;
    #redirectUri;
    #tokens;

    constructor(options, redirectUri, tokens = {}) {

        // #id
        if (!options.id) {
            throw new Error('id not specified');
        }
        this.#id = options.id;

        // #name
        if (options.name) {
            this.#name = options.name;
        }

        // #flowType
        if (options.flowType !== 'implicit' && options.flowType !== 'authorization code' && options.flowType !== 'authorization code PKCE' && options.flowType !== 'device code' && options.flowType !== 'custom') {
            throw new Error('invalid oauth flow type');
        } else if (options.flowType === 'custom' && !options.authorize) {
            throw new Error('custom flow types must specify an authorize handler');
        }
        this.#flowType = options.flowType;

        // #format
        if (!options.format) {
            this.#format = {
                ...format,
                keys: { ...(format.keys) }
            };
        } else if (options.format.keys) {
            const keys = { ...(format.keys), ...(options.format.keys) };
            this.#format = {
                ...format,
                ...(options.format),
                keys
            };
        } else {
            this.#format = {
                ...format,
                ...(options.format),
                keys: { ...(format.keys)}
            };
        }

        this.#scopeDelimiter = this.#scopeDelimiter || (this.#format.plusForSpace ? '+' : '%20');

        // #client
        if (!options.client) {
            throw new Error('client credientials not specified');
        } else if (!options.client.id) {
            throw new Error('client credientials missing client id');
        } else {
            this.#client = { id: options.client.id, secret: options.client.secret };
        }

        // #authorize and #provider
        if (options.authorize) {
            this.#authorize = options.authorize;
        } else if (!options.provider) {
            throw new Error('provider details not specified');
        } else if (!options.provider.authorizeUri) {
            throw new Error('provider details missing authorizeUri');
        }
        this.#provider = { ...(options.provider || {}) };

        // #validate
        if (options.validate) {
            this.#validate = options.validate;
        }

        // #refresh
        if (options.refresh) {
            this.#refresh = options.refresh;
        }

        // #revoke
        if (options.revoke) {
            this.#revoke = options.revoke;
        }

        // #onAuth
        if (options.onAuth) {
            this.#onAuth = options.onAuth;
        }

        this.#scopes = [...(options.scopes || [])];

        this.#redirectUri = redirectUri;
        this.#tokens = new Map(Object.entries(tokens || {}));
    }

    get clientId() {
        return this.#client.id;
    }
    get clientSecret() {
        return this.#client.secret;
    }
    get flowType() {
        return this.#flowType;
    }
    get format() {
        return {
            ...this.#format,
            keys: { ...(this.#format.keys) }
        };
    }
    get id() {
        return this.#id;
    }
    get name() {
        return this.#name || this.id;
    }
    get scopes() {
        return [...this.#scopes];
    }



    /**Done: Returns true if the key is in storage
     *
     * @param {string} key Key associated with the token
     */
    has(key = 'default') {
        return this.#tokens.has(key);
    }

    /**Done: Attempts to retrieve authorization token from storage
     * If the key does not exist, .authorize() will be called
     *
     * @param {string} key Entry to retrieve
     */
    async get(key = 'default') {
        if (!this.has(key)) {
            await this.authorize(key);
        }

        let token = this.#tokens.get(key);
        if (token.refreshToken && token.expiresAt <= Date.now()) {

            /*
            TODO - if this errors:
                delete stored token
                call .authorize(key)
            */
            token = await this.refresh(key);
        }

        return { ...token };
    }

    /**Authorizes Firebot with the Provider
     *
     * @param {string} key Key to store the token as
     */
    async authorize(key, options) {

        // .authorize();
        if (key == null) {
            key = 'default';
            options = options || {};

        // .authorize('key')
        } else if (typeof key === 'string') {
            options = options || {};

        // .authorize({ ... })
        } else {
            options = key || {};
            key = options.key || 'default';
        }

        if (this.has(key) && !options.force) {
            return this.get(key);
        }

        const stateCacheKey = stateCache.generateKey();
        const onRedirectRequest = (meta, callback) => {
            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    stateCache.delete(stateCacheKey);
                    resolve({
                        state: "error",
                        data: {
                            error: "auth_timeout",
                            message: "authorization timed out"
                        }
                    });
                }, 300000); // 5min timeout

                stateCache.set(stateCacheKey, {
                    consumer: this,
                    meta,
                    onAuth: async (...args) => {
                        clearTimeout(timeout);
                        const result = await (callback || this.onAuth)(...args);
                        resolve(result);
                        return result;
                    }
                });
            });
        };

        let result;
        if (this.#authorize) /** custom flow handing */ {
            result = await this.#authorize.call(this, options, onRedirectRequest);

        } else if (this.#flowType === 'device code') {

            // TODO: Support device code flow

            result = {
                state: "error",
                data: {
                    error: "flow_not_supported",
                    message: "device code flow not supported yet"
                }
            };


        // authorization code or authorization code PKCE or implicit
        } else {

            const scopeStr = this.#scopes
                .map(scope => encodeURIComponent(scope))
                .join(this.#scopeDelimiter);

            const keys = this.#format.keys;
            let uri = this.#provider.authorizeUri +
                `?state=${stateCacheKey}` +
                `&${keys['client_id']}=${this.clientId}` +
                `&${keys['response_type']}=${this.flowType === 'implicit' ? 'token' : 'code'}` +
                `&${keys['redirect_uri']}=${this.#redirectUri}` +
                `&${keys['scope']}=${scopeStr}`;

            if (options.showDialog) {
                uri += `&${keys['show_dialog']}=true`;
            }

            let meta;
            if (this.#flowType === 'authorization code PKCE') {
                meta = generatePKCE();
                uri += `&${keys['code_challenge']}=${meta.challenge}`;
            }

            const waitForRedirect = onRedirectRequest(meta);
            openExternal(uri);
            result = await waitForRedirect;
        }

        stateCache.unreserveKey(stateCacheKey);

        if (result.state === 'error') {
            throw new Error(`${result.data.error}: ${result.data.message}`);
        }

        this.#tokens.set(key, result.data);
        return { ...(result.data) };
    }

    /**Done: Validates the associated token with the Provider
     *
     * @param {string} [key='default'] Key associated with the token to validate
     */
    async validate(key = 'default') {
        if (this.has(key)) {
            if (this.#validate) {
                const valid = await this.#validate.call(this, this.#tokens.get(key));

                if (valid === false) {
                    this.#tokens.delete(key);
                }

                return valid;
            }
            throw new Error('validation function was not specified when the consumer was registered');
        }
        return false;
    }

    /**Refreshes the token if its expired
     *
     * @param {string} key Key associated with the token to refresh
     */
    async refresh(key = 'default', force) {
        if (typeof key === 'boolean' && force === undefined) {
            force = key;
            key = 'default';
        }

        if (!this.has(key)) {
            return this.authorize(key);
        }

        let token = this.get(key);
        if (!token.refreshToken) {
            if (force) {
                throw new Error('no refresh token associated with the authorization');
            }
            return token;
        }

        if (!force && token.expiresAt > Date.now()) {
            return token;
        }

        if (this.#refresh) {
            token = await this.#refresh.call(this, token);

        } else if (!this.#provider.refreshUri) {
            throw new Error('refresh uri was not specified when consumer was created');

        } else {
            const keys = this.#format.keys;

            let body = '' +
                `${keys['grant_type']}=refresh_token` +
                `&${keys['client_id']}=${this.clientId}` +
                `&${keys['refresh_token']}=${encodeURIComponent(token.refreshToken)}`;

            if (this.clientSecret) {
                body += `${keys['client_secret']}=${encodeURIComponent(this.clientSecret)}`;
            }

            const res = await fetch(this.#provider.refreshUri, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });

            // TODO: process response

        }

        this.#tokens.set(key, token);
        return token;
    }

    /**Done: Revokes the token and deletes associated data
     *
     * @param {string} key Key associated with the token to revoke
     */
    async revoke(key = 'default') {
        if (this.has(key)) {

            if (
                this.#provider.revokeUri == null &&
                !this.#revoke
            ) {
                throw new Error('revoke uri was not specified when consumer was created');
            }

            const token = this.#tokens.get(key);
            this.#tokens.delete(key);

            if (this.#revoke) {
                await this.#revoke.call(this, token);

            } else {

                // Don't care about the response;
                // Assume the token was revoked
                await fetch(this.#provider.revokeUri, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `client_id=${this.clientId}&token=${token.accessToken}`
                });
            }
        }
    }

    async onAuth(meta, request) {
        let params;
        try {
            params = parseURIParams(request.originalUrl);
        } catch (err) {
            return {
                state: 'error',
                data: {
                    error: 'invalid_params',
                    description: 'Invalid query parameters'
                }
            };
        }



    }
}

module.exports = OAuthConsumer;