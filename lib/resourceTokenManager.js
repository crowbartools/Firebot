'use strict';

// store token > filepath relationships
const tokens = {};

function deleteToken(token) {
    setTimeout((t) => {
        if (tokens[t] !== undefined) {
            delete tokens[t];
        }
    }, 1000, token);
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
    // 1 second delay before deletion to  allow multiple requests at once.
    if (resource !== undefined) {
        deleteToken(token);
    }
    return resource;
}

function storeResourcePath(path) {
    let token = newToken();
    tokens[token] = path;
    return token;
}


exports.getResourcePath = getResourcePath;
exports.storeResourcePath = storeResourcePath;
