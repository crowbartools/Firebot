'use strict';

// node module imports
const {randomBytes} = require('crypto');
const querystring = require('querystring');

// dependency module imports
const {shell} = require('electron');

// custom module imports
const {settings} = require("./settings-access");


// util functions
const hop = Object.prototype.hasOwnProeprty;
const has = (obj, prop) => hop.call(obj, prop);

// begin
const redirectURI = 'https://crowbartools.com/projects/firebot/auth.php';
const idTimeout = 10 * 60 * 1000; // 10 minutes

const platforms = {};
const used = {};
const pending = {};

// generates a unique id in the form of a string that is not present in the 'used' or 'pending' objects
function generateId() {
    let id;

    // loop until a unique id is discovered
    do {
        id = randomBytes(64).toString('hex');
    } while (has(used, id) || has(pending, id));

    // return the result
    return id;
}

// Cleans up after a pending auth request
function abortAuth(id) {
    if (has(pending, id)) {
        if (pending[id].timeout) {
            clearTimeout(pending[id].timeout);
        }
        delete pending[id];
        used[id] = true;
    }
}


/**@typedef {PerformCallback}
   @type {function}

   @param {object} auth - Auth instance details
   @param {string} auth.id - unique id for the auth instance
   @param {string} auth.uri - the request uri
   @param {array}  auth.scope - Array of scopes requested


   @param {object} auth.platform - Platform details
   @param {string} auth.platform.platform - Platform string id that the auth instance was made against
   @param {string} auth.platform.authURI - Platforms base authorization uri
   @param {string} auth.platform.clientId - OAuth client id for the platform
   @param {string} auth.platform.responseType - Response type used to the authorize against the platform

   @param {<object|undefined|null>} qs - query string as requested by the user's browser

   @param {*} expressRequest - request object passed to the route handle function
   @param {*} expressResponse - request object passed to the route handle function
 */


/**@desc express request handler*/
// example: from the webserver: expressApp.get("/api/v1/auth", platformAuth.handle)
module.exports.handle = function handle(req, res) {

    let qs = req.query;

    // invalid query string
    if (qs == null) {
        // TODO redirect browser to auth error page

    } else if (!has(qs, 'state') || qs.state == null || /^[a-z\d]+$/i.test(qs.state)) {
        // TODO redirect browser to auth error page for invalid auth

    } else if (has(used, qs.state)) {
        // TODO redirect browser to auth error page for expired id

    } else if (!has(pending, qs)) {
        // TODO redirect browser to auth error page for invalid auth

    } else {

        // retrieve data related to pending auth
        let auth = pending[qs.state];
        let platform = auth.platform;

        // clean up after the pending auth
        abortAuth(auth.id);

        // call the callback
        auth.callback({
            id: auth.id,
            platform: {
                platform: platform.platform,
                authURI: platform.authURI,
                clientId: platform.clientId,
                responseType: platform.responseType
            },
            uri: auth.uri,
            scopes: auth.scopes
        }, qs, req, res);
    }
};




/**@desc register's a platform
   @param {object} details
   @param {string} details.platform       Unique string for the platform; examples: "mixer", "streamlabs"
   @param {string} details.authURI        Uri to send the user to for purposes of granting access
   @param {string} details.clientId       The oauth client id
   @param {string} details.responseType   "code" for authorization grant, "token" for Implicate grant
   @param {array<string>} [details.scope] List of default scopes to request access to; can be override when calling .perform()
*/
module.exports.register = function register(details) {

    if (details == null) {
        throw new TypeError('invalid details');
    }

    let digest = {};

    // validate details.platform
    if (!has(details, 'platform') || details.platform == null) {
        throw new TypeError('platform is missing');
    } else if (typeof details. platform !== 'string' || details.platform === '') {
        throw new TypeError('platform is invalid');
    } else if (has(platforms, details.platform)) {
        throw new Error(`platform['${details.platform}'] already registered`);
    } else {
        digest.platform = details.platform;
    }

    // validate details.authURI
    if (!has(details, 'authURI') || details.authURI == null) {
        throw new TypeError('authURI is missing');
    } else if (typeof details.authURI !== 'string' || details.authURI === '') {
        throw new TypeError('authURI is invalid');
    } else {
        digest.authURI = details.authURI;
    }

    // validate details.clientId
    if (!has(details, 'clientId') || details.clientId == null) {
        throw new TypeError('clientId is missing');
    } else if (typeof details.clientId !== 'string' || details.clientId === '') {
        throw new TypeError('clientId is invalid');
    } else {
        digest.clientId = details.clientId;
    }

    // validate details.grant
    if (!has(details, 'responseType') || details.responseType == null) {
        throw new TypeError('responseType is missing');
    } else if (details.responseType !== 'code' && details.responseType !== 'token') {
        throw new TypeError('responseType is invalid');
    } else {
        digest.responseType = details.responseType;
    }

    // validate details.scope
    if (has(details, 'scope') && details.scope != null) {
        if (!Array.isArray(details.scope)) {
            throw new TypeError('scope is invalid');
        }
        let scopeList = [],
            idx = details.scope.findIndex(val => {
                if (val == null || typeof val !== 'string' || val === '') {
                    return true;
                }
                scopeList.push(val);
                return false;
            });

        if (idx > -1) {
            throw new TypeError(`scope[${idx}] is invalid`);
        }
        digest.scope = scopeList;
    }

    // everything valid; store the platform
    platforms[digest.platform] = digest;
};

/**@desc Unregisters a platform
   @param {string} platform The previously registered platform to unregister
   @param {object} [options]
   @param {boolean} [options.abortPending=false] If true, all pending auth attempts for the platform are aborted
*/
module.exports.unregister = function unregister(platform, options = {}) {

    // validate platform
    if (platform == null || typeof platform !== 'string') {
        throw new TypeError('platform is invalid');
    }
    if (!has(platforms, platform)) {
        throw new Error(`platform['${platform}'] not registered`);
    }
    delete platforms[platform];

    // options.aportPending
    if (has(options, 'abortPending')) {
        let toAbort = [];

        // loop over pending
        Object.keys(pending).forEach(id => {

            // if the pending instance is for the specified platform, store the id to abort momentarily
            if (pending[id] !== null && pending[id].platform === platform) {
                toAbort.push(id);
            }
        });

        // abort matched pending ids
        toAbort.forEach(abortAuth);
    }
};

/**@desc Opens system browser for the user to authorize app to the specified platform
   @param {object} details
   @param {string}          details.platform The registered platform to perform the auth on
   @param {PerformCallback} details.callback The callback for when the auth completes
   @param {boolean}         [details.openExternalBrowser=true] If true, an external browser instance is opened
   @param {array<string>}   [details.scope] List of scopes to request access to; if not specified the list provided when the platform was registered is used. If neither exist and error is thrown
   @returns {object} Conforms to {id, uri}; where id is the pending auth's unique id, and uri is the uri to direct the user to
*/
module.exports.perform = function perform(details) {
    if (details == null) {
        throw new TypeError('details is missing');
    }

    let auth = {};

    // validate details.platform
    if (!has(details, 'platform') || details.platform == null) {
        throw new TypeError('platform is missing');
    }
    if (typeof details.platform !== 'string' || details.platform === '') {
        throw new TypeError('platform is invalid');
    }
    if (!has(platforms, details.platform)) {
        throw new TypeError(`platform['${details.platform}'] not regiester`);
    }
    auth.platform = details.platform;

    // validate details.callback
    if (!has(details, 'callback') || details.callback == null) {
        throw new TypeError('callback is missing');
    }
    if (typeof details.callback !== 'function') {
        throw new TypeError('callback is invalid');
    }
    auth.callback = details.callback;

    // validate details.openExternalBrowser
    if (!has(details, 'openExternalBrowser') || details.openExternalBrowser == null) {
        auth.openExternalBrowser = true;
    } else if (typeof details.openExternalBrowser !== 'boolean') {
        throw new TypeError('openExternalBrowser is invalid');
    } else {
        auth.openExternalBrowser = details.openExternalBrowser;
    }

    // details.scope not specified
    if (!has(details, 'scope') || details.scope == null) {

        // no scope list stored with the platform
        if (!has(platforms[auth.platform], 'scope')) {
            throw new TypeError('scope list not found');
        }

        // clone scope list
        auth.scope = platforms[auth.platform].scope.slice(0);

    // validate details.scope
    } else if (!Array.isArray(details.scope)) {
        throw new TypeError('scope list is invalid');

    } else {
        let scopeList = [];

        // attempt to find first invalid scope list item
        let idx = details.scope.findIndex(val => {

            // scope list item invalid
            if (val == null || typeof val !== 'string' || val === '') {
                return true;
            }

            // scope list item valid
            scopeList.push(val);
            return true;
        });

        // invalid scope list item found
        if (idx > -1) {
            throw new TypeError(`scope[${idx}] is invalid`);
        }

        // all scope list items valid
        auth.scope = scopeList;
    }


    /*  all checks passed  */

    // generate id for the auth
    auth.id = generateId();


    let platform = platforms[auth.platform];

    // build query string
    let qs = querystring.stringify({
        state: `${settings.getWebServerPort()};${auth.id}`,
        client_id: platform.clientId, // eslint-disable-line camelcase
        response_type: platform.responseType, // eslint-disable-line camelcase
        redirect_uri: redirectURI, // eslint-disable-line camelcase
        scope: auth.scope.join(" ")
    });

    // build uri
    auth.uri = `${platform.authURI}?${qs}`;

    // start timeout
    auth.timeout = setTimeout(abortAuth, idTimeout, auth.id);

    // open external browser if applicable
    if (auth.openExternalBrowser === true) {
        shell.openExternal(auth.uri);
    }

    // return the id and uri
    return {
        id: auth.id,
        uri: auth.uri
    };
};

/**@desc Aborts a pending authorization - essentially invalidating the uniqueid/state
   @param {string} id The unique id for the pending authorization that was returned by .perform()
*/
module.exports.abort = function abort(id) {
    if (id == null) {
        throw new TypeError('id is missing');
    }
    if (typeof id !== 'string' || id === '') {
        throw new TypeError('id is invalid');
    }
    if (!has(pending, id)) {
        throw new Error(`id['${id}'] not pending`);
    }
    abortAuth(id);
};