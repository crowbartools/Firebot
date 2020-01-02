"use strict";

let EventEmitter = require("events");
const logger = require("./logwrapper");

class AuthManager extends EventEmitter {
    constructor() {
        super();
        this._authProviders = [];
    }

    registerAuthProvider(authProvider) {
        this._authProviders.push(authProvider);

        logger.debug(`Registered Auth Provider ${authProvider.name}`);

        this.emit("authProviderRegistered", authProvider);
    }
}

const manager = new AuthManager();

module.exports = manager;