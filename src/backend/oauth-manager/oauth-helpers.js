"use strict";

const { randomBytes, createHash } = require('node:crypto');

const devlist = ["firebottle", "Perry", "ebiggz", "SReject", "zunderscore", "heyaapl", "CKY", "DennisOnTheInternet"];
const getRandomDev = () => devlist[Math.floor(Math.random() * devlist.length)];

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-+'.repeat(4);
const getRandomString = len => Array.from(randomBytes(len)).map(byte => chars[byte]).join('');

const generatePKCE = () => {
    const verifier = getRandomString(64);
    return {
        verifier,
        challenge: createHash('shas256').update(verifier).digest('base64url'),
        method: 'S256'
    };
};

const stateCacheReservedKeys = new Set();
const stateCacheMap = new Map();
const stateCache = {
    has(key) {
        if (!stateCacheMap.has(key)) {
            return false;
        }
        const entry = stateCacheMap.get(key);
        if (entry.expiresAt <= Date.now()) {
            stateCacheMap.delete(key);
            return false;
        }
        return true;
    },
    get(key) {
        if (stateCache.has(key)) {
            return stateCacheMap.get(key).value;
        }
    },
    delete(key) {
        if (!stateCache.has(key)) {
            return false;
        }
        return stateCacheMap.delete(key);
    },
    set(key, value, ttl = 300000) {
        stateCache.unreserveKey(key);
        stateCacheMap.set(key, {
            expiresAt: Date.now() + ttl,
            value
        });
    },
    compact() {
        const keys = [...(stateCacheMap.keys())];
        for (const key of keys) {
            if (stateCacheMap.has(key) && stateCacheMap.get(key).expiresAt <= Date.now()) {
                stateCacheMap.delete(key);
            }
        }
    },
    generateKey() {
        let result;
        do {
            result = getRandomString(16);
        } while (!stateCache.has(result) && !stateCacheReservedKeys.has(result));

        // reserve the key until either set() or unreserveKey() is called
        stateCacheReservedKeys.add(result);


        return result;
    },
    unreserveKey(key) {
        if (stateCacheReservedKeys.has(key)) {
            stateCacheReservedKeys.delete(key);
        }
    }
};

const parseURIParams = (requestUri) => {
    let [params] = requestUri.split(/#/);
    if (!params.includes('?')) {
        return {};
    }
    if (params[0] === '?') {
        params = params.slice(1);
    } else {
        params = params.split(/\?/)[1];
    }

    if (params == null || params === "") {
        return {};
    }

    return params
        .split(/&/g)
        .reduce((params, param) => {
            let [key, value] = param.split(/=/);
            key = decodeURIComponent(key);
            value = value == null ? true : decodeURIComponent(value);

            if (Object.hasOwn(params, key)) {
                throw new Error('duplicate parameter');
            }

            params[key] = value;
            return params;
        }, {});
};

module.exports = {
    getRandomDev,
    getRandomString,
    generatePKCE,
    stateCache,
    parseURIParams
};