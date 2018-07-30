'use strict';

const logger = require('./logwrapper');
// store token > filepath relationships
const tokens = {};

function deleteToken(token) {
    logger.debug("Deleting token: " + token);
    if (tokens[token] !== undefined) {
        delete tokens[token];
    }
}

function rand() {
    return Math.random().toString(36).substr(2);
}

function newToken() {
    // Generate a token by combining two randomly generated numbers that are converted to base 36
    return rand() + rand();
}

function getResourcePath(token) {
    let resource = tokens[token];

    // delete the token if we actually had something saved.
    // delay for the given length before deletion to allow multiple requests at once and loading.
    if (resource !== undefined) {
        setTimeout((t) => {
            deleteToken(t);
        }, resource.length, token);
    }
    return resource.path;
}

function storeResourcePath(path, length) {

    if (length != null && !isNaN(length)) {
        length = parseFloat(length);
    } else {
        length = 5;
    }

    let token = newToken();
    tokens[token] = { path: path, length: length * 1000 };
    return token;
}

exports.getResourcePath = getResourcePath;
exports.storeResourcePath = storeResourcePath;
